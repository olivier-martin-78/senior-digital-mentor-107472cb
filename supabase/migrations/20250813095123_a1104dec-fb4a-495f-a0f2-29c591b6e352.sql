-- Security audit and fixes for healthcare data tables
-- This addresses the security issue: Healthcare Data and Appointment Information Could Be Accessed by Unauthorized Users

-- 1. Clean up duplicate policies on intervention_reports table
DROP POLICY IF EXISTS "Professionnels peuvent créer leurs rapports" ON public.intervention_reports;
DROP POLICY IF EXISTS "Professionnels peuvent modifier leurs rapports" ON public.intervention_reports;
DROP POLICY IF EXISTS "Professionnels peuvent supprimer leurs rapports" ON public.intervention_reports;
DROP POLICY IF EXISTS "Professionnels peuvent voir leurs rapports" ON public.intervention_reports;

-- 2. Remove potentially overly permissive policies and replace with secure ones
DROP POLICY IF EXISTS "intervention_reports_professional_access_v2" ON public.intervention_reports;

-- 3. Create consolidated, secure policies for intervention_reports
CREATE POLICY "intervention_reports_professional_access_secure"
ON public.intervention_reports
FOR ALL
TO authenticated
USING (professional_id = auth.uid())
WITH CHECK (professional_id = auth.uid());

-- Secure caregiver access - only for their specific clients
CREATE POLICY "intervention_reports_caregiver_access_secure"
ON public.intervention_reports
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.appointments a
    JOIN public.caregivers c ON a.client_id = c.client_id
    WHERE a.id = intervention_reports.appointment_id 
    AND c.email = public.get_current_user_email()
  )
);

-- Secure intervenant access by email
CREATE POLICY "intervention_reports_intervenant_email_access_secure"
ON public.intervention_reports
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.appointments a
    JOIN public.intervenants i ON a.intervenant_id = i.id
    WHERE a.id = intervention_reports.appointment_id 
    AND i.email = public.get_current_user_email()
  )
);

-- Secure intervenant access by permissions
CREATE POLICY "intervention_reports_intervenant_permissions_access_secure"
ON public.intervention_reports
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.appointments a
    JOIN public.user_intervenant_permissions uip ON a.intervenant_id = uip.intervenant_id
    WHERE a.id = intervention_reports.appointment_id 
    AND uip.user_id = auth.uid()
  )
);

-- Admin access for intervention_reports
CREATE POLICY "intervention_reports_admin_access"
ON public.intervention_reports
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. Add missing caregiver access policy for appointments
CREATE POLICY "appointments_caregiver_access"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.caregivers c
    WHERE c.client_id = appointments.client_id 
    AND c.email = public.get_current_user_email()
  )
);

-- 5. Add function to validate healthcare data access permissions
CREATE OR REPLACE FUNCTION public.can_access_healthcare_data(target_professional_id uuid, target_appointment_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  user_email text;
BEGIN
  current_user_id := auth.uid();
  user_email := public.get_current_user_email();
  
  -- Professional can access their own data
  IF target_professional_id = current_user_id THEN
    RETURN true;
  END IF;
  
  -- Admin can access all data
  IF public.is_admin() THEN
    RETURN true;
  END IF;
  
  -- If appointment ID is provided, check caregiver/intervenant access
  IF target_appointment_id IS NOT NULL THEN
    -- Check if user is a caregiver for the client
    IF EXISTS (
      SELECT 1 
      FROM public.appointments a
      JOIN public.caregivers c ON a.client_id = c.client_id
      WHERE a.id = target_appointment_id 
      AND c.email = user_email
    ) THEN
      RETURN true;
    END IF;
    
    -- Check if user is an intervenant for the appointment
    IF EXISTS (
      SELECT 1 
      FROM public.appointments a
      JOIN public.intervenants i ON a.intervenant_id = i.id
      WHERE a.id = target_appointment_id 
      AND i.email = user_email
    ) THEN
      RETURN true;
    END IF;
    
    -- Check if user has intervenant permissions
    IF EXISTS (
      SELECT 1 
      FROM public.appointments a
      JOIN public.user_intervenant_permissions uip ON a.intervenant_id = uip.intervenant_id
      WHERE a.id = target_appointment_id 
      AND uip.user_id = current_user_id
    ) THEN
      RETURN true;
    END IF;
  END IF;
  
  RETURN false;
END;
$$;