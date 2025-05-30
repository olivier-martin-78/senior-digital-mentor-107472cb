
import React from 'react';
import { DiaryEntryWithAuthor } from '@/types/diary';
import EntryCard from './EntryCard';
import EmptyDiary from './EmptyDiary';
import LoadingSpinner from './LoadingSpinner';

interface EntriesGridProps {
  entries: DiaryEntryWithAuthor[];
  isLoading?: boolean;
}

const EntriesGrid: React.FC<EntriesGridProps> = ({ 
  entries,
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" className="my-8" />
        <p className="text-gray-500 mt-4">Chargement des entrées...</p>
      </div>
    );
  }
  
  if (entries.length === 0) {
    return <EmptyDiary />;
  }
  
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
};

export default EntriesGrid;
