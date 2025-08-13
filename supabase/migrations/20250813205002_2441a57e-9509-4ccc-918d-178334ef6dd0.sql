-- Créer la table review_requests pour les demandes d'avis
CREATE TABLE public.review_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL,
  client_id UUID,
  caregiver_id UUID,
  review_date DATE NOT NULL,
  satisfaction_rating INTEGER,
  city TEXT,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT review_requests_rating_check CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  CONSTRAINT review_requests_status_check CHECK (status IN ('pending', 'completed', 'expired')),
  CONSTRAINT review_requests_contact_check CHECK (
    (client_id IS NOT NULL AND caregiver_id IS NULL) OR 
    (client_id IS NULL AND caregiver_id IS NOT NULL)
  )
);

-- Créer la table client_reviews pour les avis complétés
CREATE TABLE public.client_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_request_id UUID NOT NULL REFERENCES public.review_requests(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  comments TEXT,
  reviewer_name TEXT,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT client_reviews_rating_check CHECK (rating >= 1 AND rating <= 5)
);

-- Activer RLS sur les deux tables
ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_reviews ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour review_requests
CREATE POLICY "Professionals can manage their own review requests" 
ON public.review_requests 
FOR ALL 
USING (professional_id = auth.uid())
WITH CHECK (professional_id = auth.uid());

CREATE POLICY "Admin can view all review requests" 
ON public.review_requests 
FOR SELECT 
USING (is_admin());

-- Politiques RLS pour client_reviews
CREATE POLICY "Public can view completed reviews for mini-sites" 
ON public.client_reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Reviews can be created via public form" 
ON public.client_reviews 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Professionals can view their reviews" 
ON public.client_reviews 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.review_requests rr
    WHERE rr.id = client_reviews.review_request_id 
    AND rr.professional_id = auth.uid()
  )
);

-- Trigger pour mettre à jour le statut des demandes d'avis
CREATE OR REPLACE FUNCTION public.update_review_request_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.review_requests 
  SET status = 'completed', updated_at = now()
  WHERE id = NEW.review_request_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_review_request_status_trigger
  AFTER INSERT ON public.client_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_review_request_status();

-- Fonction pour générer des tokens uniques
CREATE OR REPLACE FUNCTION public.generate_review_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
BEGIN
  token := encode(gen_random_bytes(32), 'base64');
  token := translate(token, '+/=', '-_');
  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour générer automatiquement les tokens
CREATE OR REPLACE FUNCTION public.set_review_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.token IS NULL OR NEW.token = '' THEN
    NEW.token = public.generate_review_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_review_token_trigger
  BEFORE INSERT ON public.review_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_review_token();