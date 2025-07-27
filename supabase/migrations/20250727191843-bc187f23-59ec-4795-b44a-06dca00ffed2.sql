-- Créer la table de suivi des actions utilisateurs
CREATE TABLE public.user_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('create', 'update', 'view', 'delete')),
  content_type TEXT NOT NULL CHECK (content_type IN ('activity', 'blog_post', 'diary_entry', 'wish_post', 'life_story')),
  content_id UUID NOT NULL,
  content_title TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer des index pour optimiser les performances
CREATE INDEX idx_user_actions_user_id ON public.user_actions(user_id);
CREATE INDEX idx_user_actions_timestamp ON public.user_actions(timestamp DESC);
CREATE INDEX idx_user_actions_content_type ON public.user_actions(content_type);
CREATE INDEX idx_user_actions_action_type ON public.user_actions(action_type);
CREATE INDEX idx_user_actions_content_id ON public.user_actions(content_id);

-- Activer RLS
ALTER TABLE public.user_actions ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs authentifiés d'enregistrer leurs actions
CREATE POLICY "Users can insert their own actions" 
ON public.user_actions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Politique pour permettre aux administrateurs de voir toutes les actions
CREATE POLICY "Admins can view all actions" 
ON public.user_actions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Politique pour permettre aux administrateurs de supprimer les actions (pour nettoyage)
CREATE POLICY "Admins can delete actions" 
ON public.user_actions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);