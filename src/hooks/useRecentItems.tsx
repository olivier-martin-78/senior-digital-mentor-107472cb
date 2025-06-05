
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRecentBlogPosts } from './recent/useRecentBlogPosts';
import { useRecentComments } from './recent/useRecentComments';
import { useRecentDiaryEntries } from './recent/useRecentDiaryEntries';
import { useRecentWishes } from './recent/useRecentWishes';
import { useRecentLifeStories } from './recent/useRecentLifeStories';

export interface RecentItem {
  id: string;
  title: string;
  type: 'blog' | 'comment' | 'diary' | 'wish' | 'life-story';
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
  const { user, getEffectiveUserId } = useAuth();
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Utiliser les hooks sans arguments comme les autres
  const blogPosts = useRecentBlogPosts();
  const comments = useRecentComments();
  const diaryEntries = useRecentDiaryEntries();
  const wishes = useRecentWishes();
  const lifeStories = useRecentLifeStories();

  useEffect(() => {
    if (!user) {
      setRecentItems([]);
      setLoading(false);
      return;
    }

    console.log('🔍 ===== DIAGNOSTIC RECENT ITEMS DÉTAILLÉ =====');
    console.log('🔍 Utilisateur connecté:', user.email, user.id);
    console.log('🔍 Blog posts récupérés:', blogPosts.length);
    console.log('🔍 Comments récupérés:', comments.length);
    console.log('🔍 Diary entries récupérés:', diaryEntries.length);
    console.log('🔍 Wishes récupérés:', wishes.length);
    console.log('🔍 Life stories récupérés:', lifeStories.length);

    // Analyser les auteurs des contenus récupérés
    const allItems = [...blogPosts, ...comments, ...diaryEntries, ...wishes, ...lifeStories];
    const authorAnalysis = allItems.reduce((acc, item) => {
      if (!acc[item.author]) {
        acc[item.author] = { count: 0, types: [] };
      }
      acc[item.author].count++;
      if (!acc[item.author].types.includes(item.type)) {
        acc[item.author].types.push(item.type);
      }
      return acc;
    }, {} as Record<string, { count: number; types: string[] }>);

    console.log('🔍 Analyse des auteurs dans Recent Items:', authorAnalysis);

    const combined = [
      ...blogPosts,
      ...comments,
      ...diaryEntries,
      ...wishes,
      ...lifeStories
    ];

    // Trier par date de création (plus récent en premier)
    const sorted = combined.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    console.log('🔍 Total items triés:', sorted.length);
    console.log('🔍 Premiers 5 items par date:', sorted.slice(0, 5).map(item => ({
      type: item.type,
      title: item.title,
      author: item.author,
      date: item.created_at
    })));

    setRecentItems(sorted);
    setLoading(false);
  }, [user, blogPosts, comments, diaryEntries, wishes, lifeStories, getEffectiveUserId]);

  return { recentItems, loading };
};
