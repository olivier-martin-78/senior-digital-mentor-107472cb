
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
  console.log('🎯 BlogPostGrid - LOGS RENFORCÉS - Rendu avec données:', {
    postsCount: posts.length,
    albumsCount: albums.length,
    albumNames: albums.map(a => a.name),
    loading,
    searchQuery,
    selectedAlbum,
    selectedCategories,
    albums: albums.map(a => ({ id: a.id, name: a.name, author_id: a.author_id })),
    postsReceived: posts.map(post => ({
      id: post.id,
      title: post.title,
      author_id: post.author_id,
      author_email: post.profiles?.email || 'Email non disponible',
      album_id: post.album_id,
      published: post.published
    })),
    postsParAuteur: posts.reduce((acc, post) => {
      const authorEmail = post.profiles?.email || 'Email non disponible';
      if (!acc[authorEmail]) {
        acc[authorEmail] = 0;
      }
      acc[authorEmail]++;
      return acc;
    }, {} as Record<string, number>)
  });

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
    console.log('🎯 BlogPostGrid - LOGS RENFORCÉS - Aucun post à afficher');
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

  let renderedCount = 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => {
        console.log('🎯 BlogPostGrid - LOGS RENFORCÉS - Tentative rendu post:', {
          id: post.id,
          title: post.title,
          author_id: post.author_id,
          author_email: post.profiles?.email || 'Email non disponible',
          album_id: post.album_id,
          published: post.published,
          renderedCount: renderedCount + 1
        });
        
        const cardComponent = (
          <BlogPostCard
            key={post.id}
            post={post}
            albums={albums}
            postImages={postImages}
          />
        );
        
        renderedCount++;
        
        console.log('🎯 BlogPostGrid - LOGS RENFORCÉS - Post rendu avec succès:', {
          id: post.id,
          title: post.title,
          totalRendered: renderedCount
        });
        
        return cardComponent;
      })}
    </div>
  );
};

export default BlogPostGrid;
