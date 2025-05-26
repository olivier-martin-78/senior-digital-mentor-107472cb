
import React, { useState } from 'react';
import Header from '@/components/Header';
import BlogHeader from '@/components/blog/BlogHeader';
import BlogPostGrid from '@/components/blog/BlogPostGrid';
import { useBlogData } from '@/hooks/useBlogData';
import InviteUserDialog from '@/components/InviteUserDialog';
import DateRangeFilter from '@/components/DateRangeFilter';

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const { 
    posts, 
    albums, 
    loading, 
    hasCreatePermission 
  } = useBlogData(searchTerm, selectedAlbum, startDate, endDate);

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-serif text-tranches-charcoal">Albums</h1>
          <InviteUserDialog />
        </div>
        
        <BlogHeader 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedAlbum={selectedAlbum}
          onAlbumChange={setSelectedAlbum}
          albums={albums}
          hasCreatePermission={hasCreatePermission}
        />
        
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onClear={handleClearFilters}
        />
        
        <BlogPostGrid posts={posts} loading={loading} />
      </div>
    </div>
  );
};

export default Blog;
