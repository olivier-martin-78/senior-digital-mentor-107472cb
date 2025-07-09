-- Corriger la politique RLS pour permettre aux invités de voir les souhaits du créateur

-- Supprimer l'ancienne politique SELECT sur wish_posts
DROP POLICY IF EXISTS "Users can view own wishes and published wishes from same group or created groups" ON public.wish_posts;

-- Créer la nouvelle politique SELECT avec la condition manquante pour les invités
CREATE POLICY "Users can view own wishes and published wishes from same group or created groups" 
ON public.wish_posts 
FOR SELECT 
USING (
  -- L'utilisateur peut voir ses propres souhaits (publiés ET brouillons)
  author_id = auth.uid()
  OR
  -- L'utilisateur peut voir les souhaits PUBLIÉS des membres de son groupe
  (
    published = true 
    AND EXISTS (
      SELECT 1
      FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid() 
      AND gm2.user_id = wish_posts.author_id
    )
  )
  OR
  -- L'utilisateur peut voir les souhaits PUBLIÉS des membres des groupes qu'il a créés
  (
    published = true 
    AND EXISTS (
      SELECT 1
      FROM invitation_groups ig
      JOIN group_members gm ON ig.id = gm.group_id
      WHERE ig.created_by = auth.uid()
      AND gm.user_id = wish_posts.author_id
    )
  )
  OR
  -- NOUVEAU: Les invités peuvent voir les souhaits PUBLIÉS du créateur de leur groupe
  (
    published = true 
    AND EXISTS (
      SELECT 1 
      FROM group_members gm
      JOIN invitation_groups ig ON gm.group_id = ig.id
      WHERE gm.user_id = auth.uid() 
      AND gm.role = 'guest'
      AND ig.created_by = wish_posts.author_id
    )
  )
  OR
  -- Les admins peuvent tout voir
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);