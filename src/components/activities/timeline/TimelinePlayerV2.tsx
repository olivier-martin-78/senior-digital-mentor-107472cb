import React, { useState, useEffect } from 'react';
import { TimelineData, TimelineEvent } from '@/types/timeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trophy, RotateCcw, AlertCircle, ArrowLeft, Shuffle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TimelinePlayerV2Props {
  timelineData: TimelineData;
  onExit: () => void;
}

interface EventWithOrder {
  event: TimelineEvent;
  userOrder: number | null;
  displayIndex: number; // Position d'affichage actuelle
}

const TimelinePlayerV2: React.FC<TimelinePlayerV2Props> = ({ timelineData, onExit }) => {
  const [eventsWithOrder, setEventsWithOrder] = useState<EventWithOrder[]>([]);
  const [gameComplete, setGameComplete] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🎮 Timeline Player V2 - Initializing with data:', timelineData);
    console.log('🔍 Timeline Player V2 - Date display settings:', {
      showYearOnCard: timelineData.showYearOnCard,
      showDateOnCard: timelineData.showDateOnCard,
      fullTimelineData: timelineData
    });
    initializeGame();
  }, [timelineData]);

  const validateTimelineData = (): boolean => {
    console.log('🔍 Validating timeline data...');
    
    if (!timelineData) {
      console.error('❌ No timeline data provided');
      setError('Aucune donnée de timeline fournie');
      return false;
    }

    if (!timelineData.events || !Array.isArray(timelineData.events)) {
      console.error('❌ Events is not an array:', timelineData.events);
      setError('Les événements ne sont pas correctement définis');
      return false;
    }

    if (timelineData.events.length < 2) {
      console.error('❌ Not enough events:', timelineData.events.length);
      setError('Il faut au moins 2 événements pour jouer à Timeline');
      return false;
    }

    const invalidEvents = timelineData.events.filter(event => 
      !event.name || !event.year || !event.description
    );
    
    if (invalidEvents.length > 0) {
      console.error('❌ Invalid events found:', invalidEvents);
      setError('Certains événements sont incomplets (nom, année ou description manquante)');
      return false;
    }

    const invalidYears = timelineData.events.filter(event => {
      const year = parseInt(event.year);
      return isNaN(year);
    });

    if (invalidYears.length > 0) {
      console.error('❌ Invalid years found:', invalidYears);
      setError('Certaines années ne sont pas valides');
      return false;
    }

    console.log('✅ Timeline data validation successful');
    return true;
  };

  const initializeGame = () => {
    try {
      console.log('🚀 Initializing Timeline V2 game...');
      setError(null);
      setGameComplete(false);
      setScore(null);
      setShowResults(false);

      if (!validateTimelineData()) {
        return;
      }

      const events = [...timelineData.events];
      console.log('📝 Events to shuffle:', events);
      
      const shuffled = events.sort(() => Math.random() - 0.5);
      console.log('🔀 Shuffled events:', shuffled);
      
      const eventsWithOrderData: EventWithOrder[] = shuffled.map((event, index) => ({
        event,
        userOrder: null,
        displayIndex: index
      }));

      setEventsWithOrder(eventsWithOrderData);
      console.log('✅ Game V2 initialized successfully');
      
    } catch (error) {
      console.error('💥 Error initializing game:', error);
      setError('Erreur lors de l\'initialisation du jeu');
    }
  };

  const handleOrderChange = (eventId: string, order: string) => {
    const orderNumber = order === '' ? null : parseInt(order);
    
    setEventsWithOrder(prev => prev.map(item => 
      item.event.id === eventId 
        ? { ...item, userOrder: orderNumber }
        : item
    ));
  };

  const rearrangeCards = () => {
    console.log('🔄 Rearranging cards based on user order');
    
    // Vérifier que tous les ordres sont saisis et uniques
    const orders = eventsWithOrder
      .map(item => item.userOrder)
      .filter(order => order !== null) as number[];
    
    if (orders.length !== eventsWithOrder.length) {
      toast({
        title: 'Ordre incomplet',
        description: 'Veuillez saisir un numéro d\'ordre pour chaque événement',
        variant: 'destructive',
      });
      return;
    }

    const uniqueOrders = new Set(orders);
    if (uniqueOrders.size !== orders.length) {
      toast({
        title: 'Ordres en double',
        description: 'Chaque événement doit avoir un numéro d\'ordre unique',
        variant: 'destructive',
      });
      return;
    }

    // Vérifier que les ordres vont de 1 à N
    const sortedOrders = [...orders].sort((a, b) => a - b);
    const expectedOrders = Array.from({ length: eventsWithOrder.length }, (_, i) => i + 1);
    const isValidRange = sortedOrders.every((order, index) => order === expectedOrders[index]);

    if (!isValidRange) {
      toast({
        title: 'Ordres invalides',
        description: `Les numéros d'ordre doivent aller de 1 à ${eventsWithOrder.length}`,
        variant: 'destructive',
      });
      return;
    }

    // Réarranger les cartes selon l'ordre utilisateur
    const rearranged = [...eventsWithOrder].sort((a, b) => {
      const orderA = a.userOrder || 0;
      const orderB = b.userOrder || 0;
      return orderA - orderB;
    });

    // Mettre à jour les displayIndex
    const rearrangedWithNewIndex = rearranged.map((item, index) => ({
      ...item,
      displayIndex: index
    }));

    setEventsWithOrder(rearrangedWithNewIndex);
    
    toast({
      title: 'Cartes réarrangées',
      description: 'Les événements ont été classés selon votre ordre',
    });
  };

  const verifyOrder = () => {
    console.log('✅ Verifying chronological order');
    
    // Vérifier que tous les ordres sont saisis
    const hasAllOrders = eventsWithOrder.every(item => item.userOrder !== null);
    if (!hasAllOrders) {
      toast({
        title: 'Ordre incomplet',
        description: 'Veuillez saisir un numéro d\'ordre pour chaque événement',
        variant: 'destructive',
      });
      return;
    }

    // Obtenir l'ordre chronologique correct
    const correctOrder = [...timelineData.events].sort((a, b) => {
      const yearA = parseInt(a.year);
      const yearB = parseInt(b.year);
      return yearA - yearB;
    });

    // Obtenir l'ordre actuel des cartes (basé sur displayIndex)
    const currentOrder = [...eventsWithOrder]
      .sort((a, b) => a.displayIndex - b.displayIndex)
      .map(item => item.event);

    // Calculer le score
    let correctPlacements = 0;
    for (let i = 0; i < currentOrder.length; i++) {
      if (currentOrder[i].id === correctOrder[i].id) {
        correctPlacements++;
      }
    }

    setScore(correctPlacements);
    setGameComplete(true);
    setShowResults(true);

    console.log('📊 Score calculated:', {
      correctPlacements,
      total: currentOrder.length,
      percentage: (correctPlacements / currentOrder.length) * 100
    });
  };

  const shouldShowYear = () => {
    const result = timelineData.showDateOnCard === true;
    console.log('📅 shouldShowYear V2 - Checking date display:', {
      showDateOnCard: timelineData.showDateOnCard,
      showYearOnCard: timelineData.showYearOnCard,
      result: result,
      typeOfShowDateOnCard: typeof timelineData.showDateOnCard,
      typeOfShowYearOnCard: typeof timelineData.showYearOnCard
    });
    return result;
  };

  const restartGame = () => {
    console.log('🔄 Restarting game V2');
    initializeGame();
  };

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-background text-foreground">
        <div className="flex justify-between items-center mb-6 p-4 bg-card text-card-foreground rounded-lg border">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{timelineData?.timelineName || 'Timeline'}</h1>
            <p className="text-muted-foreground">par {timelineData?.creatorName || 'Inconnu'}</p>
          </div>
        </div>
        
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-bold text-destructive mb-2">Erreur de chargement</h2>
          <p className="text-foreground mb-4">{error}</p>
          <div className="flex justify-center gap-4">
            <Button onClick={restartGame}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-background text-foreground">

      {/* Header */}
      <div className="flex justify-between items-center mb-6 p-4 bg-card text-card-foreground rounded-lg border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{timelineData.timelineName}</h1>
          <p className="text-muted-foreground">par {timelineData.creatorName}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Nouveau gameplay : Numérotez les événements dans l'ordre chronologique
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Événements</p>
          <p className="text-3xl font-bold text-primary">{eventsWithOrder.length}</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Instructions :</h3>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Assignez un numéro d'ordre à chaque événement (1 = le plus ancien, {eventsWithOrder.length} = le plus récent)</li>
          <li>2. Cliquez sur "Reclasser" pour voir les cartes dans l'ordre que vous avez choisi</li>
          <li>3. Cliquez sur "Vérifier" pour calculer votre score</li>
        </ol>
      </div>

      {/* Interface en 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
        
        {/* Colonne 1: Événements */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Événements</h2>
          <div className="space-y-4">
            {eventsWithOrder
              .sort((a, b) => a.displayIndex - b.displayIndex)
              .map((item, index) => {
                const showYear = shouldShowYear();
                console.log('🃏 EventCard V2 - Rendering with:', {
                  eventName: item.event.name,
                  eventYear: item.event.year,
                  showYear: showYear,
                  shouldRenderYear: showYear
                });
                
                return (
                  <Card key={item.event.id} className="p-4">
                    <CardContent className="p-0">
                      <div className="flex gap-4">
                        {item.event.imageUrl && (
                          <img 
                            src={item.event.imageUrl} 
                            alt={item.event.name}
                            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 space-y-2">
                          <h3 className="font-bold text-lg text-foreground">{item.event.name}</h3>
                          {showYear && (
                            <p className="text-lg font-semibold text-primary">{item.event.year}</p>
                          )}
                          <p className="text-sm text-muted-foreground">{item.event.description}</p>
                          {item.event.category && (
                            <span className="inline-block px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs">
                              {item.event.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>

        {/* Colonne 2: Ordre chronologique */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Ordre chronologique</h2>
          <div className="space-y-4">
            {eventsWithOrder
              .sort((a, b) => a.displayIndex - b.displayIndex)
              .map((item, index) => (
              <div key={item.event.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Input
                  type="number"
                  min="1"
                  max={eventsWithOrder.length}
                  value={item.userOrder || ''}
                  onChange={(e) => handleOrderChange(item.event.id, e.target.value)}
                  placeholder="N°"
                  className="w-16 text-center"
                />
                <span className="text-sm text-muted-foreground flex-1 truncate">
                  {item.event.name}
                </span>
              </div>
            ))}
          </div>

          {/* Boutons d'action */}
          <div className="space-y-3 mt-6">
            <Button 
              onClick={rearrangeCards} 
              className="w-full"
              variant="outline"
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Reclasser
            </Button>
            
            <Button 
              onClick={verifyOrder} 
              className="w-full"
              disabled={eventsWithOrder.some(item => item.userOrder === null)}
            >
              ✅ Vérifier
            </Button>
            
            <Button 
              variant="outline" 
              onClick={restartGame}
              className="w-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Recommencer
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog de résultats */}
      <Dialog open={showResults} onOpenChange={(open) => !open && setShowResults(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl text-foreground">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              Résultats !
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <p className="text-lg text-foreground">
              Score : <span className="font-bold text-primary text-2xl">{score}</span> / {eventsWithOrder.length}
            </p>
            <p className="text-muted-foreground">
              {score === eventsWithOrder.length 
                ? "Parfait ! Vous maîtrisez la chronologie !" 
                : `${score} événement${score > 1 ? 's' : ''} correctement placé${score > 1 ? 's' : ''}`}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={restartGame}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Rejouer
              </Button>
              <Button onClick={onExit}>
                Quitter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimelinePlayerV2;
