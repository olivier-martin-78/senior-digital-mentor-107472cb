
-- Add client evaluation fields to intervention_reports table
ALTER TABLE intervention_reports 
ADD COLUMN IF NOT EXISTS client_rating integer,
ADD COLUMN IF NOT EXISTS client_comments text;
