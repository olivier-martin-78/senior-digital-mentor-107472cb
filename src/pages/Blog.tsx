
import React, { useState } from 'react';
import Header from '@/components/Header';
import BlogHeader from '@/components/blog/BlogHeader';
import BlogPostGrid from '@/components/blog/BlogPostGrid';
import { useBlogData } from '@/hooks/useBlogData';
import InviteUserDialog from '@/components/InviteUserDialog';
import DateRangeFilter from '@/components/DateRangeFilter';
import UserSelector from '@/components/UserSelector';
import { useAuth } from '@/contexts/AuthContext';

const Blog = () => {
  const { user, hasRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(user?.id || null);
  
  const { 
    posts, 
    albums, 
    loading, 
    hasCreatePermission 
  } = useBlogData(searchTerm, selectedAlbum, startDate, endDate, selectedUserId);

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const handleUserChange = (userId: string | null) => {
    setSelectedUserId(userId);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-serif text-tranches-charcoal">Blog (Photos/Vidéos)</h1>
          <InviteUserDialog />
        </div>

        <UserSelector
          permissionType="life_story"
          selectedUserId={selectedUserId}
          onUserChange={handleUserChange}
          className="mb-6"
        />
        
        <BlogHeader 
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
