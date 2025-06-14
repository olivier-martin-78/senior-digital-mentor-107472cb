
import React from 'react';
import BlogPostCard from './BlogPostCard';
import { PostWithAuthor, BlogAlbum } from '@/types/supabase';

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
  selectedAlbum,
  selectedCategories
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun article trouvé</h3>
        <p className="text-gray-500">
          {searchQuery 
            ? "Aucun article ne correspond à votre recherche." 
            : "Aucun article n'a été publié pour le moment."}
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
