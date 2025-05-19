
import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Image } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DiaryEntry } from '@/types/diary';
import { getPublicUrl } from '@/utils/storageUtils';

interface EntryCardProps {
  entry: DiaryEntry;
}

const EntryCard: React.FC<EntryCardProps> = ({ entry }) => {
  return (
    <Link 
      to={`/diary/${entry.id}`} 
      className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center mb-4 text-sm text-gray-500">
        <Calendar className="h-4 w-4 mr-2" />
        {entry.entry_date && format(parseISO(entry.entry_date), "d MMMM yyyy", { locale: fr })}
      </div>
      <h3 className="font-medium text-xl mb-2 text-tranches-charcoal">{entry.title}</h3>
      
      {entry.media_url && (
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <Image className="h-4 w-4 mr-2" />
          {entry.media_type?.startsWith('image/') ? (
            <span title={getPublicUrl(entry.media_url)}>Photo attachée</span>
          ) : entry.media_type?.startsWith('video/') ? (
            'Vidéo attachée'
          ) : entry.media_type?.startsWith('audio/') ? (
            'Audio attaché'
          ) : (
            'Média attaché'
          )}
        </div>
      )}
      
      {entry.mood_rating && (
        <div className="flex items-center mt-4">
          <div className="text-sm mr-2">Humeur:</div>
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <span 
                key={i} 
                className={`w-4 h-4 rounded-full mx-0.5 ${i < entry.mood_rating! ? 'bg-yellow-400' : 'bg-gray-200'}`}
              ></span>
            ))}
          </div>
        </div>
      )}
      
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-4">
          {entry.tags.map((tag, idx) => (
            <span 
              key={idx} 
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
};

export default EntryCard;
