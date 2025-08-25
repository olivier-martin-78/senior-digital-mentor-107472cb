import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GameSound } from '@/types/audioMemoryGame';

export const useAudioMemoryDB = () => {
  const {
    data: sounds = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['audio-memory-sounds'],
    queryFn: async (): Promise<GameSound[]> => {
      console.log('🔍 Fetching audio memory sounds from database...');
      
      const { data, error } = await supabase
        .from('audio_memory_game_sounds')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching sounds:', error);
        throw error;
      }

      console.log('✅ Fetched sounds:', data?.length || 0);
      return (data || []) as GameSound[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const getSoundsByCategory = (category: GameSound['category']): GameSound[] => {
    return sounds.filter(sound => sound.category === category);
  };

  const getOriginalSounds = (): GameSound[] => {
    return sounds.filter(sound => sound.type === 'original');
  };

  const getVariantSounds = (baseSoundId: string): GameSound[] => {
    return sounds.filter(sound => 
      sound.type === 'variant' && sound.base_sound_id === baseSoundId
    );
  };

  const getRandomSounds = (count: number, excludeIds: string[] = []): GameSound[] => {
    const availableSounds = sounds.filter(sound => !excludeIds.includes(sound.id));
    const shuffled = [...availableSounds].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  return {
    sounds,
    isLoading,
    error,
    refetch,
    getSoundsByCategory,
    getOriginalSounds,
    getVariantSounds,
    getRandomSounds,
    hasSounds: sounds.length > 0,
    soundsCount: sounds.length
  };
};