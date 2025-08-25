import { useMemo } from 'react';
import { GameSound, DifficultyLevel, SoundInSequence } from '@/types/audioMemoryGame';
import { useAudioMemoryDB } from './useAudioMemoryDB';

export const useAudioMemoryGameEngine = () => {
  const { sounds, hasSounds, isLoading } = useAudioMemoryDB();

  // Generate sound sequence for the game
  const generateSoundSequence = useMemo(() => {
    return (difficulty: DifficultyLevel): SoundInSequence[] => {
      console.log('🎮 Generating sound sequence for difficulty:', difficulty);
      
      if (!hasSounds) {
        console.warn('⚠️ No sounds available in database, cannot generate sequence');
        return [];
      }

      const numberOfSounds = difficulty === 'beginner' ? 4 : difficulty === 'intermediate' ? 6 : 8;
      console.log('🎵 Number of sounds needed:', numberOfSounds);

      // Get random original sounds
      const originalSounds = sounds.filter(sound => sound.type === 'original');
      const selectedSounds = [...originalSounds]
        .sort(() => 0.5 - Math.random())
        .slice(0, numberOfSounds);

      const sequence: SoundInSequence[] = selectedSounds.map((sound, index) => ({
        sound,
        position: index
      }));

      console.log('✅ Generated sequence:', sequence.length, 'sounds');
      return sequence;
    };
  }, [sounds, hasSounds]);

  // Generate phase 4 sounds (original + variants/distractors)
  const generatePhase4Sounds = useMemo(() => {
    return (originalSequence: SoundInSequence[]): GameSound[] => {
      console.log('🎮 Generating Phase 4 sounds for sequence:', originalSequence.length);
      
      if (!hasSounds) {
        console.warn('⚠️ No sounds available in database, cannot generate Phase 4 sounds');
        return [];
      }

      const phase4Sounds: GameSound[] = [];
      const usedIds = new Set(originalSequence.map(s => s.sound.id));

      // Add original sounds from sequence
      originalSequence.forEach(({ sound }) => {
        phase4Sounds.push(sound);

        // Try to add variants of this sound
        const variants = sounds.filter(s => 
          s.type === 'variant' && s.base_sound_id === sound.id
        );
        variants.forEach(variant => {
          phase4Sounds.push(variant);
          usedIds.add(variant.id);
        });
      });

      // Add distractor sounds (not in original sequence)
      const availableDistractors = sounds.filter(sound => !usedIds.has(sound.id));
      const shuffledDistractors = [...availableDistractors].sort(() => 0.5 - Math.random());
      const numberOfDistractors = Math.min(4, shuffledDistractors.length);
      
      phase4Sounds.push(...shuffledDistractors.slice(0, numberOfDistractors));

      // Shuffle all sounds for Phase 4
      const shuffledPhase4Sounds = [...phase4Sounds].sort(() => 0.5 - Math.random());
      
      console.log('✅ Generated Phase 4 sounds:', shuffledPhase4Sounds.length);
      return shuffledPhase4Sounds;
    };
  }, [sounds, hasSounds]);

  return {
    generateSoundSequence,
    generatePhase4Sounds,
    hasSounds,
    isLoading,
    soundsCount: sounds.length
  };
};