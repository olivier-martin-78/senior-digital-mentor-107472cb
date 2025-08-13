-- Add client_comment column to review_requests table
ALTER TABLE public.review_requests 
ADD COLUMN client_comment TEXT;