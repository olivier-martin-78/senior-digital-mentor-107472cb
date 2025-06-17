
import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Brain, Gamepad2, Dumbbell } from 'lucide-react';
import { useActivities } from '@/hooks/useActivities';
import ActivityCard from '@/components/activities/ActivityCard';

const ActivitiesOverview = () => {
  const { activities: meditationActivities, loading: meditationLoading } = useActivities('meditation');
  const { activities: gamesActivities, loading: gamesLoading } = useActivities('games');
  const { activities: exercisesActivities, loading: exercisesLoading } = useActivities('exercises');

  const sections = [
    {
      title: 'Relaxation',
      type: 'meditation',
      icon: Brain,
      description: 'Activités de méditation et de relaxation pour apaiser l\'esprit',
      activities: meditationActivities,
      loading: meditationLoading,
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Jeux',
      type: 'games',
      icon: Gamepad2,
      description: 'Jeux ludiques et divertissants pour stimuler l\'esprit',
      activities: gamesActivities,
      loading: gamesLoading,
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'Gym douce',
      type: 'exercises',
      icon: Dumbbell,
      description: 'Exercices doux pour maintenir la forme et la mobilité',
      activities: exercisesActivities,
      loading: exercisesLoading,
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      iconColor: 'text-purple-600'
    }
  ];

  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-tranches-dustyblue mr-2" />
            <h1 className="text-3xl font-bold text-gray-900">Toutes les Activités</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Découvrez toutes les activités disponibles organisées par catégories
          </p>
        </div>

        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.type} className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Icon className={`w-8 h-8 ${section.iconColor} mr-3`} />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                    <p className="text-gray-600">{section.description}</p>
                  </div>
                </div>
                <Link 
                  to={`/activities/${section.type}`}
                  className="text-tranches-dustyblue hover:text-tranches-dustyblue/80 font-medium"
                >
                  Voir tout →
                </Link>
              </div>

              {section.loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, index) => (
                    <Card key={index} className="animate-pulse">
                      <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                      <CardHeader>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : section.activities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {section.activities.slice(0, 6).map((activity) => {
                    const isYouTube = isYouTubeUrl(activity.link);
                    const videoId = isYouTube ? extractYouTubeId(activity.link) : undefined;
                    
                    return (
                      <ActivityCard
                        key={activity.id}
                        title={activity.title}
                        link={activity.link}
                        isYouTube={isYouTube}
                        videoId={videoId}
                        thumbnailUrl={activity.thumbnail_url}
                        activityDate={activity.activity_date}
                        subActivityName={activity.activity_sub_tags?.name}
                      />
                    );
                  })}
                </div>
              ) : (
                <Card className={`p-8 text-center ${section.color}`}>
                  <Icon className={`w-16 h-16 ${section.iconColor} mx-auto mb-4`} />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucune activité {section.title.toLowerCase()}
                  </h3>
                  <p className="text-gray-600">
                    Aucune activité n'est disponible dans cette catégorie pour le moment.
                  </p>
                </Card>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivitiesOverview;
