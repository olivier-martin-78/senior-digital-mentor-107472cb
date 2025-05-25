
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import BlogHeader from '@/components/blog/BlogHeader';
import BlogFilters from '@/components/blog/BlogFilters';
import BlogPostGrid from '@/components/blog/BlogPostGrid';
import { useBlogData } from '@/hooks/useBlogData';

const Blog: React.FC = () => {
  const { user, session, hasRole } = useAuth();
  const navigate = useNavigate();
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  const { posts, albums, categories, loading, postImages } = useBlogData({
    user,
    hasRole,
    selectedAlbum,
    selectedCategories,
    searchQuery
  });

  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const canCreatePosts = hasRole('admin') || hasRole('editor');

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <BlogHeader canCreatePosts={canCreatePosts} />
        
        <BlogFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedAlbum={selectedAlbum}
          setSelectedAlbum={setSelectedAlbum}
          selectedCategories={selectedCategories}
          toggleCategorySelection={toggleCategorySelection}
          albums={albums}
          categories={categories}
        />

        <BlogPostGrid
          posts={posts}
          albums={albums}
          postImages={postImages}
          userId={user?.id}
          loading={loading}
          searchQuery={searchQuery}
          selectedAlbum={selectedAlbum}
          selectedCategories={selectedCategories}
        />
      </div>
    </div>
  );
};

export default Blog;
