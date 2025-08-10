-- Create table for homepage slides
CREATE TABLE public.homepage_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  button_text TEXT,
  button_link TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.homepage_slides ENABLE ROW LEVEL SECURITY;

-- Public read access for active slides
CREATE POLICY "Public can view active homepage slides"
ON public.homepage_slides
FOR SELECT
USING (is_active = true);

-- Admin-only modification access
CREATE POLICY "Admins can manage homepage slides"
ON public.homepage_slides
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_homepage_slides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_homepage_slides_updated_at
BEFORE UPDATE ON public.homepage_slides
FOR EACH ROW
EXECUTE FUNCTION public.update_homepage_slides_updated_at();

-- Insert default slide with current hero image
INSERT INTO public.homepage_slides (
  title,
  image_url,
  button_text,
  button_link,
  display_order,
  is_active,
  created_by
) VALUES (
  'Offrez-leur le digital, ils vous offriront leurs plus belles histoires.',
  '/lovable-uploads/268baaf6-cc72-4fd0-b786-6c48d7ee83bc11.png',
  'Partager mes souvenirs et mes photos sur un blog',
  '#activities-section',
  1,
  true,
  '00000000-0000-0000-0000-000000000000'
);