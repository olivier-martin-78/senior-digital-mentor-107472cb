
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Sparkles, Brain, Gamepad2, Dumbbell, Languages } from 'lucide-react';
import { useActivities } from '@/hooks/useActivities';
import { useActivitySubTags } from '@/hooks/useActivitySubTags';
import ActivityCard from '@/components/activities/ActivityCard';

const ActivitiesOverview = () => {
  const { activities: meditationActivities, loading: meditationLoading } = useActivities('meditation');
  const { activities: gamesActivities, loading: gamesLoading } = useActivities('games');
  const { activities: exercisesActivities, loading: exercisesLoading } = useActivities('exercises');
  
  // Hooks pour les sous-activités
  const { subTags: meditationSubTags } = useActivitySubTags('meditation');
  const { subTags: gamesSubTags } = useActivitySubTags('games');
  const { subTags: exercisesSubTags } = useActivitySubTags('exercises');

  // États pour les filtres par sous-activité
  const [meditationFilter, setMeditationFilter] = useState<string>('');
  const [gamesFilter, setGamesFilter] = useState<string>('');
  const [exercisesFilter, setExercisesFilter] = useState<string>('');

  const sections = [
    {
      title: 'Relaxation',
      type: 'meditation',
      icon: Brain,
      description: 'Activités de méditation, de yoga et de relaxation pour apaiser l\'esprit',
      activities: meditationActivities,
      loading: meditationLoading,
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      iconColor: 'text-blue-600',
      subTags: meditationSubTags,
      filter: meditationFilter,
      setFilter: setMeditationFilter
    },
    {
      title: 'Jeux cognitifs',
      type: 'games',
      icon: Gamepad2,
      description: 'Jeux ludiques et divertissants pour stimuler l\'esprit',
      activities: gamesActivities,
      loading: gamesLoading,
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      iconColor: 'text-green-600',
      subTags: gamesSubTags,
      filter: gamesFilter,
      setFilter: setGamesFilter
    },
    {
      title: 'Gym douce',
      type: 'exercises',
      icon: Dumbbell,
      description: 'Exercices doux pour maintenir la forme et la mobilité',
      activities: exercisesActivities,
      loading: exercisesLoading,
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      iconColor: 'text-purple-600',
      subTags: exercisesSubTags,
      filter: exercisesFilter,
      setFilter: setExercisesFilter
    }
  ];

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

  // Jeux intégrés à afficher dans la section jeux
  const getIntegratedGames = (filter?: string) => {
    const remueMeningesSubTag = gamesSubTags.find(tag => tag.name === 'Remue-méninges');
    const remueMeningesId = remueMeningesSubTag?.id;
    
    const games = [
      {
        key: "opposites",
        subTagId: remueMeningesId,
        card: <Card key="opposites" className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
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
      },
      {
        key: "sudoku",
        subTagId: remueMeningesId,
        card: <Card key="sudoku" className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
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
      },
      {
        key: "crossword",
        subTagId: remueMeningesId,
        card: <Card key="crossword" className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
          <Link to="/activities/crossword" className="block">
            <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
              <div className="text-center text-white">
                <Gamepad2 className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-bold">Mots Croisés Fléchés</h3>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-lg">Mots Croisés Fléchés</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Remplissez la grille en suivant les définitions et les flèches. 5 niveaux de difficulté disponibles.
              </p>
            </CardContent>
          </Link>
        </Card>
      },
      {
        key: "translation",
        subTagId: remueMeningesId,
        card: <Card key="translation" className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
          <Link to="/activities/translation" className="block">
            <div className="h-48 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
              <div className="text-center text-white">
                <Languages className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-bold">Jeu de Traduction</h3>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-lg">Jeu de Traduction</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Traduisez 20 mots entre le français et l'anglais. Deux modes disponibles avec historique des scores.
              </p>
            </CardContent>
          </Link>
        </Card>
      },
      {
        key: "quiz70s",
        subTagId: remueMeningesId,
        card: <Card key="quiz70s" className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
          <Link to="/activities/quiz70s" className="block">
            <div className="h-48 bg-gradient-to-br from-pink-400 to-orange-500 flex items-center justify-center">
              <div className="text-center text-white">
                <Gamepad2 className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-bold">Quiz Années 70</h3>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-lg">Quiz Années 70</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Testez vos connaissances sur cette décennie fascinante ! 15 questions sur les événements marquants des années 70.
              </p>
            </CardContent>
          </Link>
        </Card>
      }
    ];

    // Filtrer par sous-activité si un filtre est appliqué
    if (filter && filter !== '') {
      return games.filter(game => game.subTagId === filter).map(game => game.card);
    }
    
    return games.map(game => game.card);
  };

  return (
    <div className="min-h-screen bg-white">
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
          const filteredActivities = filterActivitiesBySubTag(section.activities, section.filter);
          
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

              {/* Filtre par sous-activité */}
              <div className="mb-6">
                <Label htmlFor={`${section.type}-filter`}>Filtrer par sous-activité</Label>
                <Select
                  value={section.filter || 'all'}
                  onValueChange={(value) => section.setFilter(value === 'all' ? '' : value)}
                >
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Toutes les sous-activités" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les sous-activités</SelectItem>
                    {section.subTags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        {tag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Ajouter les jeux intégrés en premier dans la section Jeux */}
                  {section.type === 'games' && getIntegratedGames(section.filter)}
                  
                  {filteredActivities.slice(0, section.type === 'games' ? 2 : 6).map((activity) => {
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
                        iframeCode={activity.iframe_code}
                        activity={activity}
                      />
                    );
                  })}
                </div>
              )}

              {!section.loading && filteredActivities.length === 0 && section.type !== 'games' && (
                <Card className={`p-8 text-center ${section.color}`}>
                  <Icon className={`w-16 h-16 ${section.iconColor} mx-auto mb-4`} />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {section.filter 
                      ? "Aucune activité trouvée pour cette sous-activité"
                      : `Aucune activité ${section.title.toLowerCase()}`
                    }
                  </h3>
                  <p className="text-gray-600">
                    {section.filter 
                      ? "Essayez de sélectionner une autre sous-activité ou 'Toutes les sous-activités'."
                      : "Aucune activité n'est disponible dans cette catégorie pour le moment."
                    }
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
