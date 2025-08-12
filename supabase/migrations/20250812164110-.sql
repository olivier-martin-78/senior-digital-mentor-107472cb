-- Security hardening migration: tighten RLS on sensitive tables and restrict role management

-- 1) CLIENTS: Replace overly permissive policies with least-privilege rules
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can access clients" ON public.clients;
DROP POLICY IF EXISTS "clients_unified_policy" ON public.clients;

-- View: owners, related professionals (appointments), caregivers for the same client by email, or admins
CREATE POLICY "Clients select owner, related professionals, caregivers, admin"
ON public.clients
FOR SELECT
USING (
  created_by = auth.uid()
  OR public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.client_id = clients.id
      AND (a.professional_id = auth.uid() OR a.updated_by_professional_id = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.caregivers c
    WHERE c.client_id = clients.id
      AND c.email = public.get_current_user_email()
  )
);

-- Insert: only owner (creator) or admin
CREATE POLICY "Clients insert owner only"
ON public.clients
FOR INSERT
WITH CHECK (created_by = auth.uid() OR public.is_admin());

-- Update/Delete: only owner or admin
CREATE POLICY "Clients update owner or admin"
ON public.clients
FOR UPDATE
USING (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Clients delete owner or admin"
ON public.clients
FOR DELETE
USING (created_by = auth.uid() OR public.is_admin());


-- 2) CAREGIVERS: Replace overly permissive policies with contextual access
ALTER TABLE public.caregivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can access caregivers" ON public.caregivers;
DROP POLICY IF EXISTS "caregivers_unified_policy" ON public.caregivers;

-- View: client owners, related professionals (appointments), the caregiver themselves (by email), or admins
CREATE POLICY "Caregivers select by owner, professionals, self, admin"
ON public.caregivers
FOR SELECT
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.clients cl
    WHERE cl.id = caregivers.client_id AND cl.created_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.client_id = caregivers.client_id
      AND (a.professional_id = auth.uid() OR a.updated_by_professional_id = auth.uid())
  )
  OR caregivers.email = public.get_current_user_email()
);

-- Insert/Update/Delete: only client owners or admins
CREATE POLICY "Caregivers insert by client owner or admin"
ON public.caregivers
FOR INSERT
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.clients cl
    WHERE cl.id = caregivers.client_id AND cl.created_by = auth.uid()
  )
);

CREATE POLICY "Caregivers update by client owner or admin"
ON public.caregivers
FOR UPDATE
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.clients cl
    WHERE cl.id = caregivers.client_id AND cl.created_by = auth.uid()
  )
);

CREATE POLICY "Caregivers delete by client owner or admin"
ON public.caregivers
FOR DELETE
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.clients cl
    WHERE cl.id = caregivers.client_id AND cl.created_by = auth.uid()
  )
);


-- 3) GROUP MEMBERS: remove public visibility and restrict to members/creators/admin
DROP POLICY IF EXISTS "Allow all authenticated users to view group members" ON public.group_members;

CREATE POLICY "Group members and creators can view"
ON public.group_members
FOR SELECT
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.invitation_groups ig
    WHERE ig.id = group_members.group_id AND ig.created_by = auth.uid()
  )
  OR group_members.user_id = auth.uid()
);


-- 4) USER_ROLES: lock down to admins
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_select_all" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_unrestricted" ON public.user_roles;
DROP POLICY IF EXISTS "Allow all authenticated users to view user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can manage their roles" ON public.user_roles;

-- Users can view their own roles; admins can view all
CREATE POLICY "Users can view own roles and admins can view all"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());

-- Only admins can insert/update/delete roles
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.is_admin());