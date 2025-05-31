
import React, { useState } from 'react';
import Header from '@/components/Header';
import BlogHeader from '@/components/blog/BlogHeader';
import BlogPostGrid from '@/components/blog/BlogPostGrid';
import BlogSearch from '@/components/blog/BlogSearch';
import { useBlogData } from '@/hooks/useBlogData';
import DateRangeFilter from '@/components/DateRangeFilter';
import { useAuth } from '@/contexts/AuthContext';

const Blog = () => {
  const { user, hasRole, getEffectiveUserId, profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const { 
    posts, 
    albums, 
    loading, 
    hasCreatePermission 
  } = useBlogData(searchTerm, selectedAlbum, startDate, endDate, null);

  console.log('Blog.tsx - Données de la page Blog:', {
    user: user?.email,
    effectiveUserId: getEffectiveUserId(),
    effectiveProfile: profile?.email,
    albumsCount: albums.length,
    postsCount: posts.length,
    hasCreatePermission,
    isAdmin: hasRole('admin'),
    isEditor: hasRole('editor'),
    loading
  });

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const handleSearch = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-serif text-tranches-charcoal">Blog (Photos/Vidéos)</h1>
        </div>
        
        <BlogHeader 
          albums={albums}
          hasCreatePermission={hasCreatePermission}
        />
        
        <BlogSearch 
          onSearch={handleSearch}
          initialSearchTerm={searchTerm}
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
          selectedAlbum={selectedAlbum}
          selectedCategories={[]}
        />
      </div>
    </div>
  );
};

export default Blog;
