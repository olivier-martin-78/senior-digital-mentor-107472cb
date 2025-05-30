import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RecentItemImage from '@/components/RecentItemImage';

interface RecentItem {
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
}

const Recent = () => {
  const { user, hasRole } = useAuth();
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentItems = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const items: RecentItem[] = [];

        // Récupérer les posts de blog récents
        const { data: blogPosts } = await supabase
          .from('blog_posts')
          .select(`
            id,
            title,
            content,
            created_at,
            cover_image,
            profiles(display_name)
          `)
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(15);

        if (blogPosts) {
          items.push(...blogPosts.map(post => ({
            id: post.id,
            title: post.title,
            type: 'blog' as const,
            created_at: post.created_at,
            author: post.profiles?.display_name || 'Anonyme',
            content_preview: post.content?.substring(0, 150) + '...',
            cover_image: post.cover_image
          })));
        }

        // Récupérer les souhaits récents (tous si admin, sinon ceux publiés + ses propres brouillons)
        let wishQuery = supabase
          .from('wish_posts')
          .select(`
            id,
            title,
            content,
            created_at,
            first_name,
            cover_image,
            published,
            author_id,
            profiles(display_name)
          `)
          .order('created_at', { ascending: false })
          .limit(15);

        if (!hasRole('admin')) {
          wishQuery = wishQuery.or(`published.eq.true,author_id.eq.${user.id}`);
        }

        const { data: wishes } = await wishQuery;

        if (wishes) {
          items.push(...wishes.map(wish => ({
            id: wish.id,
            title: wish.title,
            type: 'wish' as const,
            created_at: wish.created_at,
            author: wish.first_name || wish.profiles?.display_name || 'Anonyme',
            content_preview: wish.content?.substring(0, 150) + '...',
            cover_image: wish.cover_image,
            first_name: wish.first_name
          })));
        }

        // Récupérer les entrées de journal récentes
        let diaryQuery = supabase
          .from('diary_entries')
          .select(`
            id, 
            title, 
            created_at, 
            activities, 
            media_url,
            user_id
          `)
          .order('created_at', { ascending: false })
          .limit(15);

        // Si c'est un admin, récupérer toutes les entrées, sinon seulement les siennes
        if (!hasRole('admin')) {
          diaryQuery = diaryQuery.eq('user_id', user.id);
        }

        const { data: diaryEntries } = await diaryQuery;

        if (diaryEntries) {
          // Pour les admins, récupérer les informations de profil séparément si nécessaire
          let profilesMap: { [key: string]: string } = {};
          
          if (hasRole('admin')) {
            const userIds = [...new Set(diaryEntries.map(entry => entry.user_id))];
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, display_name')
              .in('id', userIds);
            
            if (profiles) {
              profilesMap = profiles.reduce((acc, profile) => {
                acc[profile.id] = profile.display_name || 'Utilisateur';
                return acc;
              }, {} as { [key: string]: string });
            }
          }

          items.push(...diaryEntries.map(entry => ({
            id: entry.id,
            title: entry.title,
            type: 'diary' as const,
            created_at: entry.created_at,
            author: hasRole('admin') && entry.user_id !== user.id 
              ? (profilesMap[entry.user_id] || 'Utilisateur') 
              : 'Moi',
            content_preview: entry.activities?.substring(0, 150) + '...' || 'Entrée de journal',
            media_url: entry.media_url
          })));
        }

        // Récupérer les commentaires récents
        const { data: comments } = await supabase
          .from('blog_comments')
          .select(`
            id,
            content,
            created_at,
            profiles(display_name),
            post:blog_posts(id, title)
          `)
          .order('created_at', { ascending: false })
          .limit(15);

        if (comments) {
          items.push(...comments.map(comment => ({
            id: comment.id,
            title: `Commentaire sur "${comment.post?.title || 'Article supprimé'}"`,
            type: 'comment' as const,
            created_at: comment.created_at,
            author: comment.profiles?.display_name || 'Anonyme',
            content_preview: comment.content?.substring(0, 150) + '...',
            post_title: comment.post?.title,
            comment_content: comment.content
          })));
        }

        // Trier tous les éléments par date de création
        items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setRecentItems(items.slice(0, 40)); // Garder les 40 plus récents
      } catch (error) {
        console.error('Erreur lors du chargement des éléments récents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentItems();
  }, [user, hasRole]);

  const getItemLink = (item: RecentItem) => {
    switch (item.type) {
      case 'blog':
        return `/blog/${item.id}`;
      case 'wish':
        return `/wishes/${item.id}`;
      case 'diary':
        return `/diary/${item.id}`;
      case 'comment':
        return `/blog/${item.id}`; // Lien vers le post commenté
      default:
        return '#';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'blog':
        return 'Article';
      case 'wish':
        return 'Souhait';
      case 'diary':
        return 'Journal';
      case 'comment':
        return 'Commentaire';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'blog':
        return 'bg-blue-500';
      case 'wish':
        return 'bg-tranches-sage';
      case 'diary':
        return 'bg-purple-500';
      case 'comment':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-serif text-tranches-charcoal mb-6">Activité récente</h1>
        
        {recentItems.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">Aucune activité récente trouvée.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {recentItems.map((item) => (
              <Card key={`${item.type}-${item.id}`} className="hover:shadow-lg transition-shadow">
                <div className="flex">
                  <RecentItemImage
                    type={item.type}
                    id={item.id}
                    title={item.title}
                    coverImage={item.cover_image}
                    mediaUrl={item.media_url}
                  />
                  <div className="flex-1">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl text-tranches-charcoal">
                          <Link to={getItemLink(item)} className="hover:text-tranches-sage">
                            {item.title}
                          </Link>
                        </CardTitle>
                        <Badge className={`text-white ${getTypeColor(item.type)}`}>
                          {getTypeLabel(item.type)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {item.content_preview && (
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {item.content_preview}
                        </p>
                      )}
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Par {item.author}</span>
                        <span>{format(new Date(item.created_at), 'dd MMMM yyyy', { locale: fr })}</span>
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Recent;
