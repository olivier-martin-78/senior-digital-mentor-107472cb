-- Create fitness articles system with categories and view tracking

-- Create fitness categories table with predefined categories
CREATE TABLE public.fitness_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_predefined BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Insert the 6 predefined categories
INSERT INTO public.fitness_categories (name, is_predefined) VALUES
  ('Sociabiliser', true),
  ('Bien manger', true),
  ('Engager son cerveau', true),
  ('Activités physiques', true),
  ('Sommeil réparateur', true),
  ('Gestion du stress', true);

-- Create fitness articles table
CREATE TABLE public.fitness_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  content TEXT NOT NULL,
  category_id UUID REFERENCES public.fitness_categories(id) ON DELETE CASCADE,
  image_url TEXT,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fitness article views tracking table
CREATE TABLE public.fitness_article_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.fitness_articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_fitness_articles_category ON public.fitness_articles(category_id);
CREATE INDEX idx_fitness_articles_published ON public.fitness_articles(published);
CREATE INDEX idx_fitness_articles_view_count ON public.fitness_articles(view_count DESC);
CREATE INDEX idx_fitness_articles_created_at ON public.fitness_articles(created_at DESC);
CREATE INDEX idx_fitness_article_views_article_id ON public.fitness_article_views(article_id);
CREATE INDEX idx_fitness_article_views_viewed_at ON public.fitness_article_views(viewed_at DESC);

-- Enable RLS on all tables
ALTER TABLE public.fitness_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_article_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fitness_categories
CREATE POLICY "Everyone can view fitness categories" ON public.fitness_categories
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create custom categories" ON public.fitness_categories
  FOR INSERT WITH CHECK (auth.uid() = created_by AND is_predefined = false);

CREATE POLICY "Users can update their own custom categories" ON public.fitness_categories
  FOR UPDATE USING (auth.uid() = created_by AND is_predefined = false);

CREATE POLICY "Users can delete their own custom categories" ON public.fitness_categories
  FOR DELETE USING (auth.uid() = created_by AND is_predefined = false);

-- RLS Policies for fitness_articles
CREATE POLICY "Everyone can view published fitness articles" ON public.fitness_articles
  FOR SELECT USING (published = true OR author_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Authors can create fitness articles" ON public.fitness_articles
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own fitness articles" ON public.fitness_articles
  FOR UPDATE USING (auth.uid() = author_id OR 
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Authors can delete their own fitness articles" ON public.fitness_articles
  FOR DELETE USING (auth.uid() = author_id OR 
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- RLS Policies for fitness_article_views
CREATE POLICY "Anyone can create article views" ON public.fitness_article_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view article views" ON public.fitness_article_views
  FOR SELECT USING (true);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_fitness_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fitness_articles_updated_at
  BEFORE UPDATE ON public.fitness_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_fitness_articles_updated_at();

-- Create function to increment view count and track views
CREATE OR REPLACE FUNCTION public.increment_fitness_article_views(article_id_param UUID, user_id_param UUID DEFAULT NULL, ip_address_param INET DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert view record
  INSERT INTO fitness_article_views (article_id, user_id, ip_address)
  VALUES (article_id_param, user_id_param, ip_address_param);
  
  -- Update view count
  UPDATE fitness_articles 
  SET view_count = view_count + 1 
  WHERE id = article_id_param;
END;
$$;