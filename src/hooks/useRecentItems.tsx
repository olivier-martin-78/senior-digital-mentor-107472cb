
import { useState, useEffect, useMemo } from 'react';
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
  media_url?: string;
  first_name?: string;
}

export const useRecentItems = () => {
  const { user } = useAuth();
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Mémoriser l'utilisateur effectif pour éviter les re-renders
  const effectiveUserId = useMemo(() => user?.id || '', [user?.id]);
  
  // Mémoriser les IDs autorisés pour éviter les re-renders
  const authorizedUserIds = useMemo(() => 
    effectiveUserId ? [effectiveUserId] : [], 
    [effectiveUserId]
  );

  const blogPosts = useRecentBlogPosts(effectiveUserId, authorizedUserIds);
  const comments = useRecentComments(effectiveUserId, authorizedUserIds);
  const diaryEntries = useRecentDiaryEntries(effectiveUserId, authorizedUserIds);
  const wishes = useRecentWishes();

  useEffect(() => {
    if (!user) {
      setRecentItems([]);
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
    setRecentItems(sorted);
    setLoading(false);
  }, [user, blogPosts, comments, diaryEntries, wishes]);

  return { recentItems, loading };
};
