
import React from 'react';
import { PostWithAuthor, BlogAlbum } from '@/types/supabase';
import BlogPostCard from './BlogPostCard';
import { Loader2 } from 'lucide-react';

interface BlogPostGridProps {
  posts: PostWithAuthor[];
  loading: boolean;
  albums: BlogAlbum[];
  postImages: Record<string, string>;
  searchQuery: string;
  selectedAlbum: string;
  selectedCategories: string[];
}

const BlogPostGrid: React.FC<BlogPostGridProps> = ({
  posts,
  loading,
  albums,
  postImages,
  searchQuery,
  selectedCategories
}) => {
  console.log('🎯 BlogPostGrid - Props reçues:', {
    postsCount: posts.length,
    selectedCategories,
    searchQuery
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des articles...</span>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-lg">
          {selectedCategories.length > 0 
            ? "Aucun article trouvé pour les catégories sélectionnées."
            : searchQuery 
              ? "Aucun article trouvé pour votre recherche." 
              : "Aucun article disponible."
          }
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <BlogPostCard
          key={post.id}
          post={post}
          albums={albums}
          postImages={postImages}
        />
      ))}
    </div>
  );
};

export default BlogPostGrid;
