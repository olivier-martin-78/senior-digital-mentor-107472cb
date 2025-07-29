-- Améliorer la fonction de suppression complète d'utilisateur
CREATE OR REPLACE FUNCTION public.delete_user_completely(user_id_to_delete uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Supprimer les données liées aux interventions en premier (pour respecter les FK)
  DELETE FROM public.intervention_reports WHERE professional_id = user_id_to_delete;
  
  -- Supprimer les rendez-vous créés par l'utilisateur
  DELETE FROM public.appointments WHERE professional_id = user_id_to_delete;
  
  -- Supprimer les messages dans l'espace de communication
  DELETE FROM public.caregiver_messages WHERE author_id = user_id_to_delete;
  
  -- Supprimer les proche-aidants (via les clients que l'utilisateur a créés)
  DELETE FROM public.caregivers WHERE client_id IN (
    SELECT id FROM public.clients WHERE created_by = user_id_to_delete
  );
  
  -- Supprimer les clients créés par l'utilisateur
  DELETE FROM public.clients WHERE created_by = user_id_to_delete;
  
  -- Supprimer les intervenants créés par l'utilisateur
  DELETE FROM public.intervenants WHERE created_by = user_id_to_delete;
  
  -- Supprimer les permissions utilisateur
  DELETE FROM public.user_client_permissions WHERE user_id = user_id_to_delete;
  DELETE FROM public.user_intervenant_permissions WHERE user_id = user_id_to_delete;
  
  -- Supprimer toutes les autres données associées à l'utilisateur (code existant)
  DELETE FROM public.user_roles WHERE user_id = user_id_to_delete;
  DELETE FROM public.notification_subscriptions WHERE subscriber_id = user_id_to_delete OR author_id = user_id_to_delete;
  DELETE FROM public.group_members WHERE user_id = user_id_to_delete;
  DELETE FROM public.invitations WHERE invited_by = user_id_to_delete;
  DELETE FROM public.invitation_groups WHERE created_by = user_id_to_delete;
  
  -- Supprimer les contenus créés par l'utilisateur
  DELETE FROM public.blog_comments WHERE author_id = user_id_to_delete;
  DELETE FROM public.blog_media WHERE post_id IN (SELECT id FROM public.blog_posts WHERE author_id = user_id_to_delete);
  DELETE FROM public.blog_posts WHERE author_id = user_id_to_delete;
  DELETE FROM public.blog_albums WHERE author_id = user_id_to_delete;
  DELETE FROM public.diary_entries WHERE user_id = user_id_to_delete;
  DELETE FROM public.life_stories WHERE user_id = user_id_to_delete;
  DELETE FROM public.wish_posts WHERE author_id = user_id_to_delete;
  DELETE FROM public.wish_albums WHERE author_id = user_id_to_delete;
  
  -- Supprimer les actions utilisateur
  DELETE FROM public.user_actions WHERE user_id = user_id_to_delete;
  
  -- Supprimer le profil utilisateur
  DELETE FROM public.profiles WHERE id = user_id_to_delete;
  
  -- Enfin, supprimer l'utilisateur de auth.users (ceci va déclencher la suppression en cascade)
  DELETE FROM auth.users WHERE id = user_id_to_delete;
END;
$function$