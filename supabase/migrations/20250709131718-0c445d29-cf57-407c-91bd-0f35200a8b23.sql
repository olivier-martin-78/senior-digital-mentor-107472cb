-- Corriger la fonction create_invitation_group pour ajouter automatiquement le créateur comme membre
CREATE OR REPLACE FUNCTION public.create_invitation_group()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  inviter_name text;
  group_name text;
  new_group_id uuid;
BEGIN
  -- Récupérer le nom de l'inviteur
  SELECT COALESCE(display_name, email) INTO inviter_name
  FROM public.profiles 
  WHERE id = NEW.invited_by;
  
  -- Créer le nom du groupe
  group_name := 'Invités de ' || COALESCE(inviter_name, 'Utilisateur');
  
  -- Vérifier si un groupe existe déjà pour cet inviteur
  SELECT id INTO new_group_id
  FROM public.invitation_groups
  WHERE created_by = NEW.invited_by
  LIMIT 1;
  
  -- Si aucun groupe n'existe, en créer un
  IF new_group_id IS NULL THEN
    INSERT INTO public.invitation_groups (name, created_by)
    VALUES (group_name, NEW.invited_by)
    RETURNING id INTO new_group_id;
    
    -- CORRECTION: Ajouter automatiquement le créateur comme membre avec le rôle 'owner'
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (new_group_id, NEW.invited_by, 'owner');
  END IF;
  
  -- Associer l'invitation au groupe
  NEW.group_id := new_group_id;
  
  RETURN NEW;
END;
$function$;

-- Migration rétroactive : Ajouter tous les créateurs de groupes existants comme membres de leurs groupes
INSERT INTO public.group_members (group_id, user_id, role)
SELECT ig.id, ig.created_by, 'owner'
FROM public.invitation_groups ig
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.group_members gm 
  WHERE gm.group_id = ig.id 
  AND gm.user_id = ig.created_by
)
ON CONFLICT (group_id, user_id) DO NOTHING;

-- Vérification : Afficher les groupes et leurs membres après correction
SELECT 
  ig.name as group_name,
  ig.created_by as creator_id,
  (SELECT email FROM public.profiles WHERE id = ig.created_by) as creator_email,
  COUNT(gm.user_id) as total_members,
  ARRAY_AGG(gm.role) as member_roles
FROM public.invitation_groups ig
LEFT JOIN public.group_members gm ON ig.id = gm.group_id
GROUP BY ig.id, ig.name, ig.created_by
ORDER BY ig.created_at;