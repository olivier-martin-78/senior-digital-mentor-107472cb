-- CRITICAL SECURITY FIXES: Healthcare Data Protection

-- 1. Secure profiles table - users can only see their own data and basic info of authorized connections
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can view basic info of group members"
ON public.profiles  
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM group_members gm1
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() 
    AND gm2.user_id = profiles.id
  )
);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (id = auth.uid());

-- 2. Secure clients table - strict healthcare data protection
DROP POLICY IF EXISTS "Clients select secure no-recursion" ON public.clients;

CREATE POLICY "Clients - owner can view"
ON public.clients
FOR SELECT
USING (created_by = auth.uid());

CREATE POLICY "Clients - admin can view all"
ON public.clients
FOR SELECT
USING (public.is_admin());

-- 3. Secure caregivers table - strict access control
DROP POLICY IF EXISTS "Caregivers select secure no-recursion" ON public.caregivers;

CREATE POLICY "Caregivers - client owner can view"
ON public.caregivers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = caregivers.client_id 
    AND c.created_by = auth.uid()
  )
);

CREATE POLICY "Caregivers - admin can view all"
ON public.caregivers
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Caregivers - caregiver can view own record"
ON public.caregivers
FOR SELECT
USING (email = public.get_current_user_email());

-- 4. Secure intervenants table - professional access only
DROP POLICY IF EXISTS "Authenticated users can view intervenants" ON public.intervenants;

CREATE POLICY "Intervenants - professionals can view"
ON public.intervenants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('professionnel', 'admin')
  )
);

-- 5. Secure appointments table - healthcare professional access only
DROP POLICY IF EXISTS "appointments_select_secure_no_recursion" ON public.appointments;

CREATE POLICY "Appointments - professional can view own"
ON public.appointments
FOR SELECT
USING (professional_id = auth.uid());

CREATE POLICY "Appointments - admin can view all"
ON public.appointments
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Appointments - intervenant by email can view"
ON public.appointments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.intervenants i
    WHERE i.id = appointments.intervenant_id 
    AND i.email = public.get_current_user_email()
  )
);

-- 6. Create security audit function for debugging access issues
CREATE OR REPLACE FUNCTION public.debug_user_access(target_user_id uuid DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid;
  user_role text;
  group_memberships json;
  result json;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;
  
  -- Get user role
  SELECT ur.role::text INTO user_role
  FROM public.user_roles ur
  WHERE ur.user_id = current_user_id
  LIMIT 1;
  
  -- Get group memberships
  SELECT json_agg(
    json_build_object(
      'group_id', gm.group_id,
      'role', gm.role,
      'group_name', ig.name
    )
  ) INTO group_memberships
  FROM public.group_members gm
  JOIN public.invitation_groups ig ON gm.group_id = ig.id
  WHERE gm.user_id = current_user_id;
  
  result := json_build_object(
    'current_user_id', current_user_id,
    'user_role', COALESCE(user_role, 'none'),
    'is_admin', public.is_admin(),
    'group_memberships', COALESCE(group_memberships, '[]'::json),
    'target_user_id', target_user_id
  );
  
  -- If target user specified, check specific access
  IF target_user_id IS NOT NULL THEN
    result := result || json_build_object(
      'can_access_target_profile', EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = target_user_id
        AND (
          p.id = current_user_id
          OR public.is_admin()
          OR EXISTS (
            SELECT 1 
            FROM group_members gm1
            JOIN group_members gm2 ON gm1.group_id = gm2.group_id
            WHERE gm1.user_id = current_user_id 
            AND gm2.user_id = target_user_id
          )
        )
      )
    );
  END IF;
  
  RETURN result;
END;
$$;