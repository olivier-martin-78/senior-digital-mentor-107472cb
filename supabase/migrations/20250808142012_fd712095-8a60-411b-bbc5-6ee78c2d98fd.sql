-- Create mini_sites table
CREATE TABLE public.mini_sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Section 1: Entête
  site_name TEXT NOT NULL,
  site_subtitle TEXT,
  logo_url TEXT,
  logo_size INTEGER DEFAULT 150,
  
  -- Section 2: Carrousel (photos will be in separate table)
  professional_networks TEXT,
  
  -- Section 3: Contact
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  profession TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  postal_code TEXT,
  
  -- Section 4: About
  about_me TEXT,
  
  -- Section 5: Why this profession
  why_this_profession TEXT,
  
  -- Section 6: Skills
  skills_and_qualities TEXT,
  activity_start_date TEXT,
  
  -- Section 7: Services
  services_description TEXT,
  
  -- Section 8: Availability
  availability_schedule TEXT,
  intervention_radius TEXT,
  
  -- Section 10: Settings
  color_palette TEXT DEFAULT 'blue',
  design_style TEXT DEFAULT 'neutral' CHECK (design_style IN ('feminine', 'masculine', 'neutral')),
  
  -- Meta
  slug TEXT UNIQUE, -- nom.prenom.codepostal
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mini_site_media table for carousel photos
CREATE TABLE public.mini_site_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mini_site_id UUID NOT NULL REFERENCES public.mini_sites(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  caption TEXT,
  link_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mini_site_social_links table
CREATE TABLE public.mini_site_social_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mini_site_id UUID NOT NULL REFERENCES public.mini_sites(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'tiktok', 'linkedin', 'instagram', 'x', 'youtube')),
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mini_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mini_site_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mini_site_social_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mini_sites
CREATE POLICY "Users can view their own mini sites" 
ON public.mini_sites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mini sites" 
ON public.mini_sites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mini sites" 
ON public.mini_sites 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mini sites" 
ON public.mini_sites 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all mini sites" 
ON public.mini_sites 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Published mini sites are publicly viewable" 
ON public.mini_sites 
FOR SELECT 
USING (is_published = true);

-- RLS Policies for mini_site_media
CREATE POLICY "Users can manage their mini site media" 
ON public.mini_site_media 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.mini_sites 
  WHERE id = mini_site_media.mini_site_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Admins can manage all mini site media" 
ON public.mini_site_media 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Published mini site media is publicly viewable" 
ON public.mini_site_media 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.mini_sites 
  WHERE id = mini_site_media.mini_site_id 
  AND is_published = true
));

-- RLS Policies for mini_site_social_links
CREATE POLICY "Users can manage their mini site social links" 
ON public.mini_site_social_links 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.mini_sites 
  WHERE id = mini_site_social_links.mini_site_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Admins can manage all mini site social links" 
ON public.mini_site_social_links 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Published mini site social links are publicly viewable" 
ON public.mini_site_social_links 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.mini_sites 
  WHERE id = mini_site_social_links.mini_site_id 
  AND is_published = true
));

-- Create storage bucket for mini-sites media
INSERT INTO storage.buckets (id, name, public)
VALUES ('mini-sites-media', 'mini-sites-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for mini-sites media
CREATE POLICY "Users can upload their mini site media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'mini-sites-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view mini site media" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'mini-sites-media');

CREATE POLICY "Users can update their mini site media" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'mini-sites-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their mini site media" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'mini-sites-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_mini_sites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mini_sites_updated_at
BEFORE UPDATE ON public.mini_sites
FOR EACH ROW
EXECUTE FUNCTION public.update_mini_sites_updated_at();

-- Function to generate slug from name and postal code
CREATE OR REPLACE FUNCTION public.generate_mini_site_slug(
  p_first_name TEXT,
  p_last_name TEXT,
  p_postal_code TEXT
) RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      UNACCENT(p_first_name) || '.' || UNACCENT(p_last_name) || '.' || p_postal_code,
      '[^a-zA-Z0-9.]',
      '',
      'g'
    )
  );
END;
$$ LANGUAGE plpgsql;