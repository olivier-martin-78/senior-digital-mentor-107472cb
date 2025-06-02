
CREATE OR REPLACE FUNCTION public.process_invitation_transaction(
  invitation_id uuid,
  user_id uuid,
  group_id uuid,
  validated_permissions jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Ajouter l'utilisateur au groupe avec le rôle 'guest'
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (group_id, user_id, 'guest')
  ON CONFLICT (group_id, user_id) DO NOTHING;
  
  -- Marquer l'invitation comme utilisée avec les permissions validées
  UPDATE public.invitations 
  SET 
    used_at = now(),
    blog_access = (validated_permissions->>'blog_access')::boolean,
    life_story_access = (validated_permissions->>'life_story_access')::boolean,
    diary_access = (validated_permissions->>'diary_access')::boolean,
    wishes_access = (validated_permissions->>'wishes_access')::boolean
  WHERE id = invitation_id;
  
  -- Changer le rôle de l'utilisateur à 'reader'
  UPDATE public.user_roles 
  SET role = 'reader' 
  WHERE user_id = user_id;
  
  -- Synchroniser les permissions
  PERFORM public.sync_invitation_permissions(invitation_id);
END;
$$;
