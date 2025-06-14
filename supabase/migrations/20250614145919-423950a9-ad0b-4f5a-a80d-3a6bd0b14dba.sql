
-- Remplacer l'email par l'email de Bruno Pierre si besoin (ou adapte ci-dessous si tu as déjà son user_id)
WITH target_user AS (
  SELECT id AS user_id FROM auth.users WHERE email = 'olivier.fernandez15@sfr.fr'
)
DELETE FROM public.user_client_permissions ucp
USING target_user
WHERE ucp.user_id = target_user.user_id
AND NOT EXISTS (
  -- Garder la permission UNIQUEMENT si Bruno Pierre est bien intervenant dans un rendez-vous relatif au client
  SELECT 1
  FROM public.appointments a
  WHERE a.client_id = ucp.client_id
    AND a.intervenant_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.intervenants i
      WHERE i.id = a.intervenant_id
        AND i.email = 'olivier.fernandez15@sfr.fr'
    )
);

-- Ce script supprimera toutes les permissions clients pour Bruno Pierre si, pour ce client,
-- il n'est jamais intervenant (selon la table appointments et intervenants/email).
