
import React, { useState } from 'react';
import Header from '@/components/Header';
import BlogHeader from '@/components/blog/BlogHeader';
import BlogPostGrid from '@/components/blog/BlogPostGrid';
import BlogSearch from '@/components/blog/BlogSearch';
import BlogFilters from '@/components/blog/BlogFilters';
import { useBlogData } from '@/hooks/useBlogData';
import DateRangeFilter from '@/components/DateRangeFilter';
import { useAuth } from '@/contexts/AuthContext';

const Blog = () => {
  const { user, hasRole, getEffectiveUserId, profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const { 
    posts, 
    albums, 
    loading, 
    hasCreatePermission 
  } = useBlogData(searchTerm, selectedAlbum || '', startDate, endDate, null);

  console.log('🎯 Blog.tsx - RENDU PAGE BLOG avec données complètes:', {
    user: user?.email,
    effectiveUserId: getEffectiveUserId(),
    effectiveProfile: profile?.email,
    albumsCount: albums.length,
    albumNames: albums.map(a => a.name),
    postsCount: posts.length,
    postTitles: posts.map(p => p.title),
    hasCreatePermission,
    isAdmin: hasRole('admin'),
    isEditor: hasRole('editor'),
    loading,
    searchTerm,
    selectedAlbum,
    albums: albums.map(a => ({ id: a.id, name: a.name, author_id: a.author_id }))
  });

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedAlbum(null);
    setSelectedCategories([]);
  };

  const handleSearch = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
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
        <BlogHeader 
          albums={albums}
          hasCreatePermission={hasCreatePermission}
        />
        
        <BlogFilters 
          searchQuery={searchTerm}
          setSearchQuery={setSearchTerm}
          selectedAlbum={selectedAlbum}
          setSelectedAlbum={setSelectedAlbum}
          selectedCategories={selectedCategories}
          toggleCategorySelection={toggleCategorySelection}
          albums={albums}
          categories={[]} // Pour l'instant, on garde les catégories vides car elles ne sont pas encore implémentées dans useBlogData
        />
        
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onClear={handleClearFilters}
        />
        
        <BlogPostGrid 
          posts={posts} 
          loading={loading}
          albums={albums}
          postImages={{}}
          searchQuery={searchTerm}
          selectedAlbum={selectedAlbum || ''}
          selectedCategories={selectedCategories}
        />
      </div>
    </div>
  );
};

export default Blog;
