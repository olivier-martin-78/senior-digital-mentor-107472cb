-- Ajouter un système de statut pour les souhaits

-- 1. Créer un type enum pour les statuts de souhaits
CREATE TYPE public.wish_status AS ENUM ('pending', 'fulfilled', 'cancelled');

-- 2. Ajouter la colonne status à la table wish_posts
ALTER TABLE public.wish_posts 
ADD COLUMN status public.wish_status NOT NULL DEFAULT 'pending';

-- 3. Ajouter un index sur la colonne status pour optimiser les requêtes de filtrage
CREATE INDEX idx_wish_posts_status ON public.wish_posts(status);

-- 4. Ajouter une colonne pour tracer qui a changé le statut et quand
ALTER TABLE public.wish_posts 
ADD COLUMN status_changed_by uuid REFERENCES auth.users(id),
ADD COLUMN status_changed_at timestamp with time zone;

-- 5. Créer une fonction pour mettre à jour automatiquement les métadonnées de changement de statut
CREATE OR REPLACE FUNCTION public.update_wish_status_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le statut a changé, mettre à jour les métadonnées
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_changed_by = auth.uid();
    NEW.status_changed_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Créer un trigger pour automatiser la mise à jour des métadonnées
CREATE TRIGGER update_wish_status_metadata_trigger
  BEFORE UPDATE ON public.wish_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_wish_status_metadata();