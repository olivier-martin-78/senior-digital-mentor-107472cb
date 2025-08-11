-- Allow public access to intervention reports reviews for published mini-sites
CREATE POLICY "Public can view reviews for published mini sites" 
ON intervention_reports 
FOR SELECT 
USING (
  (client_rating IS NOT NULL OR client_comments IS NOT NULL)
  AND EXISTS (
    SELECT 1 FROM mini_sites 
    WHERE mini_sites.user_id = intervention_reports.professional_id 
    AND mini_sites.is_published = true
  )
);