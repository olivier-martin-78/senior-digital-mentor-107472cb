
import React from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import EntryMood from './EntryMood';

interface EntryHeaderProps {
  title: string;
  date: string;
  moodRating: number | null;
  isLocked?: boolean;
}

const EntryHeader: React.FC<EntryHeaderProps> = ({ 
  title, 
  date, 
  moodRating,
  isLocked = false 
}) => {
  // Créer la date en ajoutant explicitement l'heure pour éviter les problèmes de fuseau horaire
  const formattedDate = format(new Date(date + 'T12:00:00'), 'EEEE d MMMM yyyy', { locale: fr });

  return (
    <header className="mb-8">
      <h1 className="text-3xl font-serif text-tranches-charcoal mb-2">{title}</h1>
      <time className="text-tranches-sage text-lg font-medium capitalize">
        {formattedDate}
      </time>
      
      {/* Afficher l'humeur seulement si l'entrée n'est pas verrouillée */}
      {!isLocked && <EntryMood rating={moodRating} />}
    </header>
  );
};

export default EntryHeader;
