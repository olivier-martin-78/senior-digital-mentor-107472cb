
CREATE OR REPLACE FUNCTION public.get_public_mini_site_reviews(p_slug text)
RETURNS TABLE (
  client_rating integer,
  client_comments text,
  created_at timestamptz,
  patient_name text,
  auxiliary_name text,
  client_city text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT
    ir.client_rating,
    ir.client_comments,
    ir.created_at,
    ir.patient_name,
    ir.auxiliary_name,
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
  ORDER BY ir.created_at DESC
  LIMIT 50;
$function$;
