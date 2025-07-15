-- Ajouter la colonne "what_learned_today" à la table diary_entries
ALTER TABLE public.diary_entries 
ADD COLUMN what_learned_today text;