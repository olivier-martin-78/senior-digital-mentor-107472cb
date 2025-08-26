import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ChallengeData {
  challengerName: string;
  challengerEmail: string;
  friendEmail: string;
  gameType: 'audio' | 'visual';
  difficulty: string;
  challengerScore?: number;
}

export const useChallengeFriend = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, profile } = useAuth();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const sendChallenge = async (
    friendEmail: string, 
    gameType: 'audio' | 'visual', 
    difficulty: string,
    challengerScore?: number
  ) => {
    if (!user || !profile) {
      throw new Error('Vous devez être connecté pour envoyer un défi');
    }

    setIsLoading(true);
    
    try {
      const challengeData: ChallengeData = {
        challengerName: profile.display_name || profile.email || 'Un ami',
        challengerEmail: profile.email || user.email || '',
        friendEmail,
        gameType,
        difficulty,
        challengerScore
      };

      console.log('Envoi du défi avec les données:', challengeData);

      const { data, error } = await supabase.functions.invoke('send-challenge-email', {
        body: challengeData
      });

      if (error) {
        console.error('Erreur Supabase lors de l\'envoi du défi:', error);
        throw new Error(error.message || 'Erreur lors de l\'envoi du défi');
      }

      console.log('Défi envoyé avec succès:', data);
      toast.success('Défi envoyé avec succès !');
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi du défi:', error);
      
      // Messages d'erreur plus spécifiques
      let errorMessage = 'Erreur lors de l\'envoi du défi';
      
      if (error instanceof Error) {
        if (error.message.includes('Rate limit')) {
          errorMessage = 'Trop de défis envoyés. Veuillez patienter avant de réessayer.';
        } else if (error.message.includes('email')) {
          errorMessage = 'Adresse email invalide.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getUserScore = async (gameType: 'audio' | 'visual', difficulty: string): Promise<number | undefined> => {
    if (!user) return undefined;

    try {
      const leaderboardFunction = gameType === 'audio' ? 'get_audio_memory_leaderboard' : 'get_visual_memory_leaderboard';
      
      const { data, error } = await supabase.rpc(leaderboardFunction, {
        p_difficulty_level: difficulty
      });

      if (error) {
        console.error('Erreur lors de la récupération du score:', error);
        return undefined;
      }

      // Trouver le score de l'utilisateur actuel
      const userEntry = data?.find((entry: any) => entry.user_id === user.id);
      return userEntry?.best_total_points;
      
    } catch (error) {
      console.error('Erreur lors de la récupération du score utilisateur:', error);
      return undefined;
    }
  };

  return {
    isModalOpen,
    isLoading,
    openModal,
    closeModal,
    sendChallenge,
    getUserScore
  };
};