
-- Créer la table des intervenants
CREATE TABLE public.intervenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  speciality TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Ajouter une colonne intervenant_id à la table appointments
ALTER TABLE public.appointments 
ADD COLUMN intervenant_id UUID REFERENCES public.intervenants(id);

-- Ajouter une colonne prix à la table clients
ALTER TABLE public.clients 
ADD COLUMN hourly_rate DECIMAL(10,2);

-- Ajouter une colonne prix à la table intervention_reports
ALTER TABLE public.intervention_reports 
ADD COLUMN hourly_rate DECIMAL(10,2);

-- Politiques RLS pour la table intervenants
ALTER TABLE public.intervenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view intervenants" 
ON public.intervenants 
FOR SELECT 
USING (true);

CREATE POLICY "Professionals can create intervenants" 
ON public.intervenants 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('professionnel', 'admin')
  )
);

CREATE POLICY "Professionals can update intervenants" 
ON public.intervenants 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('professionnel', 'admin')
  )
);

CREATE POLICY "Professionals can delete intervenants" 
ON public.intervenants 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('professionnel', 'admin')
  )
);
