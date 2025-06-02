
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRecentBlogPosts } from './recent/useRecentBlogPosts';
import { useRecentComments } from './recent/useRecentComments';
import { useRecentDiaryEntries } from './recent/useRecentDiaryEntries';
import { useRecentWishes } from './recent/useRecentWishes';

export interface RecentItem {
  id: string;
  title: string;
  type: 'blog' | 'comment' | 'diary' | 'wish';
  created_at: string;
  author: string;
  content_preview?: string;
  cover_image?: string;
  post_title?: string;
  post_id?: string;
  comment_content?: string;
  album_name?: string;
}

export const useRecentItems = () => {
  const { user, hasRole } = useAuth();
  const [allItems, setAllItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Utilisateur effectif = utilisateur connecté dans le nouveau système simplifié
  const effectiveUserId = user?.id || '';
  
  // Dans le nouveau système basé sur les groupes, les utilisateurs autorisés
  // sont gérés automatiquement par RLS, donc on passe juste l'utilisateur actuel
  const authorizedUserIds = effectiveUserId ? [effectiveUserId] : [];

  const blogPosts = useRecentBlogPosts(effectiveUserId, authorizedUserIds);
  const comments = useRecentComments(effectiveUserId, authorizedUserIds);
  const diaryEntries = useRecentDiaryEntries(effectiveUserId, authorizedUserIds);
  const wishes = useRecentWishes(effectiveUserId, authorizedUserIds);

  useEffect(() => {
    if (!user) {
      setAllItems([]);
      setLoading(false);
      return;
    }

    console.log('🔍 ===== ASSEMBLAGE FINAL RECENT ITEMS =====');
    console.log('🔍 Blog posts:', blogPosts.length);
    console.log('🔍 Comments:', comments.length);
    console.log('🔍 Diary entries:', diaryEntries.length);
    console.log('🔍 Wishes:', wishes.length);

    const combined = [
      ...blogPosts,
      ...comments,
      ...diaryEntries,
      ...wishes
    ];

    // Trier par date de création (plus récent en premier)
    const sorted = combined.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    console.log('🔍 Total items triés:', sorted.length);
    setAllItems(sorted);
    setLoading(false);
  }, [blogPosts, comments, diaryEntries, wishes, user]);

  return { items: allItems, loading };
};
