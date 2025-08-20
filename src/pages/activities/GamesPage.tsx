import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Filter, Play, Calendar, Clock, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useActivities } from '@/hooks/useActivities';

export default function GamesPage() {
  const navigate = useNavigate();
  const { activities, loading } = useActivities('games');
  const [selectedSubTag, setSelectedSubTag] = useState<string>('all');

  // Jeux intégrés
  const integratedGames = [
    {
      title: 'Jeu des Contraires',
      description: 'Associez les mots contraires entre eux. Plusieurs niveaux de difficulté disponibles.',
      subTag: 'Jeu des Contraires',
      path: '/activities/games/opposites'
    },
    {
      title: 'Sudoku',
      description: 'Jeu de logique classique avec 5 niveaux de difficulté. Remplissez la grille 9x9 avec les chiffres de 1 à 9.',
      subTag: 'Sudoku',
      path: '/activities/games/sudoku'
    },
    {
      title: 'Mots Croisés Fléchés',
      description: 'Remplissez la grille en suivant les définitions et les flèches. 5 niveaux de difficulté disponibles.',
      subTag: 'Mots Croisés Fléchés',
      path: '/activities/games/crosswords'
    },
    {
      title: 'Jeu de Traduction',
      description: 'Traduisez 20 mots entre le français et l\'anglais. Deux modes disponibles avec historique des scores.',
      subTag: 'Jeu de Traduction',
      path: '/activities/games/translation'
    },
    {
      title: 'Mot à décoder',
      description: 'Retrouvez le mot grâce au pavé T9. Indice thématique et aide possible.',
      subTag: 'Mot à décoder',
      path: '/activities/games/decode'
    },
    {
      title: 'Quiz Années 70',
      description: 'Testez vos connaissances sur cette décennie fascinante ! 15 questions sur les événements marquants des années 70.',
      subTag: 'Quiz Années 70',
      path: '/activities/games/quiz-70s'
    },
    {
      title: 'L\'Illusionniste',
      description: 'Entraînez votre attention avec l\'effet Stroop ! Identifiez le mot, pas la couleur affichée.',
      subTag: 'L\'Illusionniste',
      path: '/activities/games/stroop'
    },
    {
      title: 'Combien de fois...',
      description: 'Mémorisez le nombre d\'occurrences de chaque image durant le défilement.',
      subTag: 'Combien de fois...',
      path: '/activities/games/counting'
    },
    {
      title: 'Activité spatio-temporelle',
      description: 'Développez vos capacités cognitives avec des scénarios immersifs. Gérez les imprévus et prenez des décisions adaptées.',
      subTag: 'Activité spatio-temporelle',
      path: '/activities/games/object-assembly'
    }
  ];

  // Obtenir toutes les sous-activités uniques
  const allSubTags = useMemo(() => {
    const integratedSubTags = integratedGames.map(game => game.subTag);
    const activitySubTags = activities
      .filter(activity => activity.activity_sub_tags?.name)
      .map(activity => activity.activity_sub_tags.name);
    
    return [...new Set([...integratedSubTags, ...activitySubTags])].sort();
  }, [activities]);

  // Filtrer les jeux
  const filteredIntegratedGames = selectedSubTag === 'all' 
    ? integratedGames 
    : integratedGames.filter(game => game.subTag === selectedSubTag);

  const filteredActivities = selectedSubTag === 'all' 
    ? activities 
    : activities.filter(activity => activity.activity_sub_tags?.name === selectedSubTag);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/activities')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux activités
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span className="font-semibold">Jeux Cognitifs</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-primary">
              Jeux Cognitifs
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Jeux ludiques et divertissants pour stimuler l'esprit
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <Button onClick={() => navigate('/activities/create')} className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter une activité
            </Button>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedSubTag} onValueChange={setSelectedSubTag}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrer par sous-activité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les sous-activités</SelectItem>
                  {allSubTags.map((subTag) => (
                    <SelectItem key={subTag} value={subTag}>
                      {subTag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Games Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Jeux intégrés */}
            {filteredIntegratedGames.map((game, index) => (
              <Card key={`integrated-${index}`} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(game.path)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{game.title}</CardTitle>
                      <CardDescription>{game.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{game.subTag}</Badge>
                    <Button size="sm" className="gap-2">
                      <Play className="h-4 w-4" />
                      Jouer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Activités de la base de données */}
            {filteredActivities.map((activity) => (
              <Card key={activity.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.open(activity.link, '_blank')}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{activity.title}</CardTitle>
                      {activity.activity_date && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(activity.activity_date)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {activity.activity_sub_tags?.name || 'Non catégorisé'}
                    </Badge>
                    <Button size="sm" className="gap-2">
                      <Play className="h-4 w-4" />
                      Jouer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {loading && (
            <div className="text-center text-muted-foreground">
              Chargement des activités...
            </div>
          )}

          {!loading && filteredIntegratedGames.length === 0 && filteredActivities.length === 0 && (
            <div className="text-center text-muted-foreground">
              Aucun jeu trouvé pour cette catégorie.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

