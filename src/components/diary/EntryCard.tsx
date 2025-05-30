
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DiaryEntryWithAuthor } from '@/types/diary';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import EntryMood from './EntryMood';
import RecentItemImage from '@/components/RecentItemImage';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface EntryCardProps {
  entry: DiaryEntryWithAuthor;
}

const EntryCard: React.FC<EntryCardProps> = ({ entry }) => {
  const { user, hasRole } = useAuth();
  const isDraft = !entry.title || entry.title.trim() === '';
  
  // Vérifier si l'utilisateur peut modifier cette entrée
  const canEdit = user && (entry.user_id === user.id || hasRole('admin'));

  // Obtenir le nom d'affichage de l'auteur
  const authorDisplayName = entry.profiles?.display_name || entry.profiles?.email || 'Utilisateur inconnu';

  return (
    <Link to={`/diary/${entry.id}`}>
      <Card className={`hover:shadow-md transition-shadow cursor-pointer h-full ${
        isDraft ? 'bg-orange-50 border-orange-200 border-2' : ''
      }`}>
        {/* Image de couverture en pleine largeur */}
        {entry.media_url && (
          <div className="relative">
            <AspectRatio ratio={16 / 9}>
              <RecentItemImage
                type="diary"
                id={entry.id}
                title={entry.title || 'Brouillon sans titre'}
                mediaUrl={entry.media_url}
                className="w-full h-full overflow-hidden rounded-t-lg"
              />
            </AspectRatio>
            {isDraft && (
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                  📝 Brouillon
                </Badge>
              </div>
            )}
          </div>
        )}

        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-medium text-tranches-charcoal line-clamp-2">
                {entry.title || 'Brouillon sans titre'}
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {format(new Date(entry.entry_date), 'EEEE d MMMM yyyy', { locale: fr })}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Par {authorDisplayName}
              </p>
              {/* Afficher un indicateur si l'utilisateur ne peut pas modifier */}
              {!canEdit && user && entry.user_id !== user.id && (
                <p className="text-xs text-gray-400 mt-1">👀 Lecture seule</p>
              )}
            </div>
            <EntryMood rating={entry.mood_rating} />
          </div>
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
            {isDraft && !entry.media_url && (
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
