import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WordMagicLevel, WordMagicLeaderboard } from '@/types/wordMagicGame';

export const useWordMagicDB = () => {
  // Fetch all levels
  const {
    data: levels = [],
    isLoading: isLoadingLevels,
    error: levelsError,
    refetch: refetchLevels
  } = useQuery({
    queryKey: ['word-magic-levels'],
    queryFn: async (): Promise<WordMagicLevel[]> => {
      console.log('🔍 Fetching word magic levels from database...');
      
      const { data, error } = await supabase
        .from('word_magic_levels')
        .select('*')
        .order('level_number', { ascending: true });

      if (error) {
        console.error('❌ Error fetching levels:', error);
        throw error;
      }

      console.log('✅ Fetched levels:', data?.length || 0);
      // Convert Json types to proper TypeScript types
      return (data || []).map(level => ({
        ...level,
        grid_layout: level.grid_layout as any, // Json to GridCell[][]
        solutions: level.solutions as string[],
        bonus_words: level.bonus_words as string[]
      })) as WordMagicLevel[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch leaderboard
  const {
    data: leaderboard = [],
    isLoading: isLoadingLeaderboard,
    error: leaderboardError,
    refetch: refetchLeaderboard
  } = useQuery({
    queryKey: ['word-magic-leaderboard'],
    queryFn: async (): Promise<WordMagicLeaderboard[]> => {
      console.log('🔍 Fetching word magic leaderboard...');
      
      const { data, error } = await supabase
        .rpc('get_word_magic_leaderboard');

      if (error) {
        console.error('❌ Error fetching leaderboard:', error);
        throw error;
      }

      console.log('✅ Fetched leaderboard entries:', data?.length || 0);
      return (data || []) as WordMagicLeaderboard[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const getLevelByNumber = (levelNumber: number): WordMagicLevel | undefined => {
    return levels.find(level => level.level_number === levelNumber);
  };

  const getAvailableLevels = (): WordMagicLevel[] => {
    return levels.filter(level => level.level_number <= 10); // Limiter aux 10 premiers niveaux pour le moment
  };

  const getDifficultyLevels = (difficulty: string): WordMagicLevel[] => {
    return levels.filter(level => level.difficulty === difficulty);
  };

  return {
    levels,
    leaderboard,
    isLoading: isLoadingLevels || isLoadingLeaderboard,
    error: levelsError || leaderboardError,
    refetchLevels,
    refetchLeaderboard,
    getLevelByNumber,
    getAvailableLevels,
    getDifficultyLevels,
    hasLevels: levels.length > 0,
    levelsCount: levels.length
  };
};