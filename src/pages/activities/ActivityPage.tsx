
import React from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/Header';
import ActivityCard from '@/components/activities/ActivityCard';
import { useActivities } from '@/hooks/useActivities';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Plus, Settings } from 'lucide-react';

const activityTitles: Record<string, string> = {
  meditation: 'Méditation',
  games: 'Jeux',
  gratitude: 'Gratitude',
  connection: 'Connexion',
  exercises: 'Exercices',
  compassion: 'Compassion',
  reading: 'Lecture',
  writing: 'Écriture',
};

const ActivityPage = () => {
  const { type } = useParams<{ type: string }>();
  const { hasRole } = useAuth();
  const { activities, loading } = useActivities(type || '');

  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const isYouTubeUrl = (url: string): boolean => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pt-20 px-4">
          <div className="container mx-auto">
            <div className="flex justify-center items-center h-64">
              <div className="text-lg">Chargement...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="pt-20 px-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {activityTitles[type || ''] || 'Activités'}
            </h1>
            <div className="flex gap-2">
              {hasRole('admin') && (
                <Button asChild>
                  <Link to={`/admin/activities/${type}`} className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Gérer les activités
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link to={`/admin/activities/${type}`} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter une activité
                </Link>
              </Button>
            </div>
          </div>

          {activities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                Aucune activité disponible pour le moment.
              </p>
              <Button asChild>
                <Link to={`/admin/activities/${type}`}>
                  Ajouter la première activité
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.map((activity) => {
                const isYouTube = isYouTubeUrl(activity.link);
                const videoId = isYouTube ? getYouTubeVideoId(activity.link) : null;

                return (
                  <ActivityCard
                    key={activity.id}
                    title={activity.title}
                    link={activity.link}
                    isYouTube={isYouTube}
                    videoId={videoId || undefined}
                    thumbnailUrl={activity.thumbnail_url}
                    activityDate={activity.activity_date}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;
