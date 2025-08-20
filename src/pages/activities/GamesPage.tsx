import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Brain, Clock, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GamesPage() {
  const navigate = useNavigate();

  const games = [
    {
      id: 'object-assembly',
      title: 'Assemblage d\'Objets dans l\'Espace et le Temps',
      description: 'Stimulez votre mémoire spatiale et temporelle en organisant des objets familiers dans votre maison selon les bonnes séquences.',
      icon: '🏠🧩',
      difficulty: 'Adaptatif',
      duration: '10-30 min',
      benefits: ['Mémoire spatiale', 'Séquençage temporel', 'Orientation'],
      scenarios: 5,
      levels: 15,
      path: '/activities/games/object-assembly',
      featured: true
    },
    {
      id: 'coming-soon-1',
      title: 'Mémoire des Visages',
      description: 'Entraînez votre reconnaissance faciale et votre mémoire des personnes.',
      icon: '👥💭',
      difficulty: 'Facile',
      duration: '5-15 min',
      benefits: ['Reconnaissance faciale', 'Mémoire des noms'],
      scenarios: 3,
      levels: 9,
      path: '',
      featured: false,
      comingSoon: true
    },
    {
      id: 'coming-soon-2',
      title: 'Navigation Virtuelle',
      description: 'Parcourez des environnements virtuels pour renforcer votre orientation spatiale.',
      icon: '🗺️🧭',
      difficulty: 'Moyen',
      duration: '15-45 min',
      benefits: ['Orientation spatiale', 'Navigation', 'Repères visuels'],
      scenarios: 4,
      levels: 12,
      path: '',
      featured: false,
      comingSoon: true
    }
  ];

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
              Jeux Cognitifs Adaptatifs
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Des jeux conçus spécialement pour stimuler la mémoire, l'orientation et les fonctions cognitives. 
              Chaque jeu s'adapte automatiquement à vos performances pour maintenir un défi optimal.
            </p>
          </div>

          {/* Featured Game */}
          {games.filter(game => game.featured).map((game) => (
            <Card key={game.id} className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{game.icon}</span>
                      <Badge className="bg-primary text-primary-foreground">
                        Recommandé
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl">{game.title}</CardTitle>
                    <CardDescription className="text-lg">
                      {game.description}
                    </CardDescription>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => navigate(game.path)}
                    className="gap-2"
                  >
                    <Play className="h-5 w-5" />
                    Jouer maintenant
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>{game.scenarios}</strong> scénarios
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>{game.levels}</strong> niveaux
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{game.duration}</span>
                  </div>
                  <div className="text-sm">
                    <Badge variant="outline">{game.difficulty}</Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Bénéfices cognitifs :
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {game.benefits.map((benefit) => (
                      <Badge key={benefit} variant="secondary" className="text-xs">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Other Games */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Autres jeux disponibles</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {games.filter(game => !game.featured).map((game) => (
                <Card key={game.id} className={game.comingSoon ? "opacity-60" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{game.icon}</span>
                          {game.comingSoon && (
                            <Badge variant="outline">Bientôt disponible</Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl">{game.title}</CardTitle>
                        <CardDescription>{game.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <strong>{game.scenarios}</strong> scénarios
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <strong>{game.levels}</strong> niveaux
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{game.duration}</span>
                      </div>
                      <div className="text-sm">
                        <Badge variant="outline">{game.difficulty}</Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Bénéfices cognitifs :
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {game.benefits.map((benefit) => (
                            <Badge key={benefit} variant="secondary" className="text-xs">
                              {benefit}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <Button
                        className="w-full"
                        disabled={game.comingSoon}
                        onClick={() => !game.comingSoon && navigate(game.path)}
                      >
                        {game.comingSoon ? 'Bientôt disponible' : 'Jouer'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Info Section */}
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">Pourquoi ces jeux ?</h3>
                <div className="grid md:grid-cols-3 gap-6 text-sm">
                  <div className="space-y-2">
                    <div className="text-2xl">🧠</div>
                    <h4 className="font-medium">Scientifiquement validés</h4>
                    <p className="text-muted-foreground">
                      Basés sur des recherches en neuropsychologie et adaptés aux besoins spécifiques.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl">⚡</div>
                    <h4 className="font-medium">Adaptation en temps réel</h4>
                    <p className="text-muted-foreground">
                      La difficulté s'ajuste automatiquement pour maintenir un défi optimal.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl">♿</div>
                    <h4 className="font-medium">Accessibilité maximale</h4>
                    <p className="text-muted-foreground">
                      Modes spéciaux pour malvoyants, grandes zones tactiles, guidance vocale.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
