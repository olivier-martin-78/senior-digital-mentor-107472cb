
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DiaryEntry } from '@/types/diary';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import EntryMood from './EntryMood';

interface EntryCardProps {
  entry: DiaryEntry;
}

const EntryCard: React.FC<EntryCardProps> = ({ entry }) => {
  const isDraft = !entry.title || entry.title.trim() === '';

  return (
    <Link to={`/diary/${entry.id}`}>
      <Card className={`hover:shadow-md transition-shadow cursor-pointer h-full ${
        isDraft ? 'bg-orange-50 border-orange-200 border-2' : ''
      }`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-medium text-tranches-charcoal line-clamp-2">
              {entry.title || 'Brouillon sans titre'}
            </CardTitle>
            <EntryMood rating={entry.mood_rating} size="sm" />
          </div>
          <p className="text-sm text-gray-500">
            {format(new Date(entry.entry_date), 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {entry.activities && (
              <p className="text-sm text-gray-600 line-clamp-2">
                <span className="font-medium">Activités:</span> {entry.activities}
              </p>
            )}
            {entry.reflections && (
              <p className="text-sm text-gray-600 line-clamp-2">
                <span className="font-medium">Réflexions:</span> {entry.reflections}
              </p>
            )}
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {entry.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs bg-tranches-sage/20 text-tranches-sage px-2 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {entry.tags.length > 3 && (
                  <span className="text-xs text-gray-500">+{entry.tags.length - 3}</span>
                )}
              </div>
            )}
            {isDraft && (
              <div className="mt-2">
                <span className="text-xs text-orange-600 font-medium">📝 Brouillon</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default EntryCard;
