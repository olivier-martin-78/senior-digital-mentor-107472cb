
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import DiaryContent from '@/components/diary/DiaryContent';
import LoadingSpinner from '@/components/diary/LoadingSpinner';
import InviteUserDialog from '@/components/InviteUserDialog';
import { useDiaryEntries } from '@/hooks/diary/useDiaryEntries';
import { useDiaryFilters } from '@/hooks/diary/useDiaryFilters';

const Diary = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const {
    searchTerm,
    setSearchTerm,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    handleClearFilters
  } = useDiaryFilters();

  const { entries, loading } = useDiaryEntries(searchTerm, startDate, endDate);

  if (!session) {
    navigate('/auth');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Header />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-serif text-tranches-charcoal">Mon Journal</h1>
          <div className="flex gap-3">
            <InviteUserDialog />
          </div>
        </div>
        
        <DiaryContent
          entries={entries}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onClearFilters={handleClearFilters}
        />
      </div>
    </div>
  );
};

export default Diary;
