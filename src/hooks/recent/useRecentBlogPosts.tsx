
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
          invitation_groups!inner(name, created_by)
        `);

      console.log('🔍 Tous les membres de groupes:', allGroupMembers);
      if (allMembersError) {
        console.error('❌ Erreur récupération tous les membres:', allMembersError);
      }

      // Récupérer les profiles pour analyser les emails
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, email, display_name');

      const profilesMap = allProfiles?.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as { [key: string]: any }) || {};

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
          published
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      console.log('🔍 TOUS les posts dans la base (sans filtre RLS):', allPosts?.length || 0);
      if (allPostsError) {
        console.error('❌ Erreur récupération tous les posts:', allPostsError);
      } else if (allPosts) {
        const postsByAuthor = allPosts.reduce((acc, post) => {
          const profile = profilesMap[post.author_id];
          const authorEmail = profile?.email || 'Email non disponible';
          if (!acc[authorEmail]) {
            acc[authorEmail] = 0;
          }
          acc[authorEmail]++;
          return acc;
        }, {} as Record<string, number>);
        console.log('🔍 Posts par auteur (tous):', postsByAuthor);

        // Vérifier spécifiquement les posts de Conception
        const conceptionPosts = allPosts.filter(post => {
          const profile = profilesMap[post.author_id];
          return profile?.email?.toLowerCase().includes('conception');
        });
        console.log('🔍 Posts de Conception trouvés (sans filtre):', conceptionPosts.length);
        if (conceptionPosts.length > 0) {
          console.log('🔍 Détails posts Conception:', conceptionPosts.map(p => ({
            id: p.id,
            title: p.title,
            author_id: p.author_id,
            email: profilesMap[p.author_id]?.email
          })));
        } else {
          console.log('❌ AUCUN post de Conception trouvé');
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
          published
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
          const profile = profilesMap[post.author_id];
          const authorEmail = profile?.email || 'Email non disponible';
          if (!acc[authorEmail]) {
            acc[authorEmail] = 0;
          }
          acc[authorEmail]++;
          return acc;
        }, {} as Record<string, number>);
        console.log('🔍 Posts par auteur (avec RLS):', postsByAuthorRLS);

        // Vérifier spécifiquement les posts de Conception avec RLS
        const conceptionPostsRLS = posts.filter(post => {
          const profile = profilesMap[post.author_id];
          return profile?.email?.toLowerCase().includes('conception');
        });
        console.log('🔍 Posts de Conception avec RLS:', conceptionPostsRLS.length);

        // Récupérer les informations des albums si nécessaire
        const albumIds = posts.filter(p => p.album_id).map(p => p.album_id);
        let albumsMap = {};
        if (albumIds.length > 0) {
          const { data: albums } = await supabase
            .from('blog_albums')
            .select('id, name')
            .in('id', albumIds);
          
          albumsMap = albums?.reduce((acc, album) => {
            acc[album.id] = album;
            return acc;
          }, {} as { [key: string]: any }) || {};
        }

        const items = posts.map(post => {
          const profile = profilesMap[post.author_id];
          const album = albumsMap[post.album_id];
          return {
            id: post.id,
            title: post.title,
            type: 'blog' as const,
            created_at: post.created_at,
            author: post.author_id === effectiveUserId ? 'Moi' : (profile?.display_name || profile?.email || 'Utilisateur'),
            content_preview: post.content?.substring(0, 150) + '...',
            cover_image: post.cover_image,
            album_name: album?.name || undefined
          };
        });

        console.log('🔍 Items finaux pour Recent:', items.length);
        setBlogPosts(items);
      }
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
