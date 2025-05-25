
import React from 'react';
import { PostWithAuthor, BlogAlbum } from '@/types/supabase';
import BlogPostCard from './BlogPostCard';

interface BlogPostGridProps {
  posts: PostWithAuthor[];
  albums: BlogAlbum[];
  postImages: Record<string, string>;
  userId?: string;
  loading: boolean;
  searchQuery: string;
  selectedAlbum: string | null;
  selectedCategories: string[];
}

const BlogPostGrid: React.FC<BlogPostGridProps> = ({
  posts,
  albums,
  postImages,
  userId,
  loading,
  searchQuery,
  selectedAlbum,
  selectedCategories
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-serif text-tranches-charcoal mb-4">Aucun article</h2>
        <p className="text-gray-600">
          {searchQuery || selectedAlbum || selectedCategories.length > 0 
            ? "Aucun article ne correspond à vos critères de recherche."
            : "Les articles apparaîtront ici une fois publiés."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map(post => (
        <BlogPostCard
          key={post.id}
          post={post}
          albums={albums}
          postImages={postImages}
          userId={userId}
        />
      ))}
    </div>
  );
};

export default BlogPostGrid;
