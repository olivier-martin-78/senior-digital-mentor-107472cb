
import React from 'react';
import { Smile } from 'lucide-react';

interface EntryMoodProps {
  rating: number | null;
}

const EntryMood: React.FC<EntryMoodProps> = ({ rating }) => {
  if (!rating) return null;
  
  return (
    <div className="flex items-center mt-4">
      <Smile className="h-5 w-5 mr-2 text-gray-600" />
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <span 
            key={i} 
            className={`w-5 h-5 rounded-full mx-0.5 ${i < rating ? 'bg-yellow-400' : 'bg-gray-200'}`}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default EntryMood;
