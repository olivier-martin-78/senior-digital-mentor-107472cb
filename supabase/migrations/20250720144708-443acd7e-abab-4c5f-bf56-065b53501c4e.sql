-- Insérer la sous-activité "Remue-méninges" pour les jeux avec l'utilisateur admin actuel
INSERT INTO public.activity_sub_tags (name, activity_type, created_by)
VALUES ('Remue-méninges', 'games', 'b9ce49d4-d992-438f-8e79-6aa82e841dd2')
ON CONFLICT DO NOTHING;