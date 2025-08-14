-- Modifier la fonction get_public_mini_site_reviews pour inclure les avis du système client_reviews
CREATE OR REPLACE FUNCTION public.get_public_mini_site_reviews(p_slug TEXT)
RETURNS TABLE(
  client_rating INTEGER,
  client_comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  patient_name TEXT,
  auxiliary_name TEXT,
  client_city TEXT
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
  -- Récupérer les avis des rapports d'intervention
  SELECT
    ir.client_rating,
    ir.client_comments,
    ir.created_at,
    ir.patient_name,
    NULL::text as auxiliary_name,
    ir.client_city
  FROM public.mini_sites ms
  JOIN public.intervention_reports ir
    ON ir.professional_id = ms.user_id
  LEFT JOIN public.appointments a
    ON ir.appointment_id = a.id
  LEFT JOIN public.intervenants i
    ON a.intervenant_id = i.id
  WHERE
    ms.slug = p_slug
    AND ms.is_published = true
    AND (ir.client_rating IS NOT NULL OR ir.client_comments IS NOT NULL)
    AND (
      a.intervenant_id IS NULL
      OR i.email = ms.email
    )
  
  UNION ALL
  
  -- Récupérer les avis du système client_reviews
  SELECT
    cr.rating as client_rating,
    cr.comments as client_comments,
    cr.completed_at as created_at,
    cr.reviewer_name as patient_name,
    NULL::text as auxiliary_name,
    rr.city as client_city
  FROM public.mini_sites ms
  JOIN public.review_requests rr ON rr.professional_id = ms.user_id
  JOIN public.client_reviews cr ON cr.review_request_id = rr.id
  WHERE
    ms.slug = p_slug
    AND ms.is_published = true
    AND rr.status = 'completed'
    AND (cr.rating IS NOT NULL OR cr.comments IS NOT NULL)
  
  ORDER BY created_at DESC
  LIMIT 50;
$$;