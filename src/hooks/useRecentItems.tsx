import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRecentPermissions } from './recent/useRecentPermissions';
import { useRecentBlogPosts } from './recent/useRecentBlogPosts';
import { useRecentWishes } from './recent/useRecentWishes';
import { useRecentDiaryEntries } from './recent/useRecentDiaryEntries';
import { useRecentComments } from './recent/useRecentComments';

export interface RecentItem {
  id: string;
  title: string;
  type: 'blog' | 'wish' | 'diary' | 'comment';
  created_at: string;
  author?: string;
  content_preview?: string;
  cover_image?: string;
  first_name?: string;
  post_title?: string;
  comment_content?: string;
  media_url?: string;
  album_name?: string; // Nouveau champ pour le nom de l'album
}

export const useRecentItems = () => {
  const { user, getEffectiveUserId } = useAuth();
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const effectiveUserId = getEffectiveUserId() || '';
  
  const { authorizedUserIds, loading: permissionsLoading } = useRecentPermissions();
  const blogPosts = useRecentBlogPosts(effectiveUserId, authorizedUserIds);
  const wishes = useRecentWishes(effectiveUserId);
  const diaryEntries = useRecentDiaryEntries(effectiveUserId, authorizedUserIds);
  const comments = useRecentComments(effectiveUserId, authorizedUserIds);

  useEffect(() => {
    if (!user || permissionsLoading) {
      setLoading(true);
      return;
    }

    try {
      console.log('🔍 ===== DÉBOGAGE RECENT - DÉBUT =====');
      console.log('🔍 Utilisateur original:', {
        id: user.id,
        email: user.email
      });
      console.log('🔍 Utilisateur effectif (impersonné):', {
        id: effectiveUserId
      });

      // Combiner tous les éléments
      const allItems = [...blogPosts, ...wishes, ...diaryEntries, ...comments];
      
      // Trier tous les éléments par date de création
      allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log('🔍 ===== RÉSUMÉ FINAL =====');
      console.log('🔍 Total éléments récupérés:', allItems.length);
      console.log('🔍 Répartition par type:', {
        blog: allItems.filter(i => i.type === 'blog').length,
        wish: allItems.filter(i => i.type === 'wish').length,
        diary: allItems.filter(i => i.type === 'diary').length,
        comment: allItems.filter(i => i.type === 'comment').length
      });
      console.log('🔍 ===== DÉBOGAGE RECENT - FIN =====');

      setRecentItems(allItems.slice(0, 40)); // Garder les 40 plus récents
    } catch (error) {
      console.error('🔍 ❌ Erreur lors du chargement des éléments récents:', error);
      setRecentItems([]);
    } finally {
      setLoading(false);
    }
  }, [user, effectiveUserId, permissionsLoading, blogPosts, wishes, diaryEntries, comments]);

  return { recentItems, loading };
};
