-- Permettre l'accès public aux review_requests via token pour les formulaires d'avis
CREATE POLICY "Allow public access to review_requests by token" 
ON public.review_requests 
FOR SELECT 
USING (
  token IS NOT NULL 
  AND status = 'pending' 
  AND expires_at > now()
);

-- Permettre l'accès public aux profils pour les review_requests
CREATE POLICY "Allow public access to profiles for review requests" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.review_requests rr
    WHERE rr.professional_id = profiles.id
    AND rr.token IS NOT NULL
    AND rr.status = 'pending'
    AND rr.expires_at > now()
  )
);

-- Permettre l'accès public aux clients pour les review_requests
CREATE POLICY "Allow public access to clients for review requests" 
ON public.clients 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.review_requests rr
    WHERE rr.client_id = clients.id
    AND rr.token IS NOT NULL
    AND rr.status = 'pending'
    AND rr.expires_at > now()
  )
);

-- Permettre l'accès public aux caregivers pour les review_requests
CREATE POLICY "Allow public access to caregivers for review requests" 
ON public.caregivers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.review_requests rr
    WHERE rr.caregiver_id = caregivers.id
    AND rr.token IS NOT NULL
    AND rr.status = 'pending'
    AND rr.expires_at > now()
  )
);

-- Permettre l'insertion publique d'avis clients
CREATE POLICY "Allow public insert for client reviews" 
ON public.client_reviews 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.review_requests rr
    WHERE rr.id = review_request_id
    AND rr.status = 'pending'
    AND rr.expires_at > now()
  )
);