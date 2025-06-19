
import React, { useState } from 'react';
import Header from '@/components/Header';
import BlogHeader from '@/components/blog/BlogHeader';
import BlogPostGrid from '@/components/blog/BlogPostGrid';
import BlogFilters from '@/components/blog/BlogFilters';
import BlogCategorySelector from '@/components/blog/BlogCategorySelector';
import { useBlogData } from '@/hooks/useBlogData';
import DateRangeFilter from '@/components/DateRangeFilter';

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const { 
    posts, 
    albums, 
    categories,
    loading, 
    hasCreatePermission,
    refetch 
  } = useBlogData(searchTerm, selectedAlbum || '', startDate, endDate, selectedCategories);

  console.log('🎯 Blog.tsx - RENDU PAGE BLOG:', {
    albumsCount: albums.length,
    categoriesCount: categories.length,
    postsCount: posts.length,
    hasCreatePermission,
    loading,
    searchTerm,
    selectedAlbum,
    selectedCategories
  });

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedAlbum(null);
    setSelectedCategories([]);
  };

  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleAlbumCreated = () => {
    // Refetch les données pour inclure le nouvel album
    refetch();
  };

  const handleCategoryChange = (categoryId: string) => {
    toggleCategorySelection(categoryId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <BlogHeader 
          albums={albums}
          hasCreatePermission={hasCreatePermission}
          onAlbumCreated={handleAlbumCreated}
        />
        
        <div className="mb-6 space-y-4">
          <BlogFilters 
            searchQuery={searchTerm}
            setSearchQuery={setSearchTerm}
            selectedAlbum={selectedAlbum}
            setSelectedAlbum={setSelectedAlbum}
            albums={albums}
          />
          
          <BlogCategorySelector
            categories={categories}
            selectedCategories={selectedCategories}
            onCategoryChange={handleCategoryChange}
          />
        </div>
        
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
