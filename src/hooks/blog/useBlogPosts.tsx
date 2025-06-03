
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PostWithAuthor } from '@/types/supabase';

export const useBlogPosts = (
  searchTerm: string,
  selectedAlbum: string,
  startDate?: string,
  endDate?: string
) => {
  const { user, hasRole } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user) {
        console.log('🚫 useBlogPosts - Pas d\'utilisateur connecté');
        setPosts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const isAdmin = hasRole('admin');
        
        console.log('🚀 useBlogPosts - Récupération posts pour:', {
          userEmail: user.email,
          userId: user.id,
          isAdmin
        });

        // DIAGNOSTIC: Vérifier l'appartenance aux groupes
        const { data: groupMemberships, error: groupError } = await supabase
          .from('group_members')
          .select(`
            group_id,
            role,
            invitation_groups!inner(name, created_by),
            profiles!group_members_user_id_fkey(email, display_name)
          `)
          .eq('user_id', user.id);

        if (groupError) {
          console.error('❌ Erreur diagnostic groupes:', groupError);
        } else {
          console.log('🔍 DIAGNOSTIC - Groupes de l\'utilisateur actuel:', {
            userEmail: user.email,
            groupes: groupMemberships?.map(gm => ({
              groupId: gm.group_id,
              groupName: gm.invitation_groups?.name,
              createdBy: gm.invitation_groups?.created_by,
              role: gm.role
            })) || []
          });
        }

        // DIAGNOSTIC: Vérifier tous les auteurs avec leurs groupes
        const { data: allAuthors, error: authorsError } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            display_name
          `);

        if (authorsError) {
          console.error('❌ Erreur diagnostic auteurs:', authorsError);
        } else {
          console.log('🔍 DIAGNOSTIC - Tous les auteurs disponibles:', allAuthors);
          
          // Pour chaque auteur, vérifier leurs groupes
          for (const author of allAuthors || []) {
            const { data: authorGroups } = await supabase
              .from('group_members')
              .select(`
                group_id,
                invitation_groups!inner(name, created_by)
              `)
              .eq('user_id', author.id);

            console.log(`🔍 DIAGNOSTIC - Groupes de ${author.email}:`, {
              authorId: author.id,
              authorEmail: author.email,
              groupes: authorGroups?.map(ag => ({
                groupId: ag.group_id,
                groupName: ag.invitation_groups?.name,
                createdBy: ag.invitation_groups?.created_by
              })) || []
            });
          }
        }

        // Avec la nouvelle logique, une seule requête simple suffit
        // Les politiques RLS gèrent automatiquement l'accès basé sur l'appartenance aux groupes
        let query = supabase
          .from('blog_posts')
          .select(`
            *,
            profiles(id, display_name, email, avatar_url, created_at)
          `)
          .order('created_at', { ascending: false });

        // Appliquer les filtres
        if (searchTerm) {
          query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
        }

        if (selectedAlbum && selectedAlbum !== 'none') {
          query = query.eq('album_id', selectedAlbum);
        }

        if (startDate) {
          query = query.gte('created_at', startDate);
        }

        if (endDate) {
          query = query.lte('created_at', endDate);
        }

        const { data, error } = await query;

        if (error) {
          console.error('❌ useBlogPosts - Erreur requête:', error);
          throw error;
        }

        const allPosts = data || [];
        
        console.log('✅ useBlogPosts - Posts récupérés avec nouvelle logique simplifiée:', {
          count: allPosts.length,
          postsParAuteur: allPosts.reduce((acc, post) => {
            const authorEmail = post.profiles?.email || 'Email non disponible';
            if (!acc[authorEmail]) {
              acc[authorEmail] = 0;
            }
            acc[authorEmail]++;
            return acc;
          }, {} as Record<string, number>)
        });

        setPosts(allPosts);
      } catch (error) {
        console.error('💥 useBlogPosts - Erreur critique:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user, searchTerm, selectedAlbum, startDate, endDate, hasRole]);

  return { posts, loading };
};
