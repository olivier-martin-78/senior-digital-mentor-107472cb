
-- Ajouter la colonne iframe_code à la table activities
ALTER TABLE public.activities 
ADD COLUMN iframe_code TEXT;

-- Mettre à jour la politique RLS pour permettre l'insertion avec iframe_code
-- (Les politiques existantes devraient déjà couvrir ce cas, mais on s'assure que tout fonctionne)
