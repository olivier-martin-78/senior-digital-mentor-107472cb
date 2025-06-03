
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RecentItem } from '../useRecentItems';

export const useRecentBlogPosts = (effectiveUserId: string, authorizedUserIds: string[]) => {
  const { hasRole } = useAuth();
  const [blogPosts, setBlogPosts] = useState<RecentItem[]>([]);

  const fetchBlogPosts = useCallback(async () => {
    if (!effectiveUserId) {
      setBlogPosts([]);
      return;
    }

    console.log('🔍 ===== DIAGNOSTIC BLOG POSTS DÉTAILLÉ =====');
    console.log('🔍 Utilisateur effectif:', effectiveUserId);

    try {
      // Test 1: Vérifier l'appartenance aux groupes de l'utilisateur actuel
      const { data: myGroups, error: myGroupsError } = await supabase
        .from('group_members')
        .select(`
          group_id,
          role,
          invitation_groups!inner(name, created_by)
        `)
        .eq('user_id', effectiveUserId);

      console.log('🔍 Mes groupes:', myGroups);
      if (myGroupsError) {
        console.error('❌ Erreur récupération mes groupes:', myGroupsError);
      }

      // Test 2: Vérifier tous les groupes disponibles
      const { data: allGroups, error: allGroupsError } = await supabase
        .from('invitation_groups')
        .select('*');

      console.log('🔍 Tous les groupes disponibles:', allGroups);
      if (allGroupsError) {
        console.error('❌ Erreur récupération tous les groupes:', allGroupsError);
      }

      // Test 3: Vérifier les membres de tous les groupes
      const { data: allGroupMembers, error: allMembersError } = await supabase
        .from('group_members')
        .select(`
          group_id,
          user_id,
          role,
          invitation_groups!inner(name, created_by),
          profiles!inner(email, display_name)
        `);

      console.log('🔍 Tous les membres de groupes:', allGroupMembers);
      if (allMembersError) {
        console.error('❌ Erreur récupération tous les membres:', allMembersError);
      }

      // Test 4: Récupérer TOUS les posts sans filtre pour voir ce qui existe
      const { data: allPosts, error: allPostsError } = await supabase
        .from('blog_posts')
        .select(`
          id,
          title,
          content,
          created_at,
          cover_image,
          author_id,
          album_id,
          published,
          profiles(display_name, email),
          blog_albums(name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      console.log('🔍 TOUS les posts dans la base (sans filtre RLS):', allPosts?.length || 0);
      if (allPostsError) {
        console.error('❌ Erreur récupération tous les posts:', allPostsError);
      } else if (allPosts) {
        const postsByAuthor = allPosts.reduce((acc, post) => {
          const authorEmail = post.profiles?.email || 'Email non disponible';
          if (!acc[authorEmail]) {
            acc[authorEmail] = 0;
          }
          acc[authorEmail]++;
          return acc;
        }, {} as Record<string, number>);
        console.log('🔍 Posts par auteur (tous):', postsByAuthor);

        // Vérifier spécifiquement les posts de Conception
        const conceptionPosts = allPosts.filter(post => 
          post.profiles?.email?.toLowerCase().includes('conception')
        );
        console.log('🔍 Posts de Conception trouvés (sans filtre):', conceptionPosts.length);
        if (conceptionPosts.length > 0) {
          console.log('🔍 Détails posts Conception:', conceptionPosts.map(p => ({
            id: p.id,
            title: p.title,
            author_id: p.author_id,
            email: p.profiles?.email
          })));
        }
      }

      // Test 5: Essayer la requête avec la politique RLS (celle qui est censée fonctionner)
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select(`
          id,
          title,
          content,
          created_at,
          cover_image,
          author_id,
          album_id,
          published,
          profiles(display_name, email),
          blog_albums(name)
        `)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) {
        console.error('❌ Erreur récupération posts avec RLS:', error);
        setBlogPosts([]);
        return;
      }

      console.log('🔍 Posts récupérés AVEC politiques RLS:', posts?.length || 0);
      if (posts) {
        const postsByAuthorRLS = posts.reduce((acc, post) => {
          const authorEmail = post.profiles?.email || 'Email non disponible';
          if (!acc[authorEmail]) {
            acc[authorEmail] = 0;
          }
          acc[authorEmail]++;
          return acc;
        }, {} as Record<string, number>);
        console.log('🔍 Posts par auteur (avec RLS):', postsByAuthorRLS);

        // Vérifier spécifiquement les posts de Conception avec RLS
        const conceptionPostsRLS = posts.filter(post => 
          post.profiles?.email?.toLowerCase().includes('conception')
        );
        console.log('🔍 Posts de Conception avec RLS:', conceptionPostsRLS.length);
      }

      const items = (posts || []).map(post => ({
        id: post.id,
        title: post.title,
        type: 'blog' as const,
        created_at: post.created_at,
        author: post.author_id === effectiveUserId ? 'Moi' : (post.profiles?.display_name || post.profiles?.email || 'Utilisateur'),
        content_preview: post.content?.substring(0, 150) + '...',
        cover_image: post.cover_image,
        album_name: post.blog_albums?.name || undefined
      }));

      console.log('🔍 Items finaux pour Recent:', items.length);
      setBlogPosts(items);
    } catch (error) {
      console.error('💥 Erreur critique useRecentBlogPosts:', error);
      setBlogPosts([]);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    fetchBlogPosts();
  }, [fetchBlogPosts]);

  return blogPosts;
};
