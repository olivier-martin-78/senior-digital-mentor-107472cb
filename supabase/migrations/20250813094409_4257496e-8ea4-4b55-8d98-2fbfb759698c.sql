-- Sécuriser les tables avec des données personnelles sensibles

-- 1. Supprimer l'accès public aux mini_sites non publiés et restreindre l'exposition des données personnelles
DROP POLICY IF EXISTS "Published mini sites are publicly viewable" ON public.mini_sites;

-- Nouvelle politique plus sécurisée pour les mini_sites publiés (masquer les données sensibles)
CREATE POLICY "Published mini sites limited public access"
ON public.mini_sites
FOR SELECT 
TO public
USING (
  is_published = true AND 
  -- Seuls les champs non-sensibles sont accessibles publiquement via une vue séparée
  false -- Cette politique sera utilisée par une vue sécurisée
);

-- 2. Sécuriser diary_entries - supprimer l'accès public même pour shared_globally
DROP POLICY IF EXISTS "Users can view own diary and group members diary entries plus g" ON public.diary_entries;

-- Nouvelle politique plus stricte pour diary_entries
CREATE POLICY "Users can view own diary and group members diary entries"
ON public.diary_entries
FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid()) OR 
  (EXISTS (
    SELECT 1 FROM group_members gm1
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() AND gm2.user_id = diary_entries.user_id
  )) OR 
  (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ))
);

-- 3. Créer une table wish_posts si elle n'existe pas et sécuriser l'accès
-- (Note: Cette table semble être référencée dans l'analyse mais n'apparaît pas dans le schéma)
-- Nous allons créer les politiques de base pour cette table

-- 4. Sécuriser blog_categories - supprimer l'accès public complet
DROP POLICY IF EXISTS "blog_categories_unified_policy" ON public.blog_categories;

-- Nouvelle politique pour blog_categories - accès authentifié uniquement
CREATE POLICY "Blog categories authenticated access"
ON public.blog_categories
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Blog categories admin manage"
ON public.blog_categories
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- 5. Créer une vue sécurisée pour l'accès public aux mini_sites
CREATE OR REPLACE VIEW public.mini_sites_public AS
SELECT 
  id,
  site_name,
  site_subtitle,
  logo_url,
  first_name,
  last_name,
  profession,
  -- Email et téléphone masqués pour la sécurité
  CASE 
    WHEN length(email) > 0 THEN 'contact via formulaire'
    ELSE NULL 
  END as contact_info,
  postal_code,
  about_me,
  why_this_profession,
  skills_and_qualities,
  activity_start_date,
  services_description,
  availability_schedule,
  intervention_radius,
  color_palette,
  design_style,
  slug,
  created_at,
  -- Champs de style pour l'affichage
  title_color,
  header_gradient_from,
  header_gradient_to,
  section_title_color,
  section_text_color,
  subtitle_color,
  background_color,
  section_title_divider_from,
  section_title_divider_to,
  logo_size
FROM public.mini_sites
WHERE is_published = true;

-- Donner accès public à la vue sécurisée
GRANT SELECT ON public.mini_sites_public TO public;

-- 6. Renforcer la sécurité des commentaires de blog
DROP POLICY IF EXISTS "blog_comments_final" ON public.blog_comments;

CREATE POLICY "Blog comments secure access"
ON public.blog_comments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM blog_posts bp
    WHERE bp.id = blog_comments.post_id AND (
      (bp.published = true AND (
        bp.author_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM group_members gm1
          JOIN group_members gm2 ON gm1.group_id = gm2.group_id
          WHERE gm1.user_id = auth.uid() AND gm2.user_id = bp.author_id
        ) OR
        bp.shared_globally = true
      )) OR
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'admin'::app_role
      )
    )
  )
);

CREATE POLICY "Blog comments manage own"
ON public.blog_comments
FOR ALL
TO authenticated
USING (
  author_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
)
WITH CHECK (
  author_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);