
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Brain, Gamepad2, Dumbbell, Languages, Plus } from 'lucide-react';
import { useActivities } from '@/hooks/useActivities';
import { useActivitySubTags } from '@/hooks/useActivitySubTags';
import { useAuth } from '@/contexts/AuthContext';
import ActivityCard from '@/components/activities/ActivityCard';

const ActivityPage = () => {
  const { type } = useParams<{ type: string }>();
  const [subTagFilter, setSubTagFilter] = useState<string>('');
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  
  const { activities, loading, canEditActivity } = useActivities(type || '');
  const { subTags } = useActivitySubTags(type || '');

  // Vérifier si l'utilisateur peut ajouter des activités
  const canAddActivity = user && (hasRole('admin') || hasRole('editor'));

  const getPageTitle = () => {
    switch (type) {
      case 'meditation': return 'Relaxation';
      case 'games': return 'Jeux';
      case 'exercises': return 'Gym douce';
      default: return 'Activités';
    }
  };

  const getPageIcon = () => {
    switch (type) {
      case 'meditation': return Brain;
      case 'games': return Gamepad2;
      case 'exercises': return Dumbbell;
      default: return Brain;
    }
  };

  const getPageDescription = () => {
    switch (type) {
      case 'meditation': return 'Activités de méditation, de yoga et de relaxation pour apaiser l\'esprit';
      case 'games': return 'Jeux ludiques et divertissants pour stimuler l\'esprit';
      case 'exercises': return 'Exercices doux pour maintenir la forme et la mobilité';
      default: return '';
    }
  };

  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const filterActivitiesBySubTag = (activities: any[], filter: string) => {
    if (!filter) return activities;
    return activities.filter(activity => activity.sub_activity_tag_id === filter);
  };

  const handleEditActivity = (activityId: string) => {
    navigate(`/admin/activities/${type}?edit=${activityId}`);
  };

  const filteredActivities = filterActivitiesBySubTag(activities, subTagFilter);

  // Jeux intégrés pour la section jeux
  const getIntegratedGames = () => {
    if (type !== 'games') return [];
    
    return [
      <Card key="opposites" className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
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
      </Card>,
      
      <Card key="sudoku" className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
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
      </Card>,
      
      <Card key="crossword" className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
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
      </Card>,
      
      <Card key="translation" className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
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
    ];
  };

  const PageIcon = getPageIcon();

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link to="/activities/activities" className="flex items-center gap-2 text-tranches-dustyblue hover:text-tranches-dustyblue/80 mr-4">
              <ArrowLeft className="w-5 h-5" />
              <span>Retour</span>
            </Link>
            <div className="flex items-center">
              <PageIcon className="w-8 h-8 text-tranches-dustyblue mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1>
                <p className="text-gray-600">{getPageDescription()}</p>
              </div>
            </div>
          </div>
          
          {canAddActivity && (
            <Link to={`/admin/activities/${type}`}>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Ajouter une activité
              </Button>
            </Link>
          )}
        </div>

        {/* Filtre par sous-activité */}
        <div className="mb-6">
          <Label htmlFor="sub-tag-filter">Filtrer par sous-activité</Label>
          <Select
            value={subTagFilter || 'all'}
            onValueChange={(value) => setSubTagFilter(value === 'all' ? '' : value)}
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Ajouter les jeux intégrés en premier dans la section Jeux */}
            {getIntegratedGames()}
            
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
                  iframeCode={activity.iframe_code}
                  activityId={activity.id}
                  canEdit={canEditActivity(activity)}
                  onEdit={() => handleEditActivity(activity.id)}
                />
              );
            })}
          </div>
        )}

        {!loading && filteredActivities.length === 0 && type !== 'games' && (
          <Card className="p-8 text-center bg-gray-50">
            <PageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {subTagFilter 
                ? "Aucune activité trouvée pour cette sous-activité"
                : `Aucune activité ${getPageTitle().toLowerCase()}`
              }
            </h3>
            <p className="text-gray-600">
              {subTagFilter 
                ? "Essayez de sélectionner une autre sous-activité ou 'Toutes les sous-activités'."
                : "Aucune activité n'est disponible dans cette catégorie pour le moment."
              }
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ActivityPage;
