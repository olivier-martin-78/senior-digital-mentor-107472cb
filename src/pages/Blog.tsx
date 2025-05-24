import { ALBUM_THUMBNAILS_BUCKET, BLOG_MEDIA_BUCKET, getThumbnailUrl } from '@/utils/thumbnailtUtils';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PostWithAuthor, BlogAlbum, BlogCategory } from '@/types/supabase';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PlusCircle, Search, ImageIcon } from 'lucide-react';
import { getThumbnailUrlSync } from '@/utils/thumbnailtUtils';
import AlbumThumbnail from '@/components/blog/AlbumThumbnail';

const Blog: React.FC = () => {
  const { user, session, hasRole } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [albums, setAlbums] = useState<BlogAlbum[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [postImages, setPostImages] = useState<Record<string, string>>({});

  // Rediriger vers /auth si l'utilisateur n'est pas authentifié
  useEffect(() => {
    if (!session) {
      navigate('/auth');
    }
  }, [session, navigate]);

  // Ne rien afficher si l'utilisateur n'est pas authentifié
  if (!session) {
    return null;
  }

  // Fetch albums and categories with permission filtering
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        console.log('Fetching albums for user:', user?.email, 'with roles:', { admin: hasRole('admin'), editor: hasRole('editor') });
        
        // Fetch all albums first
        const { data: allAlbumsData, error: albumsError } = await supabase
          .from('blog_albums')
          .select(`*, profiles:author_id(*)`)
          .order('name', { ascending: true });

        if (albumsError) {
          console.error('Erreur lors du chargement des albums:', albumsError);
          return;
        }

        console.log('All albums found:', allAlbumsData?.map(a => ({ id: a.id, name: a.name, author_id: a.author_id })));

        // Filter albums based on permissions
        let accessibleAlbums = [];

        if (hasRole('admin') || hasRole('editor')) {
          // Admins and editors can see all albums
          console.log('User is admin/editor - showing all albums');
          accessibleAlbums = allAlbumsData as BlogAlbum[];
        } else {
          // For regular users, check permissions
          console.log('User is regular user - checking permissions for user_id:', user?.id);
          
          const { data: permissionsData, error: permissionsError } = await supabase
            .from('album_permissions')
            .select('album_id')
            .eq('user_id', user?.id);

          if (permissionsError) {
            console.error('Erreur lors du chargement des permissions:', permissionsError);
            return;
          }

          console.log('User permissions found:', permissionsData);
          const accessibleAlbumIds = permissionsData?.map(p => p.album_id) || [];
          console.log('Accessible album IDs:', accessibleAlbumIds);
          
          // Include albums the user has permission to see, plus albums they authored
          accessibleAlbums = allAlbumsData?.filter((album: BlogAlbum) => {
            const hasPermission = accessibleAlbumIds.includes(album.id);
            const isAuthor = album.author_id === user?.id;
            const isAccessible = hasPermission || isAuthor;
            
            console.log(`Album ${album.name}: hasPermission=${hasPermission}, isAuthor=${isAuthor}, accessible=${isAccessible}`);
            return isAccessible;
          }) || [];
        }

        console.log('Final accessible albums:', accessibleAlbums.map(a => ({ id: a.id, name: a.name })));
        setAlbums(accessibleAlbums);

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('blog_categories')
          .select('*')
          .order('name', { ascending: true });

        if (!categoriesError && categoriesData) {
          setCategories(categoriesData);
        } else if (categoriesError) {
          console.error('Erreur lors du chargement des catégories:', categoriesError);
        }
      } catch (error) {
        console.error('Error fetching filters:', error);
      }
    };

    fetchFilters();
  }, [user?.id, hasRole]);

  // Fetch posts with filters and permission checking
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        console.log('Fetching posts for user:', user?.email);
        
        let query = supabase
          .from('blog_posts')
          .select(`
            *,
            profiles:author_id(*)
          `)
          .order('created_at', { ascending: false });

        if (selectedAlbum) {
          query = query.eq('album_id', selectedAlbum);
        }

        if (searchQuery.trim()) {
          query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        console.log('All posts found:', data?.length);
        let filteredPosts = data as PostWithAuthor[];

        // Filter posts based on album permissions
        if (!hasRole('admin') && !hasRole('editor')) {
          console.log('Filtering posts based on album permissions for regular user');
          
          const { data: permissionsData, error: permissionsError } = await supabase
            .from('album_permissions')
            .select('album_id')
            .eq('user_id', user?.id);

          if (!permissionsError && permissionsData) {
            const accessibleAlbumIds = permissionsData.map(p => p.album_id);
            console.log('Accessible album IDs for posts:', accessibleAlbumIds);
            
            const beforeFilterCount = filteredPosts.length;
            
            // Include posts from accessible albums, posts without albums, or posts authored by the user
            filteredPosts = filteredPosts.filter(post => {
              const noAlbum = !post.album_id;
              const hasAlbumPermission = post.album_id && accessibleAlbumIds.includes(post.album_id);
              const isAuthor = post.author_id === user?.id;
              const isAccessible = noAlbum || hasAlbumPermission || isAuthor;
              
              if (post.album_id) {
                console.log(`Post "${post.title}" in album ${post.album_id}: hasPermission=${hasAlbumPermission}, isAuthor=${isAuthor}, accessible=${isAccessible}`);
              }
              
              return isAccessible;
            });
            
            console.log(`Posts filtered: ${beforeFilterCount} -> ${filteredPosts.length}`);
          } else {
            console.error('Error fetching permissions for posts:', permissionsError);
            // If we can't fetch permissions, only show posts without albums or authored by the user
            filteredPosts = filteredPosts.filter(post => 
              !post.album_id || post.author_id === user?.id
            );
          }
        } else {
          console.log('User is admin/editor - showing all posts');
        }

        if (selectedCategories.length > 0) {
          const { data: postCategories } = await supabase
            .from('post_categories')
            .select('post_id, category_id')
            .in('category_id', selectedCategories);

          if (postCategories) {
            const postIdsWithSelectedCategories = [...new Set(postCategories.map(pc => pc.post_id))];
            filteredPosts = filteredPosts.filter(post => 
              postIdsWithSelectedCategories.includes(post.id)
            );
          }
        }

        console.log('Final filtered posts:', filteredPosts.length);
        setPosts(filteredPosts);

        // Initialiser les images pour chaque post
        const initialPostImages: Record<string, string> = {};
        for (const post of filteredPosts) {
          initialPostImages[post.id] = await getInitialPostImage(post);
        }
        setPostImages(initialPostImages);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user, selectedAlbum, selectedCategories, searchQuery, albums, hasRole]);

  // Fonction pour obtenir l'image initiale à afficher pour un article
  const getInitialPostImage = async (post: PostWithAuthor): Promise<string> => {
    if (post.cover_image) {
      try {
        const normalizedUrl = await getThumbnailUrl(post.cover_image, BLOG_MEDIA_BUCKET);
        console.log('Post cover image URL normalized:', { original: post.cover_image, normalized: normalizedUrl });
        return normalizedUrl;
      } catch (error) {
        console.error('Error processing post cover image URL:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          cover_image: post.cover_image,
          bucket: BLOG_MEDIA_BUCKET,
        });
        return '/placeholder.svg';
      }
    }
    
    if (post.album_id) {
      const album = albums.find(a => a.id === post.album_id);
      if (album?.thumbnail_url) {
        try {
          const normalizedUrl = await getThumbnailUrl(album.thumbnail_url, ALBUM_THUMBNAILS_BUCKET);
          console.log('Album thumbnail URL normalized:', { original: album.thumbnail_url, normalized: normalizedUrl });
          return normalizedUrl;
        } catch (error) {
          console.error('Error processing album thumbnail URL:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            thumbnail_url: album.thumbnail_url,
            bucket: ALBUM_THUMBNAILS_BUCKET,
          });
          return '/placeholder.svg';
        }
      }
      console.warn('No thumbnail_url for album:', album?.name);
      return '/placeholder.svg';
    }
    
    return '/placeholder.svg';
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
  };

  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif text-tranches-charcoal">Albums</h1>
          {(hasRole('admin') || hasRole('editor')) && (
            <Button asChild className="bg-tranches-sage hover:bg-tranches-sage/90">
              <Link to="/blog/new">
                <PlusCircle className="mr-2 h-5 w-5" />
                Nouvel article
              </Link>
            </Button>
          )}
        </div>

        {/* Search and filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative w-full md:w-1/2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un article..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedAlbum || 'all'} onValueChange={(value) => setSelectedAlbum(value === 'all' ? null : value)}>
              <SelectTrigger className="w-full md:w-1/4">
                <SelectValue placeholder="Tous les albums" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les albums</SelectItem>
                {albums.map(album => (
                  <SelectItem key={album.id} value={album.id}>{album.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Categories filter */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-500 pt-1">Filtrer par catégorie:</span>
              {categories.map(category => (
                <Badge 
                  key={category.id} 
                  variant={selectedCategories.includes(category.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleCategorySelection(category.id)}
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-serif text-tranches-charcoal mb-4">Aucun article</h2>
            <p className="text-gray-600">
              {searchQuery || selectedAlbum || selectedCategories.length > 0 
                ? "Aucun article ne correspond à vos critères de recherche."
                : "Les articles apparaîtront ici une fois publiés."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.filter(post => post.published || (user && post.author_id === user.id)).map(post => (
              <Card key={post.id} className={`overflow-hidden ${!post.published ? 'border-orange-300' : ''}`}>
                {/* Image de couverture de l'article ou vignette de l'album */}
                <div className="relative w-full h-40 bg-gray-100">
                  {post.album_id ? (
                    <AlbumThumbnail 
                      album={albums.find(a => a.id === post.album_id) || null}
                      title={post.title}
                      coverImage={post.cover_image}
                    />
                  ) : (
                    <img 
                      src={postImages[post.id]} 
                      alt={post.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Post image failed to load:', postImages[post.id]);
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  )}
                  {!post.cover_image && !post.album_id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle>
                    <Link to={`/blog/${post.id}`} className="hover:text-tranches-sage transition-colors">
                      {post.title}
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    {post.profiles?.display_name || 'Utilisateur'} • {formatDate(post.created_at)}
                    {!post.published && ' • Brouillon'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-gray-600">
                    {post.content.substring(0, 150)}...
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline">
                    <Link to={`/blog/${post.id}`}>Lire la suite</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
