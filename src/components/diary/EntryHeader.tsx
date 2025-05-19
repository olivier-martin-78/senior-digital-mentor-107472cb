
import React from 'react';
import { Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import EntryMood from './EntryMood';

interface EntryHeaderProps {
  title: string;
  date: string;
  moodRating: number | null;
}

const EntryHeader: React.FC<EntryHeaderProps> = ({ title, date, moodRating }) => {
  return (
    <header className="mb-6 border-b border-gray-200 pb-6">
      <div className="flex items-center text-sm text-gray-500 mb-3">
        <Calendar className="h-4 w-4 mr-2" />
        {date && format(parseISO(date), "EEEE d MMMM yyyy", { locale: fr })}
      </div>
      <h1 className="text-3xl font-serif text-tranches-charcoal">{title}</h1>
      
      <EntryMood rating={moodRating} />
    </header>
  );
};

export default EntryHeader;
