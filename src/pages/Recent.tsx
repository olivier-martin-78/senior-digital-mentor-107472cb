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

        // === LOGS DE DÉBOGAGE DÉTAILLÉS ===
        console.log('🔍 ===== DÉBOGAGE RECENT - DÉBUT =====');
        console.log('🔍 Utilisateur actuel:', {
          id: user.id,
          email: user.email,
          roles: hasRole('admin') ? 'admin' : hasRole('editor') ? 'editor' : 'reader'
        });

        // Récupérer d'abord les utilisateurs autorisés via les groupes d'invitation
        console.log('🔍 Récupération des utilisateurs autorisés pour user:', user.id);
        
        let authorizedUserIds = [user.id];

        if (!hasRole('admin')) {
          console.log('🔍 Utilisateur NON-ADMIN - Vérification des permissions');
          
          // Récupérer les permissions via life_story_permissions ET groupes d'invitation
          const [lifeStoryPermissionsResult, groupPermissionsResult] = await Promise.all([
            supabase
              .from('life_story_permissions')
              .select('story_owner_id')
              .eq('permitted_user_id', user.id),
            // Récupérer les créateurs de groupes dont l'utilisateur est membre
            supabase
              .from('group_members')
              .select(`
                group_id,
                invitation_groups!inner(created_by)
              `)
              .eq('user_id', user.id)
          ]);

          const lifeStoryPermissions = lifeStoryPermissionsResult.data || [];
          const groupPermissions = groupPermissionsResult.data || [];

          console.log('🔍 Life story permissions brutes:', lifeStoryPermissionsResult);
          console.log('🔍 Group permissions brutes:', groupPermissionsResult);
          console.log('🔍 Permissions life_story traitées:', lifeStoryPermissions);
          console.log('🔍 Permissions groupes traitées:', groupPermissions);

          // Ajouter les utilisateurs autorisés via life_story_permissions
          lifeStoryPermissions.forEach(p => {
            if (p.story_owner_id && !authorizedUserIds.includes(p.story_owner_id)) {
              authorizedUserIds.push(p.story_owner_id);
              console.log('🔍 Ajout utilisateur autorisé via life_story:', p.story_owner_id);
            }
          });
          
          // Ajouter les créateurs de groupes
          groupPermissions.forEach(p => {
            if (p.invitation_groups?.created_by && !authorizedUserIds.includes(p.invitation_groups.created_by)) {
              authorizedUserIds.push(p.invitation_groups.created_by);
              console.log('🔍 Ajout utilisateur autorisé via groupe:', p.invitation_groups.created_by);
            }
          });

          console.log('🔍 Utilisateurs autorisés finaux:', authorizedUserIds);
        }

        // === RÉCUPÉRATION DES ARTICLES DE BLOG ===
        console.log('🔍 ===== RÉCUPÉRATION ARTICLES BLOG =====');
        
        if (hasRole('admin')) {
          console.log('🔍 MODE ADMIN - récupération tous posts publiés');
          // Les admins voient tous les posts publiés
          console.log('Recent - Mode admin: récupération de tous les posts publiés');
          const { data: blogPosts } = await supabase
            .from('blog_posts')
            .select(`
              id,
              title,
              content,
              created_at,
              cover_image,
              author_id,
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
              author: post.author_id === user.id ? 'Moi' : (post.profiles?.display_name || 'Utilisateur'),
              content_preview: post.content?.substring(0, 150) + '...',
              cover_image: post.cover_image
            })));
          }
        } else {
          console.log('🔍 MODE UTILISATEUR NORMAL');
          console.log('🔍 authorizedUserIds:', authorizedUserIds);
          console.log('🔍 Nombre d\'utilisateurs autorisés:', authorizedUserIds.length);
          
          const hasOnlyOwnId = authorizedUserIds.length === 1 && authorizedUserIds[0] === user.id;
          console.log('🔍 A seulement son propre ID?', hasOnlyOwnId);
          
          if (hasOnlyOwnId) {
            console.log('🔍 ⚠️ UTILISATEUR SANS PERMISSIONS - récupération posts personnels uniquement');
            
            // Vérifier d'abord combien de posts l'utilisateur a créé
            const { data: userPostsCount, error: countError } = await supabase
              .from('blog_posts')
              .select('id', { count: 'exact', head: true })
              .eq('author_id', user.id);

            console.log('🔍 Nombre de posts de l\'utilisateur (count):', {
              count: userPostsCount,
              error: countError
            });

            // Récupérer seulement ses propres posts (publiés ET brouillons)
            const { data: userBlogPosts, error: userPostsError } = await supabase
              .from('blog_posts')
              .select(`
                id,
                title,
                content,
                created_at,
                cover_image,
                author_id,
                published,
                profiles(display_name)
              `)
              .eq('author_id', user.id)
              .order('created_at', { ascending: false })
              .limit(15);

            console.log('🔍 Requête posts utilisateur:', {
              data: userBlogPosts,
              error: userPostsError,
              count: userBlogPosts?.length || 0
            });

            if (userBlogPosts) {
              console.log('🔍 Posts utilisateur détaillés:', userBlogPosts.map(p => ({
                id: p.id,
                title: p.title,
                author_id: p.author_id,
                published: p.published,
                created_at: p.created_at
              })));
              
              items.push(...userBlogPosts.map(post => ({
                id: post.id,
                title: post.title,
                type: 'blog' as const,
                created_at: post.created_at,
                author: 'Moi',
                content_preview: post.content?.substring(0, 150) + '...',
                cover_image: post.cover_image
              })));
              
              console.log('🔍 Items blog ajoutés:', items.filter(i => i.type === 'blog').length);
            }
          } else {
            console.log('🔍 UTILISATEUR AVEC PERMISSIONS - récupération séparée');
            
            // L'utilisateur a des permissions vers d'autres utilisateurs
            console.log('Recent - Utilisateur avec permissions, récupération séparée des posts');
            
            // 1. Récupérer ses propres posts (TOUS, publiés ET brouillons)
            const { data: userBlogPosts } = await supabase
              .from('blog_posts')
              .select(`
                id,
                title,
                content,
                created_at,
                cover_image,
                author_id,
                published,
                profiles(display_name)
              `)
              .eq('author_id', user.id)
              .order('created_at', { ascending: false })
              .limit(10);

            // 2. Récupérer les posts des autres utilisateurs autorisés (SEULEMENT publiés)
            const otherAuthorizedIds = authorizedUserIds.filter(id => id !== user.id);
            let otherBlogPosts: any[] = [];
            
            if (otherAuthorizedIds.length > 0) {
              const { data: otherPosts } = await supabase
                .from('blog_posts')
                .select(`
                  id,
                  title,
                  content,
                  created_at,
                  cover_image,
                  author_id,
                  published,
                  profiles(display_name)
                `)
                .eq('published', true) // SEULEMENT les publiés pour les autres
                .in('author_id', otherAuthorizedIds)
                .order('created_at', { ascending: false })
                .limit(10);
              
              otherBlogPosts = otherPosts || [];
              console.log('Recent - Posts autres utilisateurs autorisés récupérés:', otherBlogPosts.length);
            }

            // Combiner et mapper les posts
            const allBlogPosts = [...(userBlogPosts || []), ...otherBlogPosts];
            console.log('Recent - Total posts blog récupérés:', allBlogPosts.length);

            if (allBlogPosts.length > 0) {
              items.push(...allBlogPosts.map(post => ({
                id: post.id,
                title: post.title,
                type: 'blog' as const,
                created_at: post.created_at,
                author: post.author_id === user.id ? 'Moi' : (post.profiles?.display_name || 'Utilisateur'),
                content_preview: post.content?.substring(0, 150) + '...',
                cover_image: post.cover_image
              })));
            }
          }
        }

        // === AUTRES CONTENUS ===
        console.log('🔍 ===== RÉCUPÉRATION AUTRES CONTENUS =====');

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
        console.log('🔍 Wishes récupérés:', wishes?.length || 0);

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

        // Récupérer les entrées de journal récentes avec permissions
        if (hasRole('admin')) {
          // Les admins voient toutes les entrées
          const { data: diaryEntries } = await supabase
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

          if (diaryEntries) {
            // Récupérer les profils pour les entrées des autres utilisateurs
            const userIds = [...new Set(diaryEntries.map(entry => entry.user_id))];
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, display_name')
              .in('id', userIds);
            
            const profilesMap = profiles?.reduce((acc, profile) => {
              acc[profile.id] = profile.display_name || 'Utilisateur';
              return acc;
            }, {} as { [key: string]: string }) || {};

            items.push(...diaryEntries.map(entry => ({
              id: entry.id,
              title: entry.title,
              type: 'diary' as const,
              created_at: entry.created_at,
              author: entry.user_id === user.id ? 'Moi' : (profilesMap[entry.user_id] || 'Utilisateur'),
              content_preview: entry.activities?.substring(0, 150) + '...' || 'Entrée de journal',
              media_url: entry.media_url
            })));
          }
        } else {
          // Récupérer les entrées de journal avec permissions
          console.log('🔍 Récupération journal pour utilisateurs autorisés:', authorizedUserIds);

          if (authorizedUserIds.length > 0) {
            const { data: diaryEntries } = await supabase
              .from('diary_entries')
              .select(`
                id, 
                title, 
                created_at, 
                activities, 
                media_url,
                user_id
              `)
              .in('user_id', authorizedUserIds)
              .order('created_at', { ascending: false })
              .limit(15);

            console.log('🔍 Entrées journal récupérées:', diaryEntries?.length || 0);

            if (diaryEntries) {
              // Récupérer les profils pour les entrées des autres utilisateurs
              const otherUserIds = diaryEntries.filter(entry => entry.user_id !== user.id).map(entry => entry.user_id);
              let profilesMap: { [key: string]: string } = {};
              
              if (otherUserIds.length > 0) {
                const { data: profiles } = await supabase
                  .from('profiles')
                  .select('id, display_name')
                  .in('id', otherUserIds);
                
                profilesMap = profiles?.reduce((acc, profile) => {
                  acc[profile.id] = profile.display_name || 'Utilisateur';
                  return acc;
                }, {} as { [key: string]: string }) || {};
              }

              items.push(...diaryEntries.map(entry => ({
                id: entry.id,
                title: entry.title,
                type: 'diary' as const,
                created_at: entry.created_at,
                author: entry.user_id === user.id ? 'Moi' : (profilesMap[entry.user_id] || 'Utilisateur'),
                content_preview: entry.activities?.substring(0, 150) + '...' || 'Entrée de journal',
                media_url: entry.media_url
              })));
            }
          }
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

        console.log('🔍 Commentaires récupérés:', comments?.length || 0);

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

        console.log('🔍 ===== RÉSUMÉ FINAL =====');
        console.log('🔍 Total éléments récupérés:', items.length);
        console.log('🔍 Répartition par type:', {
          blog: items.filter(i => i.type === 'blog').length,
          wish: items.filter(i => i.type === 'wish').length,
          diary: items.filter(i => i.type === 'diary').length,
          comment: items.filter(i => i.type === 'comment').length
        });
        console.log('🔍 Articles de blog dans le résultat final:', 
          items.filter(i => i.type === 'blog').map(i => ({
            id: i.id,
            title: i.title,
            author: i.author,
            created_at: i.created_at
          }))
        );
        console.log('🔍 ===== DÉBOGAGE RECENT - FIN =====');

        setRecentItems(items.slice(0, 40)); // Garder les 40 plus récents
      } catch (error) {
        console.error('🔍 ❌ Erreur lors du chargement des éléments récents:', error);
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
