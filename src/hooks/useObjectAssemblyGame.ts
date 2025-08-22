import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GameScenario {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  levels: GameLevel[];
}

export interface GameLevel {
  id: string;
  level_number: number;
  name: string;
  description: string;
  enable_timeline: boolean;
  spatial_required: number;
  temporal_required: number;
  spatial_title: string;
  temporal_title: string;
  spatial_icon: string;
  temporal_icon: string;
  activities: ActivityItem[];
  spatialSlots: SpatialSlot[];
  timeSlots: TimeSlot[];
}

export interface ActivityItem {
  id: string;
  name: string;
  icon: string;
  category: string;
}

export interface SpatialSlot {
  id: string;
  label: string;
  icon: string;
  x_position: number;
  y_position: number;
}

export interface TimeSlot {
  id: string;
  label: string;
  icon: string;
  period: string;
}

export interface PlacedItem {
  activityId: string;
  spatialSlotId?: string;
  timeSlotId?: string;
}

export interface GameState {
  currentScenario: string | null;
  currentLevel: number;
  placedItems: PlacedItem[];
  score: number;
  currentErrors: number;
  hintsUsed: number;
  gamePhase: 'menu' | 'playing' | 'success';
  accessibilityMode: boolean;
  voiceEnabled: boolean;
  adaptationLevel: number;
  sessionId: string | null;
}

const STORAGE_KEY = 'object-assembly-game-progress';

const initialState: GameState = {
  currentScenario: null,
  currentLevel: 1,
  placedItems: [],
  score: 0,
  currentErrors: 0,
  hintsUsed: 0,
  gamePhase: 'menu',
  accessibilityMode: false,
  voiceEnabled: true,
  adaptationLevel: 0,
  sessionId: null,
};

export const useObjectAssemblyGame = () => {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<GameScenario[]>([]);
  const [loading, setLoading] = useState(true);

  // Load scenarios and game data
  const loadScenarios = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch scenarios for object assembly game
      const { data: scenariosData, error: scenariosError } = await supabase
        .from('cognitive_puzzle_scenarios')
        .select('*')
        .eq('game_type', 'object-assembly')
        .order('created_at');

      if (scenariosError) throw scenariosError;

      // Fetch levels for each scenario
      const scenariosWithLevels = await Promise.all(
        scenariosData.map(async (scenario) => {
          const { data: levelsData, error: levelsError } = await supabase
            .from('cognitive_puzzle_levels')
            .select('*')
            .eq('scenario_id', scenario.id)
            .order('level_number');

          if (levelsError) throw levelsError;

          // Fetch activities, spatial slots, and time slots for each level
          const levelsWithData = await Promise.all(
            levelsData.map(async (level) => {
              const [activitiesResult, spatialSlotsResult, timeSlotsResult] = await Promise.all([
                supabase
                  .from('cognitive_puzzle_activities')
                  .select('*')
                  .eq('level_id', level.id),
                supabase
                  .from('cognitive_puzzle_spatial_slots')
                  .select('*')
                  .eq('level_id', level.id),
                supabase
                  .from('cognitive_puzzle_time_slots')
                  .select('*')
                  .eq('level_id', level.id)
              ]);

              return {
                ...level,
                activities: (activitiesResult.data || []).map(activity => ({
                  id: activity.id,
                  name: activity.name,
                  icon: activity.icon,
                  category: activity.category
                })),
                spatialSlots: (spatialSlotsResult.data || []).map(slot => ({
                  id: slot.id,
                  label: slot.label,
                  icon: slot.icon,
                  x_position: slot.x_position,
                  y_position: slot.y_position
                })),
                timeSlots: (timeSlotsResult.data || []).map(slot => ({
                  id: slot.id,
                  label: slot.label,
                  icon: slot.icon,
                  period: slot.period
                })),
              };
            })
          );

          return {
            ...scenario,
            levels: levelsWithData,
          };
        })
      );

      setScenarios(scenariosWithLevels);
    } catch (error) {
      console.error('Error loading scenarios:', error);
      toast.error('Erreur lors du chargement des scénarios');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load saved game progress
  useEffect(() => {
    const savedProgress = localStorage.getItem(STORAGE_KEY);
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setGameState(prev => ({ ...prev, ...progress }));
      } catch (error) {
        console.error('Error loading saved progress:', error);
      }
    }
  }, []);

  // Save game progress
  const saveProgress = useCallback((state: GameState) => {
    const progressToSave = {
      currentScenario: state.currentScenario,
      currentLevel: state.currentLevel,
      score: state.score,
      accessibilityMode: state.accessibilityMode,
      voiceEnabled: state.voiceEnabled,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progressToSave));
  }, []);

  // Speech synthesis
  const speak = useCallback((text: string) => {
    if (!gameState.voiceEnabled || !('speechSynthesis' in window)) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  }, [gameState.voiceEnabled]);

  // Game actions
  const selectScenario = useCallback((scenarioId: string) => {
    setGameState(prev => {
      const newState = {
        ...prev,
        currentScenario: scenarioId,
        currentLevel: 1,
        placedItems: [],
        score: 0,
        currentErrors: 0,
        hintsUsed: 0,
        gamePhase: 'playing' as const,
        adaptationLevel: 0,
      };
      saveProgress(newState);
      return newState;
    });

    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      speak(`Début du scénario ${scenario.name}. ${scenario.description}`);
    }
  }, [scenarios, speak, saveProgress]);

  const startLevel = useCallback(async () => {
    const scenario = scenarios.find(s => s.id === gameState.currentScenario);
    if (!scenario) return;

    const nextLevel = gameState.currentLevel + 1;
    const levelExists = scenario.levels.some(l => l.level_number === nextLevel);

    if (levelExists) {
      setGameState(prev => {
        const newState = {
          ...prev,
          currentLevel: nextLevel,
          placedItems: [],
          currentErrors: 0,
          hintsUsed: 0,
          gamePhase: 'playing' as const,
          adaptationLevel: Math.max(0, prev.adaptationLevel - 1), // Reduce adaptation on success
        };
        saveProgress(newState);
        return newState;
      });

      speak(`Niveau ${nextLevel} commencé.`);
    } else {
      // Scenario completed
      speak('Félicitations ! Vous avez terminé ce scénario.');
      resetGame();
    }
  }, [scenarios, gameState, speak, saveProgress]);

  const resetGame = useCallback(() => {
    setGameState(prev => {
      const newState = {
        ...initialState,
        accessibilityMode: prev.accessibilityMode,
        voiceEnabled: prev.voiceEnabled,
      };
      saveProgress(newState);
      return newState;
    });
    speak('Retour au menu principal.');
  }, [speak, saveProgress]);

  const toggleAccessibility = useCallback(() => {
    setGameState(prev => {
      const newState = { ...prev, accessibilityMode: !prev.accessibilityMode };
      saveProgress(newState);
      return newState;
    });
  }, [saveProgress]);

  const toggleVoice = useCallback(() => {
    // Arrêter toute synthèse vocale en cours
    if ('speechSynthesis' in window && speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    
    setGameState(prev => {
      const newState = { ...prev, voiceEnabled: !prev.voiceEnabled };
      saveProgress(newState);
      return newState;
    });
  }, [saveProgress]);

  const placeItem = useCallback(async (activityId: string, spatialSlotId?: string, timeSlotId?: string) => {
    // Validate placement logic here
    const isCorrectPlacement = true; // TODO: Implement validation logic

    if (isCorrectPlacement) {
      setGameState(prev => {
        const newPlacedItems = prev.placedItems.filter(item => item.activityId !== activityId);
        newPlacedItems.push({ activityId, spatialSlotId, timeSlotId });
        
        const newState = {
          ...prev,
          placedItems: newPlacedItems,
          score: prev.score + 10,
        };
        saveProgress(newState);
        return newState;
      });

      speak('Bonne réponse !');
      toast.success('Excellent !');
    } else {
      setGameState(prev => {
        const newErrors = prev.currentErrors + 1;
        const newState = {
          ...prev,
          currentErrors: newErrors,
          adaptationLevel: newErrors > 3 ? prev.adaptationLevel + 1 : prev.adaptationLevel,
        };
        saveProgress(newState);
        return newState;
      });

      speak('Essayez encore, vous y êtes presque !');
      toast.error('Pas tout à fait, réessayez !');
    }
  }, [speak, saveProgress]);

  const checkLevelCompletion = useCallback(() => {
    const scenario = scenarios.find(s => s.id === gameState.currentScenario);
    if (!scenario) return false;

    const currentLevel = scenario.levels.find(l => l.level_number === gameState.currentLevel);
    if (!currentLevel) return false;

    const spatialPlacements = gameState.placedItems.filter(item => item.spatialSlotId).length;
    const temporalPlacements = gameState.placedItems.filter(item => item.timeSlotId).length;

    const spatialComplete = spatialPlacements >= currentLevel.spatial_required;
    const temporalComplete = !currentLevel.enable_timeline || temporalPlacements >= currentLevel.temporal_required;

    if (spatialComplete && temporalComplete) {
      setGameState(prev => ({ ...prev, gamePhase: 'success' }));
      speak('Félicitations ! Niveau terminé avec succès.');
      return true;
    }

    return false;
  }, [scenarios, gameState, speak]);

  const selectActivity = useCallback((activityId: string | null) => {
    setSelectedActivity(activityId);
    if (activityId) {
      const scenario = scenarios.find(s => s.id === gameState.currentScenario);
      const currentLevel = scenario?.levels.find(l => l.level_number === gameState.currentLevel);
      const activity = currentLevel?.activities.find(a => a.id === activityId);
      if (activity) {
        speak(`${activity.name} sélectionné. Cliquez sur une zone pour le placer.`);
      }
    } else {
      speak('Sélection annulée.');
    }
  }, [scenarios, gameState.currentScenario, gameState.currentLevel, speak]);

  const placeSelectedActivity = useCallback((spatialSlotId?: string, timeSlotId?: string) => {
    if (!selectedActivity) return;
    
    placeItem(selectedActivity, spatialSlotId, timeSlotId);
    setSelectedActivity(null); // Clear selection after placement
  }, [selectedActivity, placeItem]);

  // Initialize
  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  // Check for level completion
  useEffect(() => {
    if (gameState.gamePhase === 'playing') {
      checkLevelCompletion();
    }
  }, [gameState.placedItems, checkLevelCompletion, gameState.gamePhase]);

  const completeLevel = useCallback(() => {
    const scenario = scenarios.find(s => s.id === gameState.currentScenario);
    if (!scenario) return false;

    const currentLevel = scenario.levels.find(l => l.level_number === gameState.currentLevel);
    if (!currentLevel) return false;

    const spatialPlacements = gameState.placedItems.filter(item => item.spatialSlotId).length;
    const temporalPlacements = gameState.placedItems.filter(item => item.timeSlotId).length;

    const spatialComplete = spatialPlacements >= currentLevel.spatial_required;
    const temporalComplete = !currentLevel.enable_timeline || temporalPlacements >= currentLevel.temporal_required;

    if (spatialComplete && temporalComplete) {
      speak('Félicitations ! Niveau terminé avec succès.');
      
      // Check if there's a next level
      const nextLevel = gameState.currentLevel + 1;
      const hasNextLevel = scenario.levels.some(l => l.level_number === nextLevel);
      
      if (hasNextLevel) {
        // Progress to next level after a short delay
        setTimeout(() => {
          startLevel();
        }, 1500);
      } else {
        // Show success screen for scenario completion
        setTimeout(() => {
          setGameState(prev => ({ ...prev, gamePhase: 'success' }));
        }, 1500);
      }
      
      return true;
    } else {
      const missing = [];
      if (!spatialComplete) missing.push('placement spatial');
      if (!temporalComplete) missing.push('étapes temporelles');
      speak(`Il manque encore : ${missing.join(' et ')}`);
      return false;
    }
  }, [scenarios, gameState, speak, startLevel]);

  return {
    gameState,
    selectedActivity,
    scenarios,
    loading,
    selectScenario,
    startLevel,
    resetGame,
    toggleAccessibility,
    toggleVoice,
    speak,
    placeItem,
    selectActivity,
    placeSelectedActivity,
    completeLevel,
  };
};