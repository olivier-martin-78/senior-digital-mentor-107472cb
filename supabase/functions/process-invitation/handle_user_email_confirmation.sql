
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  invitation_record record;
  process_result jsonb;
BEGIN
  -- Vérifier si l'email vient d'être confirmé (passage de null à une date)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    -- Chercher une invitation pour cet email
    SELECT i.group_id, i.id as invitation_id
    INTO invitation_record
    FROM public.invitations i
    WHERE i.email = NEW.email 
      AND i.used_at IS NULL
      AND i.expires_at > now()
    LIMIT 1;
    
    -- Si une invitation existe et qu'un groupe est associé
    IF invitation_record.group_id IS NOT NULL THEN
      
      -- Utiliser la nouvelle fonction sécurisée pour traiter l'invitation
      BEGIN
        -- Appel à la fonction edge via webhook interne (simulation)
        -- En pratique, on traite directement ici pour éviter la complexité du webhook
        
        -- Récupérer l'invitation complète
        SELECT * INTO invitation_record
        FROM public.invitations
        WHERE id = invitation_record.invitation_id;
        
        -- Valider les permissions
        DECLARE
          validated_perms jsonb := jsonb_build_object(
            'blog_access', COALESCE(invitation_record.blog_access, false),
            'life_story_access', COALESCE(invitation_record.life_story_access, false),
            'diary_access', COALESCE(invitation_record.diary_access, false),
            'wishes_access', COALESCE(invitation_record.wishes_access, false)
          );
        BEGIN
          -- Traiter l'invitation avec validation
          PERFORM public.process_invitation_transaction(
            invitation_record.invitation_id,
            NEW.id,
            invitation_record.group_id,
            validated_perms
          );
          
          -- Log du succès
          RAISE LOG 'Invitation traitée avec succès pour % avec permissions %', 
            NEW.email, validated_perms;
            
        EXCEPTION WHEN OTHERS THEN
          -- Log de l'erreur mais ne pas bloquer la création de compte
          RAISE LOG 'Erreur lors du traitement de l''invitation pour %: %', 
            NEW.email, SQLERRM;
        END;
        
      EXCEPTION WHEN OTHERS THEN
        -- Log de l'erreur mais ne pas bloquer la création de compte
        RAISE LOG 'Erreur critique lors du traitement de l''invitation pour %: %', 
          NEW.email, SQLERRM;
      END;
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;
