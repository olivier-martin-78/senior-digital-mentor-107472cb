-- Corriger les fonctions pour ajouter SET search_path TO ''
CREATE OR REPLACE FUNCTION public.update_review_request_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.review_requests 
  SET status = 'completed', updated_at = now()
  WHERE id = NEW.review_request_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '';

CREATE OR REPLACE FUNCTION public.generate_review_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
BEGIN
  token := encode(gen_random_bytes(32), 'base64');
  token := translate(token, '+/=', '-_');
  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '';

CREATE OR REPLACE FUNCTION public.set_review_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.token IS NULL OR NEW.token = '' THEN
    NEW.token = public.generate_review_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path TO '';

-- Fonction pour récupérer une demande d'avis par token (pour la page publique)
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
) AS $$
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
    CONCAT(p.first_name, ' ', p.last_name) as professional_name,
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '';