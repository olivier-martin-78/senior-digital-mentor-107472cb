
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import DiaryContent from '@/components/diary/DiaryContent';
import LoadingSpinner from '@/components/diary/LoadingSpinner';
import InviteUserDialog from '@/components/InviteUserDialog';
import { Button } from '@/components/ui/button';
import { useDiaryEntries } from '@/hooks/diary/useDiaryEntries';
import { useDiaryFilters } from '@/hooks/diary/useDiaryFilters';
import { Plus } from 'lucide-react';

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

  // Utiliser le hook exactement comme dans les autres sections
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
            <Button 
              onClick={() => navigate('/diary/new')}
              className="bg-tranches-sage hover:bg-tranches-sage/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle entrée
            </Button>
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
