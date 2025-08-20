import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Gamepad2, Plus, Brain, Languages, KeySquare, Eye, Edit, Trash2 } from 'lucide-react';
import { useActivities } from '@/hooks/useActivities';
import { useActivitySubTags } from '@/hooks/useActivitySubTags';
import { useAuth } from '@/contexts/AuthContext';
import ActivityCard from '@/components/activities/ActivityCard';
import { UserActionsService } from '@/services/UserActionsService';

export default function GamesPage() {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { activities, loading, canEditActivity } = useActivities('games');
  const { subTags } = useActivitySubTags('games');
  const [subTagFilter, setSubTagFilter] = useState<string>('');

  // Vérifier si l'utilisateur peut ajouter des activités
  const canAddActivity = user && (hasRole('admin') || hasRole('editor') || hasRole('createur_activite'));

  const handleEditActivity = (activityId: string) => {
    navigate(`/create-activities/games?edit=${activityId}`);
  };

  const handleEditIntegratedGame = (gameType: string) => {
    if (gameType === 'cognitive-puzzle') {
      navigate('/admin/cognitive-puzzle');
    } else if (gameType === 'object-assembly') {
      navigate('/admin/object-assembly');
    }
  };

  const handleDeleteIntegratedGame = (gameName: string) => {
    // Pour le moment, juste afficher une confirmation
    console.log(`Demande de suppression du jeu: ${gameName}`);
  };

  // Jeux intégrés avec les beaux dégradés
  const getIntegratedGames = () => {
    const remueMeningesSubTag = subTags.find(tag => tag.name === 'Remue-méninges');
    const remueMeningesId = remueMeningesSubTag?.id;
    
    const games = [
      {
        key: "opposites",
        subTagId: remueMeningesId || null,
        card: <Card key="opposites" className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
          <Link 
            to="/activities/opposites" 
            className="block"
            onClick={() => UserActionsService.trackView('activity', 'opposites', 'Jeu des Contraires')}
          >
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
        subTagId: remueMeningesId || null,
        card: <Card key="sudoku" className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
          <Link 
            to="/activities/sudoku" 
            className="block"
            onClick={() => UserActionsService.trackView('activity', 'sudoku', 'Sudoku')}
          >
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
        subTagId: remueMeningesId || null,
        card: <Card key="crossword" className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
          <Link 
            to="/activities/crossword" 
            className="block"
            onClick={() => UserActionsService.trackView('activity', 'crossword', 'Mots Croisés Fléchés')}
          >
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
        subTagId: remueMeningesId || null,
        card: <Card key="translation" className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
          <Link 
            to="/activities/translation" 
            className="block"
            onClick={() => UserActionsService.trackView('activity', 'translation', 'Jeu de Traduction')}
          >
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
        key: "decoder",
        subTagId: remueMeningesId || null,
        card: <Card key="decoder" className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
          <Link 
            to="/activities/decoder" 
            className="block"
            onClick={() => UserActionsService.trackView('activity', 'decoder', 'Mot à décoder')}
          >
            <div className="h-48 bg-gradient-to-br from-lime-400 to-cyan-500 flex items-center justify-center">
              <div className="text-center text-white">
                <KeySquare className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-bold">Mot à décoder</h3>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-lg">Mot à décoder</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Retrouvez le mot grâce au pavé T9. Indice thématique et aide possible.
              </p>
            </CardContent>
          </Link>
        </Card>
      },
      {
        key: "quiz70s",
        subTagId: remueMeningesId || null,
        card: <Card key="quiz70s" className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
          <Link 
            to="/activities/quiz70s" 
            className="block"
            onClick={() => UserActionsService.trackView('activity', 'quiz70s', 'Quiz Années 70')}
          >
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
      },
      {
        key: "illusionist",
        subTagId: remueMeningesId || null,
        card: <Card key="illusionist" className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
          <Link 
            to="/activities/games/illusionist" 
            className="block"
            onClick={() => UserActionsService.trackView('activity', 'illusionist-game', 'L\'Illusionniste')}
          >
            <div className="h-48 bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
              <div className="text-center text-white">
                <Eye className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-bold">L'Illusionniste</h3>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-lg">L'Illusionniste</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Entraînez votre attention avec l'effet Stroop ! Identifiez le mot, pas la couleur affichée.
              </p>
            </CardContent>
          </Link>
        </Card>
      },
      {
        key: "memory-count",
        subTagId: remueMeningesId || null,
        card: <Card key="memory-count" className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
          <Link 
            to="/activities/games/memory-count" 
            className="block"
            onClick={() => UserActionsService.trackView('activity', 'memory-count-game', 'Combien de fois...')}
          >
            <div className="h-48 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
              <div className="text-center text-white">
                <Brain className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-bold">Combien de fois...</h3>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-lg">Combien de fois...</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Mémorisez le nombre d'occurrences de chaque image durant le défilement.
              </p>
            </CardContent>
          </Link>
        </Card>
      },
      {
        key: "object-assembly",
        subTagId: remueMeningesId || null,
        card: <Card key="object-assembly" className="group cursor-pointer hover:shadow-lg transition-shadow duration-200 relative">
          <Link 
            to="/activities/games/object-assembly" 
            className="block"
            onClick={() => UserActionsService.trackView('activity', 'object-assembly-game', 'Activité spatio-temporelle')}
          >
            <div className="h-48 bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
              <div className="text-center text-white">
                <Brain className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-bold">Activité spatio-temporelle</h3>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-lg">Activité spatio-temporelle</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Développez vos capacités cognitives avec des scénarios immersifs. Gérez les imprévus et prenez des décisions adaptées.
              </p>
            </CardContent>
          </Link>
          {hasRole('admin') && (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleEditIntegratedGame('cognitive-puzzle');
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-12 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteIntegratedGame('Activité spatio-temporelle');
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </Card>
      },
      {
        key: "object-assembly-spatial",
        subTagId: remueMeningesId || null,
        card: <Card key="object-assembly-spatial" className="group cursor-pointer hover:shadow-lg transition-shadow duration-200 relative">
          <Link 
            to="/activities/games/object-assembly" 
            className="block"
            onClick={() => UserActionsService.trackView('activity', 'object-assembly-spatial-game', 'Assemblage d\'Objets dans l\'Espace et le Temps')}
          >
            <div className="h-48 bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-4xl mb-4">🏠🧩</div>
                <h3 className="text-xl font-bold">Assemblage d'Objets</h3>
                <p className="text-sm mt-2 opacity-90">Espace & Temps</p>
              </div>
            </div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Assemblage d'Objets dans l'Espace et le Temps</CardTitle>
                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">Nouveau</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                Stimulez votre mémoire spatiale et temporelle en organisant des objets familiers dans votre maison selon les bonnes séquences.
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full">Mémoire spatiale</span>
                <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full">Séquençage temporel</span>
                <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full">Adaptatif</span>
              </div>
            </CardContent>
          </Link>
          {hasRole('admin') && (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleEditIntegratedGame('object-assembly');
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-12 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteIntegratedGame('Assemblage d\'Objets dans l\'Espace et le Temps');
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </Card>
      }
    ];

    // Filtrer par sous-activité si un filtre est appliqué
    if (subTagFilter && subTagFilter !== '') {
      if (subTagFilter === 'null') {
        return games.filter(game => !game.subTagId).map(game => game.card);
      }
      return games.filter(game => game.subTagId === subTagFilter).map(game => game.card);
    }
    
    // Si aucun filtre n'est appliqué, montrer tous les jeux
    return games.map(game => game.card);
  };

  const filterActivitiesBySubTag = (activities: any[], filter: string) => {
    if (!filter) return activities;
    if (filter === 'null') {
      return activities.filter(activity => !activity.sub_activity_tag_id);
    }
    return activities.filter(activity => activity.sub_activity_tag_id === filter);
  };

  const filteredActivities = filterActivitiesBySubTag(activities, subTagFilter);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link to="/activities" className="flex items-center gap-2 text-tranches-dustyblue hover:text-tranches-dustyblue/80 mr-4">
              <ArrowLeft className="w-5 h-5" />
              <span>Retour</span>
            </Link>
            <div className="flex items-center">
              <Gamepad2 className="w-8 h-8 text-tranches-dustyblue mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Jeux cognitifs</h1>
                <p className="text-gray-600">Jeux ludiques et divertissants pour stimuler l'esprit</p>
              </div>
            </div>
          </div>
          
          {canAddActivity && (
            <Link 
              to="/create-activities/games"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-primary hover:scale-105"
            >
              <Plus className="h-5 w-5" />
              Ajouter une activité
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
            <SelectTrigger className="w-80">
              <SelectValue placeholder="Sélectionner une sous-activité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les sous-activités</SelectItem>
              <SelectItem value="null">Non catégorisées</SelectItem>
              {subTags.map((subTag) => (
                <SelectItem key={subTag.id} value={subTag.id}>
                  {subTag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Chargement des activités...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {/* Ajouter les jeux intégrés en premier */}
            {getIntegratedGames()}
            
            {filteredActivities.map((activity) => {
              const isYouTube = activity.link?.includes('youtube.com') || activity.link?.includes('youtu.be');
              return (
                <ActivityCard
                  key={activity.id}
                  title={activity.title}
                  link={activity.link}
                  thumbnailUrl={activity.thumbnail_url}
                  activity={activity}
                  onEdit={canEditActivity(activity) ? () => handleEditActivity(activity.id) : undefined}
                  activityDate={activity.activity_date}
                  isYouTube={isYouTube}
                />
              );
            })}
          </div>
        )}

        {!loading && filteredActivities.length === 0 && getIntegratedGames().length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">Aucun jeu trouvé pour cette catégorie.</p>
          </div>
        )}
      </div>
    </div>
  );
}