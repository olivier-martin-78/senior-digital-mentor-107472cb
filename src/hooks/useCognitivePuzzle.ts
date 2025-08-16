import { useState, useCallback, useEffect } from 'react';
import { GameState, GameScenario, PlacedItem, TwistEvent } from '@/types/cognitivePuzzle';
import { homeScenario, cityScenario } from '@/data/cognitivePuzzleData';

const STORAGE_KEY = 'cognitive-puzzle-progress';

const initialState: GameState = {
  currentScenario: null,
  currentLevel: 1,
  placedItems: [],
  score: 0,
  completedLevels: [],
  activeTwist: null,
  twistChoicePhase: false,
  gamePhase: 'menu',
  accessibilityMode: false,
  voiceEnabled: false,
};

export const useCognitivePuzzle = () => {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  
  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const savedState = JSON.parse(saved);
        setGameState(prev => ({ ...prev, ...savedState }));
      } catch (error) {
        console.warn('Failed to load saved progress:', error);
      }
    }
  }, []);

  // Save progress to localStorage
  const saveProgress = useCallback((state: GameState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        completedLevels: state.completedLevels,
        score: state.score,
        accessibilityMode: state.accessibilityMode,
        voiceEnabled: state.voiceEnabled,
      }));
    } catch (error) {
      console.warn('Failed to save progress:', error);
    }
  }, []);

  const selectScenario = useCallback((scenarioId: string) => {
    setGameState(prev => {
      const newState = {
        ...prev,
        currentScenario: scenarioId,
        currentLevel: 1,
        placedItems: [],
        gamePhase: 'instructions' as const,
        activeTwist: null,
      };
      return newState;
    });
  }, []);

  const startLevel = useCallback(() => {
    setGameState(prev => {
      const scenario = getScenario(prev.currentScenario);
      if (!scenario) return prev;

      // 20% chance of twist activation after first few moves
      const shouldHaveTwist = Math.random() < 0.2;
      const level = scenario.levels.find(l => l.id === prev.currentLevel);
      const twist = shouldHaveTwist && level?.twistEvents.length 
        ? level.twistEvents[Math.floor(Math.random() * level.twistEvents.length)]
        : null;

      const newState = {
        ...prev,
        gamePhase: 'playing' as const,
        placedItems: [],
        activeTwist: twist,
      };
      return newState;
    });
  }, []);

  const placeItem = useCallback((activityId: string, spatialSlotId?: string, timeSlotId?: string) => {
    setGameState(prev => {
      const existingIndex = prev.placedItems.findIndex(item => item.activityId === activityId);
      
      let newPlacement: PlacedItem;
      if (existingIndex >= 0) {
        // Merge with existing placement to preserve both spatial and temporal data
        const existing = prev.placedItems[existingIndex];
        newPlacement = {
          activityId,
          spatialSlotId: spatialSlotId ?? existing.spatialSlotId,
          timeSlotId: timeSlotId ?? existing.timeSlotId,
        };
      } else {
        newPlacement = { activityId, spatialSlotId, timeSlotId };
      }
      
      let newPlacedItems;
      if (existingIndex >= 0) {
        newPlacedItems = [...prev.placedItems];
        newPlacedItems[existingIndex] = newPlacement;
      } else {
        newPlacedItems = [...prev.placedItems, newPlacement];
      }

      return {
        ...prev,
        placedItems: newPlacedItems,
      };
    });
  }, []);

  const removeItem = useCallback((activityId: string) => {
    setGameState(prev => ({
      ...prev,
      placedItems: prev.placedItems.filter(item => item.activityId !== activityId),
    }));
  }, []);

  const checkLevelCompletion = useCallback(() => {
    const scenario = getScenario(gameState.currentScenario);
    if (!scenario) return false;

    const level = scenario.levels.find(l => l.id === gameState.currentLevel);
    if (!level) return false;

    const spatialPlacements = gameState.placedItems.filter(item => item.spatialSlotId).length;
    const temporalPlacements = gameState.placedItems.filter(item => item.timeSlotId).length;

    return spatialPlacements >= level.successCriteria.spatialRequired &&
           temporalPlacements >= level.successCriteria.temporalRequired;
  }, [gameState]);

  const completeLevel = useCallback(() => {
    setGameState(prev => {
      const levelKey = `${prev.currentScenario}-${prev.currentLevel}`;
      const newCompletedLevels = prev.completedLevels.includes(levelKey) 
        ? prev.completedLevels 
        : [...prev.completedLevels, levelKey];
      
      const newScore = prev.score + (prev.activeTwist ? 150 : 100); // Bonus for handling twists
      
      const newState = {
        ...prev,
        gamePhase: 'success' as const,
        completedLevels: newCompletedLevels,
        score: newScore,
      };
      
      saveProgress(newState);
      return newState;
    });
  }, [saveProgress]);

  const nextLevel = useCallback(() => {
    setGameState(prev => {
      const scenario = getScenario(prev.currentScenario);
      if (!scenario) return prev;

      const nextLevelNum = prev.currentLevel + 1;
      const hasNextLevel = scenario.levels.some(l => l.id === nextLevelNum);

      if (hasNextLevel) {
        return {
          ...prev,
          currentLevel: nextLevelNum,
          gamePhase: 'instructions',
          placedItems: [],
          activeTwist: null,
        };
      } else {
        // Scenario completed, return to menu
        return {
          ...prev,
          currentScenario: null,
          gamePhase: 'menu',
          placedItems: [],
          activeTwist: null,
        };
      }
    });
  }, []);

  const resetGame = useCallback(() => {
    setGameState(initialState);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const toggleAccessibility = useCallback(() => {
    setGameState(prev => {
      const newState = { ...prev, accessibilityMode: !prev.accessibilityMode };
      saveProgress(newState);
      return newState;
    });
  }, [saveProgress]);

  const toggleVoice = useCallback(() => {
    setGameState(prev => {
      const newState = { ...prev, voiceEnabled: !prev.voiceEnabled };
      saveProgress(newState);
      return newState;
    });
  }, [saveProgress]);

  const speak = useCallback((text: string, forceSpeak: boolean = false) => {
    if (!gameState.voiceEnabled && !forceSpeak) return;
    
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.warn('Speech synthesis not supported:', error);
    }
  }, [gameState.voiceEnabled]);

  const acceptTwist = useCallback(() => {
    setGameState(prev => {
      if (prev.activeTwist?.adaptationChoices) {
        return { ...prev, twistChoicePhase: true };
      } else {
        // For twists without choices, apply effect immediately and clear twist
        return { ...prev, activeTwist: null, twistChoicePhase: false };
      }
    });
    
    if (!gameState.activeTwist?.adaptationChoices) {
      speak('Défi accepté ! Continuez à jouer avec cette adaptation.');
    }
  }, [speak, gameState.activeTwist]);

  const makeAdaptationChoice = useCallback((choiceId: string) => {
    setGameState(prev => ({
      ...prev,
      activeTwist: null,
      twistChoicePhase: false,
    }));
    speak('Choix d\'adaptation confirmé ! Continuez à jouer.');
  }, [speak]);

  const rejectTwist = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      activeTwist: null,
      twistChoicePhase: false,
    }));
    speak('Défi refusé. Vous continuez le niveau normalement.');
  }, [speak]);

  const selectActivity = useCallback((activityId: string) => {
    setSelectedActivity(prev => prev === activityId ? null : activityId);
    const scenario = getScenario(gameState.currentScenario);
    const level = scenario?.levels.find(l => l.id === gameState.currentLevel);
    const activity = level?.activities.find(a => a.id === activityId);
    
    if (activity) {
      if (selectedActivity === activityId) {
        speak(`${activity.name} désélectionné`);
      } else {
        speak(`${activity.name} sélectionné. Cliquez maintenant sur un lieu ou un moment pour le placer.`);
      }
    }
  }, [gameState.currentScenario, gameState.currentLevel, selectedActivity, speak]);

  const placeSelectedActivity = useCallback((spatialSlotId?: string, timeSlotId?: string) => {
    if (!selectedActivity) return;
    
    placeItem(selectedActivity, spatialSlotId, timeSlotId);
    setSelectedActivity(null);
    
    const scenario = getScenario(gameState.currentScenario);
    const level = scenario?.levels.find(l => l.id === gameState.currentLevel);
    const activity = level?.activities.find(a => a.id === selectedActivity);
    const spatialSlot = level?.spatialSlots.find(s => s.id === spatialSlotId);
    const timeSlot = level?.timeSlots.find(t => t.id === timeSlotId);
    
    if (activity) {
      let message = `${activity.name} placé`;
      if (spatialSlot) message += ` dans ${spatialSlot.label}`;
      if (timeSlot) message += ` au ${timeSlot.label}`;
      speak(message);
    }
  }, [selectedActivity, placeItem, gameState.currentScenario, gameState.currentLevel, speak]);

  return {
    gameState,
    selectedActivity,
    selectScenario,
    startLevel,
    placeItem,
    removeItem,
    checkLevelCompletion,
    completeLevel,
    nextLevel,
    resetGame,
    toggleAccessibility,
    toggleVoice,
    speak,
    acceptTwist,
    rejectTwist,
    makeAdaptationChoice,
    selectActivity,
    placeSelectedActivity,
  };
};

const getScenario = (scenarioId: string | null): GameScenario | null => {
  switch (scenarioId) {
    case 'home':
      return homeScenario;
    case 'city':
      return cityScenario;
    default:
      return null;
  }
};