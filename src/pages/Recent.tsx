
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
          .limit(10);

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
          .limit(10);

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

        // Récupérer les entrées de journal récentes (seulement les siennes sauf pour les admins)
        const targetUserId = user.id;
        const { data: diaryEntries } = await supabase
          .from('diary_entries')
          .select('id, title, created_at, activities, media_url')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (diaryEntries) {
          items.push(...diaryEntries.map(entry => ({
            id: entry.id,
            title: entry.title,
            type: 'diary' as const,
            created_at: entry.created_at,
            author: 'Moi',
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
          .limit(10);

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

        setRecentItems(items.slice(0, 20)); // Garder les 20 plus récents
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

  const renderItemImage = (item: RecentItem) => {
    console.log('Recent - renderItemImage pour:', {
      type: item.type,
      id: item.id,
      cover_image: item.cover_image,
      media_url: item.media_url
    });

    // Pour les commentaires, pas d'image
    if (item.type === 'comment') {
      console.log('Recent - Pas d\'image pour commentaire:', item.id);
      return null;
    }

    let imageUrl = '';
    let bucket = '';
    let imagePath = '';

    // Pour les entrées de journal, utiliser media_url avec le bucket diary_media
    if (item.type === 'diary' && item.media_url) {
      bucket = 'diary_media';
      imagePath = item.media_url;
      console.log('Recent - Traitement image journal - ID:', item.id, 'media_url:', item.media_url);
    }
    // Pour les souhaits et blogs, utiliser cover_image avec le bucket album-thumbnails
    else if ((item.type === 'wish' || item.type === 'blog') && item.cover_image) {
      bucket = 'album-thumbnails';
      imagePath = item.cover_image;
      console.log('Recent - Traitement image', item.type, '- ID:', item.id, 'cover_image:', item.cover_image);
    }
    
    if (!imagePath) {
      console.log('Recent - Pas d\'image pour:', item.type, item.id);
      return null;
    }
    
    // Si c'est déjà une URL complète, l'utiliser directement
    if (imagePath.startsWith('http')) {
      imageUrl = imagePath;
      console.log('Recent - URL complète détectée pour', item.type, ':', imageUrl);
    } else {
      // Sinon, générer l'URL depuis le chemin
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(imagePath);
      imageUrl = data?.publicUrl || '';
      console.log('Recent - URL générée pour', item.type, ':', {
        bucket,
        chemin: imagePath,
        urlGeneree: imageUrl
      });
    }
    
    if (!imageUrl) {
      console.error('Recent - Impossible de générer l\'URL pour:', {
        type: item.type,
        id: item.id,
        bucket,
        imagePath
      });
      return null;
    }

    return (
      <div className="w-48 h-32 flex-shrink-0 overflow-hidden rounded-l-lg">
        <img
          src={imageUrl}
          alt={item.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error('Recent - ERREUR chargement image:');
            console.error('- Type:', item.type);
            console.error('- ID:', item.id);
            console.error('- Bucket:', bucket);
            console.error('- Path original:', imagePath);
            console.error('- URL finale:', imageUrl);
            console.error('- Erreur:', e);
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
          onLoad={() => {
            console.log('Recent - SUCCESS image chargée pour:', {
              type: item.type,
              id: item.id,
              bucket,
              chemin: imagePath,
              url: imageUrl
            });
          }}
        />
      </div>
    );
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
                  {renderItemImage(item)}
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
