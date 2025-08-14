-- Corriger la fonction get_review_request_by_token pour utiliser display_name au lieu de first_name/last_name
CREATE OR REPLACE FUNCTION public.get_review_request_by_token(token_param TEXT)
RETURNS TABLE(
  id UUID,
  professional_id UUID,
  client_id UUID,
  caregiver_id UUID,
  review_date DATE,
  satisfaction_rating INTEGER,
  city TEXT,
  status TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  professional_name TEXT,
  client_name TEXT,
  caregiver_name TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rr.id,
    rr.professional_id,
    rr.client_id,
    rr.caregiver_id,
    rr.review_date,
    rr.satisfaction_rating,
    rr.city,
    rr.status,
    rr.expires_at,
    p.display_name as professional_name,
    CASE 
      WHEN rr.client_id IS NOT NULL THEN CONCAT(c.first_name, ' ', c.last_name)
      ELSE NULL
    END as client_name,
    CASE 
      WHEN rr.caregiver_id IS NOT NULL THEN CONCAT(cg.first_name, ' ', cg.last_name)
      ELSE NULL
    END as caregiver_name
  FROM public.review_requests rr
  LEFT JOIN public.profiles p ON rr.professional_id = p.id
  LEFT JOIN public.clients c ON rr.client_id = c.id
  LEFT JOIN public.caregivers cg ON rr.caregiver_id = cg.id
  WHERE rr.token = token_param
    AND rr.status = 'pending'
    AND rr.expires_at > now();
END;
$$;