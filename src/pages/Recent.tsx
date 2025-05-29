
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import InviteUserDialog from '@/components/InviteUserDialog';
import DateRangeFilter from '@/components/DateRangeFilter';
import { ImageIcon, MessageCircleIcon } from 'lucide-react';
import { getThumbnailUrl, BLOG_MEDIA_BUCKET, DIARY_MEDIA_BUCKET } from '@/utils/thumbnailtUtils';

const Recent = () => {
  const { user, session, hasRole } = useAuth();
  const navigate = useNavigate();
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [itemThumbnails, setItemThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!session) {
      navigate('/auth');
      return;
    }
    fetchRecentItems();
  }, [session, navigate, startDate, endDate]);

  // Charger les vignettes des articles
  useEffect(() => {
    const loadThumbnails = async () => {
      const thumbnailPromises = recentItems.map(async (item) => {
        if (item.type === 'blog' && item.cover_image) {
          try {
            const url = await getThumbnailUrl(item.cover_image, BLOG_MEDIA_BUCKET);
            return { id: item.id, url };
          } catch (error) {
            console.error('Erreur lors du chargement de la vignette:', error);
            return { id: item.id, url: '/placeholder.svg' };
          }
        } else if (item.type === 'diary' && item.media_url) {
          try {
            console.log('Chargement vignette diary pour:', item.media_url);
            const url = await getThumbnailUrl(item.media_url, DIARY_MEDIA_BUCKET);
            console.log('URL vignette diary générée:', url);
            return { id: item.id, url };
          } catch (error) {
            console.error('Erreur lors du chargement de la vignette diary:', error);
            return { id: item.id, url: '/placeholder.svg' };
          }
        } else if (item.type === 'comment' && item.post_cover_image) {
          try {
            const url = await getThumbnailUrl(item.post_cover_image, BLOG_MEDIA_BUCKET);
            return { id: item.id, url };
          } catch (error) {
            console.error('Erreur lors du chargement de la vignette du commentaire:', error);
            return { id: item.id, url: '/placeholder.svg' };
          }
        }
        return { id: item.id, url: null };
      });

      const thumbnails = await Promise.all(thumbnailPromises);
      const thumbnailMap = thumbnails.reduce((acc, { id, url }) => {
        if (url) acc[id] = url;
        return acc;
      }, {} as Record<string, string>);
      
      console.log('Thumbnails map:', thumbnailMap);
      setItemThumbnails(thumbnailMap);
    };

    if (recentItems.length > 0) {
      loadThumbnails();
    }
  }, [recentItems]);

  const fetchRecentItems = async () => {
    try {
      setLoading(true);
      
      // Construction des requêtes avec gestion des permissions
      let blogQuery = supabase
        .from('blog_posts')
        .select('*, profiles(display_name, email)')
        .eq('published', true)
        .order('created_at', { ascending: false });

      let diaryQuery = supabase
        .from('diary_entries')
        .select('*, profiles:user_id(display_name, email)')
        .order('created_at', { ascending: false });

      let commentsQuery = supabase
        .from('blog_comments')
        .select(`
          *,
          profiles:author_id(display_name, email, avatar_url),
          blog_posts:post_id(id, title, cover_image)
        `)
        .order('created_at', { ascending: false });

      // Requête pour les souhaits (tous les utilisateurs peuvent voir tous les souhaits publiés)
      let wishQuery = supabase
        .from('wish_posts')
        .select('*, profiles(display_name, email)')
        .eq('published', true)
        .order('created_at', { ascending: false });

      // Requête pour les histoires de vie
      let lifeStoryQuery = supabase
        .from('life_stories')
        .select('*, profiles:user_id(display_name, email)')
        .order('updated_at', { ascending: false });

      // Gestion des permissions pour les non-administrateurs
      if (!hasRole('admin')) {
        // Pour les articles de blog, utiliser les permissions life_story
        const { data: lifeStoryPermissions, error: permError } = await supabase
          .from('life_story_permissions')
          .select('story_owner_id')
          .eq('permitted_user_id', user?.id);

        if (permError) {
          console.error('Erreur lors de la récupération des permissions life_story:', permError);
        }

        // Créer une liste des utilisateurs autorisés pour les articles
        const authorizedUserIds = [user?.id];
        if (lifeStoryPermissions?.length) {
          lifeStoryPermissions.forEach(p => {
            if (p.story_owner_id && !authorizedUserIds.includes(p.story_owner_id)) {
              authorizedUserIds.push(p.story_owner_id);
            }
          });
        }

        console.log('Utilisateurs autorisés pour les articles:', authorizedUserIds);
        blogQuery = blogQuery.in('author_id', authorizedUserIds);
        commentsQuery = commentsQuery.in('author_id', authorizedUserIds);

        // Pour les journaux, seuls les propres journaux de l'utilisateur
        diaryQuery = diaryQuery.eq('user_id', user?.id);

        // Pour les histoires de vie, seulement celle de l'utilisateur
        lifeStoryQuery = lifeStoryQuery.eq('user_id', user?.id);
      }

      // Appliquer les filtres de date si définis
      if (startDate) {
        blogQuery = blogQuery.gte('created_at', startDate);
        diaryQuery = diaryQuery.gte('created_at', startDate);
        commentsQuery = commentsQuery.gte('created_at', startDate);
        wishQuery = wishQuery.gte('created_at', startDate);
        lifeStoryQuery = lifeStoryQuery.gte('updated_at', startDate);
      }
      if (endDate) {
        const endDateTime = endDate + 'T23:59:59';
        blogQuery = blogQuery.lte('created_at', endDateTime);
        diaryQuery = diaryQuery.lte('created_at', endDateTime);
        commentsQuery = commentsQuery.lte('created_at', endDateTime);
        wishQuery = wishQuery.lte('created_at', endDateTime);
        lifeStoryQuery = lifeStoryQuery.lte('updated_at', endDateTime);
      }

      const [blogResponse, diaryResponse, commentsResponse, wishResponse, lifeStoryResponse] = await Promise.all([
        blogQuery.limit(10),
        diaryQuery.limit(10),
        commentsQuery.limit(10),
        wishQuery.limit(10),
        lifeStoryQuery.limit(10)
      ]);

      if (blogResponse.error) {
        console.error('Erreur blog:', blogResponse.error);
        throw blogResponse.error;
      }
      if (diaryResponse.error) {
        console.error('Erreur diary:', diaryResponse.error);
        throw diaryResponse.error;
      }
      if (commentsResponse.error) {
        console.error('Erreur comments:', commentsResponse.error);
        throw commentsResponse.error;
      }
      if (wishResponse.error) {
        console.error('Erreur wish:', wishResponse.error);
        throw wishResponse.error;
      }
      if (lifeStoryResponse.error) {
        console.error('Erreur life story:', lifeStoryResponse.error);
        throw lifeStoryResponse.error;
      }

      console.log('Réponses récupérées:', {
        blog: blogResponse.data?.length || 0,
        diary: diaryResponse.data?.length || 0,
        comments: commentsResponse.data?.length || 0,
        wishes: wishResponse.data?.length || 0,
        lifeStories: lifeStoryResponse.data?.length || 0
      });

      // Formatter les différents types d'éléments
      const formattedComments = commentsResponse.data.map(comment => ({
        ...comment,
        type: 'comment',
        title: `Commentaire sur "${comment.blog_posts?.title || 'Article'}"`,
        post_id: comment.post_id,
        post_title: comment.blog_posts?.title,
        post_cover_image: comment.blog_posts?.cover_image
      }));

      const formattedWishes = wishResponse.data.map(wish => ({
        ...wish,
        type: 'wish',
        title: wish.title
      }));

      const formattedLifeStories = lifeStoryResponse.data.map(story => ({
        ...story,
        type: 'life_story',
        title: `Histoire de vie: ${story.title}`,
        created_at: story.updated_at // Utiliser updated_at pour le tri
      }));

      // Combiner et trier par date
      const allItems = [
        ...blogResponse.data.map(item => ({ ...item, type: 'blog' })),
        ...diaryResponse.data.map(item => ({ ...item, type: 'diary' })),
        ...formattedComments,
        ...formattedWishes,
        ...formattedLifeStories
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log('Total d\'éléments combinés:', allItems.length);
      setRecentItems(allItems.slice(0, 20));
    } catch (error) {
      console.error('Erreur lors du chargement des éléments récents:', error);
      setRecentItems([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy à HH:mm', { locale: fr });
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const getItemLink = (item: any) => {
    if (item.type === 'blog') {
      return `/blog/${item.id}`;
    } else if (item.type === 'diary') {
      return `/diary/${item.id}`;
    } else if (item.type === 'comment') {
      return `/blog/${item.post_id}`;
    } else if (item.type === 'wish') {
      return `/wishes/${item.id}`;
    } else if (item.type === 'life_story') {
      return `/life-story`;
    }
    return '#';
  };

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'blog': return 'Album';
      case 'diary': return 'Journal';
      case 'comment': return 'Commentaire';
      case 'wish': return 'Souhait';
      case 'life_story': return 'Histoire de vie';
      default: return type;
    }
  };

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case 'blog': return 'bg-blue-100 text-blue-800';
      case 'diary': return 'bg-green-100 text-green-800';
      case 'comment': return 'bg-purple-100 text-purple-800';
      case 'wish': return 'bg-orange-100 text-orange-800';
      case 'life_story': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-serif text-tranches-charcoal">Activité récente</h1>
          <InviteUserDialog />
        </div>

        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onClear={handleClearFilters}
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="grid gap-4 mt-6">
            {recentItems.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">Aucune activité récente trouvée pour cette période.</p>
                </CardContent>
              </Card>
            ) : (
              recentItems.map((item, index) => (
                <Card key={`${item.type}-${item.id}-${index}`} className="hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex">
                    {/* Vignette */}
                    <div className="w-24 h-24 flex-shrink-0">
                      {item.type === 'comment' ? (
                        <div className="w-full h-full bg-blue-50 flex items-center justify-center rounded-l-lg">
                          <MessageCircleIcon className="h-10 w-10 text-blue-300" />
                        </div>
                      ) : itemThumbnails[item.id] ? (
                        <img
                          src={itemThumbnails[item.id]}
                          alt={`Vignette de ${item.title}`}
                          className="w-full h-full object-cover rounded-l-lg"
                          onError={(e) => {
                            console.error('Erreur de chargement de vignette:', itemThumbnails[item.id]);
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-l-lg">
                          <ImageIcon className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                    
                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <CardHeader 
                        className="pb-2"
                        onClick={() => navigate(getItemLink(item))}
                      >
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg font-medium text-tranches-charcoal truncate">
                            {item.title}
                          </CardTitle>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${getItemTypeColor(item.type)}`}>
                            {getItemTypeLabel(item.type)}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent 
                        className="pt-0"
                        onClick={() => navigate(getItemLink(item))}
                      >
                        <p className="text-sm text-gray-600 mb-2">
                          {formatDate(item.created_at)}
                        </p>
                        {item.type === 'blog' && item.profiles && (
                          <p className="text-sm text-gray-500">
                            Par {item.profiles.display_name || item.profiles.email}
                          </p>
                        )}
                        {item.type === 'diary' && item.profiles && (
                          <p className="text-sm text-gray-500">
                            Par {item.profiles.display_name || item.profiles.email}
                          </p>
                        )}
                        {item.type === 'comment' && item.profiles && (
                          <div>
                            <p className="text-sm text-gray-500">
                              Par {item.profiles.display_name || item.profiles.email}
                            </p>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              "{item.content}"
                            </p>
                          </div>
                        )}
                        {item.type === 'wish' && item.profiles && (
                          <p className="text-sm text-gray-500">
                            Par {item.profiles.display_name || item.profiles.email}
                          </p>
                        )}
                        {item.type === 'life_story' && item.profiles && (
                          <p className="text-sm text-gray-500">
                            Par {item.profiles.display_name || item.profiles.email}
                          </p>
                        )}
                      </CardContent>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Recent;
