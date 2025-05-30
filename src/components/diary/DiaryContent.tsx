
import React from 'react';
import DiaryPageHeader from './DiaryPageHeader';
import EntriesGrid from './EntriesGrid';
import DateRangeFilter from '@/components/DateRangeFilter';
import SearchFilter from './SearchFilter';
import { DiaryEntryWithAuthor } from '@/types/diary';

interface DiaryContentProps {
  entries: DiaryEntryWithAuthor[];
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClearFilters: () => void;
}

const DiaryContent: React.FC<DiaryContentProps> = ({
  entries,
  searchTerm,
  onSearchTermChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClearFilters
}) => {
  return (
    <>
      <DiaryPageHeader entriesCount={entries.length} />
      
      <div className="space-y-4 mb-6">
        <SearchFilter
          searchTerm={searchTerm}
          onSearchTermChange={onSearchTermChange}
        />
        
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
          onClear={onClearFilters}
        />
      </div>
      
      {entries.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Aucune entrée trouvée pour cette période.</p>
          <p className="text-sm text-gray-400 mt-2">
            Vérifiez les filtres de date ou créez votre première entrée de journal.
          </p>
        </div>
      ) : (
        <EntriesGrid entries={entries} />
      )}
    </>
  );
};

export default DiaryContent;
