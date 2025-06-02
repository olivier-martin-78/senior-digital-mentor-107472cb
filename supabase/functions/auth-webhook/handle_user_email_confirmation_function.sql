
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  invitation_record record;
BEGIN
  -- Vérifier si l'email vient d'être confirmé (passage de null à une date)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    -- S'assurer que le display_name est bien copié dans le profil si ce n'est pas déjà fait
    UPDATE public.profiles 
    SET display_name = COALESCE(display_name, NEW.raw_user_meta_data ->> 'display_name')
    WHERE id = NEW.id AND display_name IS NULL;
    
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
      
      -- Ajouter l'utilisateur au groupe avec le rôle 'guest'
      INSERT INTO public.group_members (group_id, user_id, role)
      VALUES (invitation_record.group_id, NEW.id, 'guest')
      ON CONFLICT (group_id, user_id) DO NOTHING;
      
      -- Marquer l'invitation comme utilisée
      UPDATE public.invitations 
      SET used_at = now() 
      WHERE id = invitation_record.invitation_id;
      
      -- IMPORTANT: Changer le rôle de l'utilisateur de 'editor' à 'reader'
      -- car c'est une personne invitée
      UPDATE public.user_roles 
      SET role = 'reader' 
      WHERE user_id = NEW.id;
      
      -- NOUVEAU: Synchroniser les permissions basées sur l'invitation
      PERFORM public.sync_invitation_permissions(invitation_record.invitation_id);
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;
