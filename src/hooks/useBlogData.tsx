
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PostWithAuthor, BlogAlbum, BlogCategory } from '@/types/supabase';
import { ALBUM_THUMBNAILS_BUCKET, BLOG_MEDIA_BUCKET, getThumbnailUrl } from '@/utils/thumbnailtUtils';

interface UseBlogDataProps {
  user: any;
  hasRole: (role: string) => boolean;
  selectedAlbum: string | null;
  selectedCategories: string[];
  searchQuery: string;
}

export const useBlogData = ({ user, hasRole, selectedAlbum, selectedCategories, searchQuery }: UseBlogDataProps) => {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [albums, setAlbums] = useState<BlogAlbum[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [postImages, setPostImages] = useState<Record<string, string>>({});

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

        if (hasRole('admin')) {
          // Only admins can see all albums
          console.log('User is admin - showing all albums');
          accessibleAlbums = allAlbumsData as BlogAlbum[];
        } else {
          // For editors and regular users, check permissions
          console.log('User is editor/regular user - checking permissions for user_id:', user?.id);
          
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
        if (!hasRole('admin')) {
          console.log('Filtering posts based on album permissions for non-admin user');
          
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
          console.log('User is admin - showing all posts');
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

  return {
    posts,
    albums,
    categories,
    loading,
    postImages
  };
};
