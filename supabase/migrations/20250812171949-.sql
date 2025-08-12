-- 1) Fix incorrect get_user_role implementation (shadowed parameter)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id_param uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = user_id_param
  LIMIT 1;
$$;

-- 2) Helper functions to break RLS recursion using SECURITY DEFINER

-- Check if current auth user created the client
CREATE OR REPLACE FUNCTION public.is_client_created_by_auth_user(client_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = client_id_param AND c.created_by = auth.uid()
  );
$$;

-- Can current user view a client (owner, admin, related professional/intervenant, or caregiver by email)
CREATE OR REPLACE FUNCTION public.can_user_view_client(client_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN (
    -- Owner
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_id_param AND c.created_by = auth.uid()
    )
    OR
    -- Admin
    public.is_admin()
    OR
    -- Related professional / intervenant / permission
    EXISTS (
      SELECT 1
      FROM public.appointments a
      WHERE a.client_id = client_id_param
        AND (
          a.professional_id = auth.uid()
          OR a.updated_by_professional_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.intervenants i
            WHERE i.id = a.intervenant_id AND i.email = public.get_current_user_email()
          )
          OR EXISTS (
            SELECT 1 FROM public.user_intervenant_permissions uip
            WHERE uip.intervenant_id = a.intervenant_id AND uip.user_id = auth.uid()
          )
        )
    )
    OR
    -- Caregiver by email
    EXISTS (
      SELECT 1 FROM public.caregivers c
      WHERE c.client_id = client_id_param AND c.email = public.get_current_user_email()
    )
  );
END;
$$;

-- Can current user view a caregiver row
CREATE OR REPLACE FUNCTION public.can_user_view_caregiver(caregiver_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_client_id uuid;
  v_email text;
BEGIN
  SELECT c.client_id, c.email INTO v_client_id, v_email
  FROM public.caregivers c
  WHERE c.id = caregiver_id_param;

  IF v_client_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN (
    public.is_admin()
    OR public.is_client_created_by_auth_user(v_client_id)
    OR EXISTS (
      SELECT 1
      FROM public.appointments a
      WHERE a.client_id = v_client_id
        AND (
          a.professional_id = auth.uid()
          OR a.updated_by_professional_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.intervenants i
            WHERE i.id = a.intervenant_id AND i.email = public.get_current_user_email()
          )
          OR EXISTS (
            SELECT 1 FROM public.user_intervenant_permissions uip
            WHERE uip.intervenant_id = a.intervenant_id AND uip.user_id = auth.uid()
          )
        )
    )
    OR (v_email IS NOT NULL AND v_email = public.get_current_user_email())
  );
END;
$$;

-- Can current user view/update an appointment
CREATE OR REPLACE FUNCTION public.can_user_view_appointment(appointment_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  a_rec record;
  v_email text;
BEGIN
  SELECT * INTO a_rec FROM public.appointments WHERE id = appointment_id_param;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  v_email := public.get_current_user_email();

  RETURN (
    a_rec.professional_id = auth.uid()
    OR a_rec.updated_by_professional_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.intervenants i
      WHERE i.id = a_rec.intervenant_id AND i.email = v_email
    )
    OR EXISTS (
      SELECT 1 FROM public.user_intervenant_permissions uip
      WHERE uip.intervenant_id = a_rec.intervenant_id AND uip.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.caregivers c
      WHERE c.client_id = a_rec.client_id AND c.email = v_email
    )
  );
END;
$$;

-- 3) Replace recursive RLS policies with function-based policies

-- Clients
DROP POLICY IF EXISTS "Clients select owner, related professionals, caregivers, admin" ON public.clients;
CREATE POLICY "Clients select secure no-recursion"
ON public.clients
FOR SELECT
USING (public.can_user_view_client(id));

-- Keep insert/update/delete policies as-is (owner or admin)

-- Caregivers
DROP POLICY IF EXISTS "Caregivers select by owner, professionals, self, admin" ON public.caregivers;
DROP POLICY IF EXISTS "Caregivers insert by client owner or admin" ON public.caregivers;
DROP POLICY IF EXISTS "Caregivers update by client owner or admin" ON public.caregivers;
DROP POLICY IF EXISTS "Caregivers delete by client owner or admin" ON public.caregivers;

CREATE POLICY "Caregivers select secure no-recursion"
ON public.caregivers
FOR SELECT
USING (public.can_user_view_caregiver(id));

CREATE POLICY "Caregivers insert secure"
ON public.caregivers
FOR INSERT
WITH CHECK (public.is_client_created_by_auth_user(client_id) OR public.is_admin());

CREATE POLICY "Caregivers update secure"
ON public.caregivers
FOR UPDATE
USING (public.is_client_created_by_auth_user(client_id) OR public.is_admin());

CREATE POLICY "Caregivers delete secure"
ON public.caregivers
FOR DELETE
USING (public.is_client_created_by_auth_user(client_id) OR public.is_admin());

-- Appointments: remove older overlapping policies and consolidate
DROP POLICY IF EXISTS "Caregivers can view appointments for their clients" ON public.appointments;
DROP POLICY IF EXISTS "appointments_v10_select_creator_and_updater" ON public.appointments;
DROP POLICY IF EXISTS "appointments_v10_update_creator_and_updater" ON public.appointments;
DROP POLICY IF EXISTS "appointments_v10_insert_creator" ON public.appointments;
DROP POLICY IF EXISTS "appointments_v10_delete_creator_only" ON public.appointments;
DROP POLICY IF EXISTS "appointments_v11_select_secure" ON public.appointments;
DROP POLICY IF EXISTS "appointments_v11_update_secure" ON public.appointments;

-- Keep existing v11 insert/delete if present, but recreate to ensure consistency
DROP POLICY IF EXISTS "appointments_v11_insert_secure" ON public.appointments;
DROP POLICY IF EXISTS "appointments_v11_delete_secure" ON public.appointments;

CREATE POLICY "appointments_select_secure_no_recursion"
ON public.appointments
FOR SELECT
USING (public.can_user_view_appointment(id));

CREATE POLICY "appointments_update_secure_no_recursion"
ON public.appointments
FOR UPDATE
USING (public.can_user_view_appointment(id));

CREATE POLICY "appointments_v11_insert_secure"
ON public.appointments
FOR INSERT
WITH CHECK (professional_id = auth.uid());

CREATE POLICY "appointments_v11_delete_secure"
ON public.appointments
FOR DELETE
USING (professional_id = auth.uid());
