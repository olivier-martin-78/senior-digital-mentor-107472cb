
import React from 'react';
import { DiaryEntry } from '@/types/diary';
import EntryCard from './EntryCard';
import EmptyDiary from './EmptyDiary';

interface EntriesGridProps {
  entries: DiaryEntry[];
  isLoading?: boolean;
}

const EntriesGrid: React.FC<EntriesGridProps> = ({ 
  entries,
  isLoading = false 
}) => {
  if (entries.length === 0 && !isLoading) {
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
