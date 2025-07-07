
-- Table pour tracker les notifications lues par les utilisateurs
CREATE TABLE public.user_notifications_read (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('blog', 'diary', 'wish')),
  content_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);

-- Table pour tracker les messages lus dans l'espace de coordination
CREATE TABLE public.user_messages_read_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES caregiver_messages(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, message_id)
);

-- Table pour tracker le statut de lecture des contenus
CREATE TABLE public.user_content_read_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('blog', 'diary', 'wish')),
  content_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);

-- Activer RLS sur toutes les tables
ALTER TABLE public.user_notifications_read ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_messages_read_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_content_read_status ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour user_notifications_read
CREATE POLICY "Users can view their own notification reads" 
  ON public.user_notifications_read 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notification reads" 
  ON public.user_notifications_read 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Politiques RLS pour user_messages_read_status
CREATE POLICY "Users can view their own message reads" 
  ON public.user_messages_read_status 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own message reads" 
  ON public.user_messages_read_status 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Politiques RLS pour user_content_read_status
CREATE POLICY "Users can view their own content reads" 
  ON public.user_content_read_status 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own content reads" 
  ON public.user_content_read_status 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content reads" 
  ON public.user_content_read_status 
  FOR UPDATE 
  USING (auth.uid() = user_id);
