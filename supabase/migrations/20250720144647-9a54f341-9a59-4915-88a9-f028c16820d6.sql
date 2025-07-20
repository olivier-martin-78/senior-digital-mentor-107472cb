-- Insérer la sous-activité "Remue-méninges" pour les jeux
INSERT INTO public.activity_sub_tags (name, activity_type, created_by)
VALUES ('Remue-méninges', 'games', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;