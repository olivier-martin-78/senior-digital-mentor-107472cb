import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Brain, Gamepad2, Dumbbell } from 'lucide-react';
import { useActivities } from '@/hooks/useActivities';
import { useActivitySubTags } from '@/hooks/useActivitySubTags';
import ActivityCard from '@/components/activities/ActivityCard';

const ActivityPage = () => {
  const { type } = useParams<{ type: string }>();
  const [filter, setFilter] = useState<string>('');
  
  const { activities, loading } = useActivities(type || '');
  const { subTags } = useActivitySubTags(type || '');

  const getActivityInfo = (activityType: string) => {
    switch (activityType) {
      case 'meditation':
        return {
          title: 'Relaxation',
          icon: Brain,
          description: 'Activités de méditation et de relaxation pour apaiser l\'esprit',
          color: 'bg-blue-50 border-blue-200',
          iconColor: 'text-blue-600'
        };
      case 'games':
        return {
          title: 'Jeux',
          icon: Gamepad2,
          description: 'Jeux ludiques et divertissants pour stimuler l\'esprit',
          color: 'bg-green-50 border-green-200',
          iconColor: 'text-green-600'
        };
      case 'exercises':
        return {
          title: 'Gym douce',
          icon: Dumbbell,
          description: 'Exercices doux pour maintenir la forme et la mobilité',
          color: 'bg-purple-50 border-purple-200',
          iconColor: 'text-purple-600'
        };
      default:
        return {
          title: 'Activités',
          icon: Brain,
          description: 'Activités diverses',
          color: 'bg-gray-50 border-gray-200',
          iconColor: 'text-gray-600'
        };
    }
  };

  const activityInfo = getActivityInfo(type || '');
  const Icon = activityInfo.icon;

  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // Fonction pour filtrer les activités selon la sous-activité sélectionnée
  const filterActivitiesBySubTag = (activities: any[], filter: string) => {
    if (!filter) return activities;
    return activities.filter(activity => activity.sub_activity_tag_id === filter);
  };

  const filteredActivities = filterActivitiesBySubTag(activities, filter);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link 
            to="/activities/activities" 
            className="inline-flex items-center text-tranches-dustyblue hover:text-tranches-dustyblue/80 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux activités
          </Link>
          
          <div className="flex items-center mb-4">
            <Icon className={`w-8 h-8 ${activityInfo.iconColor} mr-3`} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{activityInfo.title}</h1>
              <p className="text-gray-600">{activityInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Filtre par sous-activité */}
        <div className="mb-6">
          <Label htmlFor="activity-filter">Filtrer par sous-activité</Label>
          <Select
            value={filter || 'all'}
            onValueChange={(value) => setFilter(value === 'all' ? '' : value)}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Toutes les sous-activités" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les sous-activités</SelectItem>
              {subTags.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  {tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
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
        ) : filteredActivities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActivities.map((activity) => {
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
            
            {/* Ajouter les jeux personnalisés dans la section Jeux */}
            {type === 'games' && (
              <>
                <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
                  <Link to="/activities/opposites" className="block">
                    <div className="h-48 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Gamepad2 className="w-16 h-16 mx-auto mb-4" />
                        <h3 className="text-xl font-bold">Jeu des Contraires</h3>
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg">Jeu des Contraires</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        Associez les mots contraires entre eux. Plusieurs niveaux de difficulté disponibles.
                      </p>
                    </CardContent>
                  </Link>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
                  <Link to="/activities/sudoku" className="block">
                    <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Gamepad2 className="w-16 h-16 mx-auto mb-4" />
                        <h3 className="text-xl font-bold">Sudoku</h3>
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg">Sudoku</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        Jeu de logique classique avec 5 niveaux de difficulté. Remplissez la grille 9x9 avec les chiffres de 1 à 9.
                      </p>
                    </CardContent>
                  </Link>
                </Card>
              </>
            )}
          </div>
        ) : (
          <Card className={`p-8 text-center ${activityInfo.color}`}>
            <Icon className={`w-16 h-16 ${activityInfo.iconColor} mx-auto mb-4`} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter 
                ? "Aucune activité trouvée pour cette sous-activité"
                : `Aucune activité ${activityInfo.title.toLowerCase()}`
              }
            </h3>
            <p className="text-gray-600">
              {filter 
                ? "Essayez de sélectionner une autre sous-activité ou 'Toutes les sous-activités'."
                : "Aucune activité n'est disponible dans cette catégorie pour le moment."
              }
            </p>
            
            {/* Montrer les jeux personnalisés même s'il n'y a pas d'autres activités de jeux */}
            {type === 'games' && !filter && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
                  <Link to="/activities/opposites" className="block">
                    <div className="h-48 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Gamepad2 className="w-16 h-16 mx-auto mb-4" />
                        <h3 className="text-xl font-bold">Jeu des Contraires</h3>
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg">Jeu des Contraires</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        Associez les mots contraires entre eux. Plusieurs niveaux de difficulté disponibles.
                      </p>
                    </CardContent>
                  </Link>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
                  <Link to="/activities/sudoku" className="block">
                    <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Gamepad2 className="w-16 h-16 mx-auto mb-4" />
                        <h3 className="text-xl font-bold">Sudoku</h3>
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg">Sudoku</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        Jeu de logique classique avec 5 niveaux de difficulté. Remplissez la grille 9x9 avec les chiffres de 1 à 9.
                      </p>
                    </CardContent>
                  </Link>
                </Card>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default ActivityPage;
