
import React from 'react';
import MoodDisplay from '@/components/MoodDisplay';

interface EntryMoodProps {
  rating: number | null;
}

const EntryMood: React.FC<EntryMoodProps> = ({ rating }) => {
  if (!rating) return null;
  
  return (
    <div className="mt-4">
      <MoodDisplay rating={rating} size="lg" />
    </div>
  );
};

export default EntryMood;
