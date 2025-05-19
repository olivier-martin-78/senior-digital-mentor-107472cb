
import React from 'react';
import EntryMedia from './EntryMedia';
import EntrySection from './EntrySection';
import PrivateNotesSection from './PrivateNotesSection';
import { DiaryEntry } from '@/types/diary';

interface EntryContentProps {
  entry: DiaryEntry;
}

const EntryContent: React.FC<EntryContentProps> = ({ entry }) => {
  return (
    <div className="space-y-6">
      <EntryMedia mediaUrl={entry.media_url} mediaType={entry.media_type} />

      <EntrySection 
        title="Ce que j'ai fait aujourd'hui" 
        content={entry.activities} 
      />

      <div className="grid md:grid-cols-2 gap-8">
        <EntrySection
          title="Choses positives"
          content={entry.positive_things}
        />

        <EntrySection
          title="Choses négatives"
          content={entry.negative_things}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <EntrySection
          title="Forme physique"
          content={entry.physical_state ? entry.physical_state : undefined}
        />

        <EntrySection
          title="Forme mentale"
          content={entry.mental_state ? entry.mental_state : undefined}
        />
      </div>

      <EntrySection
        title="Personnes contactées"
        tags={entry.contacted_people}
      />

      <EntrySection
        title="Réflexions du jour"
        content={entry.reflections}
      />

      <EntrySection
        title="Envie du jour"
        content={entry.desire_of_day}
      />

      <PrivateNotesSection
        notes={entry.private_notes}
        isLocked={entry.is_private_notes_locked}
      />

      <EntrySection
        title="Objectifs ou tâches"
        content={entry.objectives}
      />

      <EntrySection
        title="Tags"
        tags={entry.tags}
      />
    </div>
  );
};

export default EntryContent;
