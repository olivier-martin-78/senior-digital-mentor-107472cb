import { ALBUM_THUMBNAILS_BUCKET, BLOG_MEDIA_BUCKET, getThumbnailUrl } from '@/utils/thumbnailtUtils';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import AlbumThumbnail from '@/components/blog/AlbumThumbnail';

const Blog = () => {
  const { user, hasRole } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [albums, setAlbums] = useState<BlogAlbum[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [postImages, setPostImages] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const { data: albumsData, error: albumsError } = await supabase
          .from('blog_albums')
          .select(`*, profiles:author_id(*)`)
          .order('name', { ascending: true });

        if (!albumsError && albumsData) {
          setAlbums(albumsData as BlogAlbum[]);
        } else if (albumsError) {
          console.error('Erreur lors du chargement des albums:', albumsError);
        }

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
  }, [user?.id]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
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

        let filteredPosts = data as PostWithAuthor[];

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

        setPosts(filteredPosts);

        // Initialize images for each post
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
  }, [user, selectedAlbum, selectedCategories, searchQuery, albums]);

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

  // Rest of the component remains unchanged
  // ... (return statement and JSX as in original)
};

export default Blog;
