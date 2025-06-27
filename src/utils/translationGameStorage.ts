
import { supabase } from '@/integrations/supabase/client';
import { GameSession, GameWord } from '@/types/translationGame';

export const saveGameSessionToSupabase = async (session: GameSession): Promise<boolean> => {
  try {
    console.log('🎮 Sauvegarde de la session dans Supabase:', session);
    
    // Get the current user ID properly
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('❌ Aucun utilisateur connecté');
      return false;
    }
    
    const { error } = await supabase
      .from('translation_game_sessions')
      .insert({
        user_id: user.id,
        score: session.score,
        total_questions: session.total,
        game_mode: session.mode,
        words_used: session.words ? JSON.stringify(session.words) : null
      });

    if (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      return false;
    }

    console.log('✅ Session sauvegardée avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error);
    return false;
  }
};

export const loadGameHistoryFromSupabase = async (): Promise<GameSession[]> => {
  try {
    console.log('🎮 Chargement de l\'historique depuis Supabase');
    
    const { data, error } = await supabase
      .from('translation_game_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Erreur lors du chargement:', error);
      return [];
    }

    if (!data) {
      console.log('📝 Aucune session trouvée');
      return [];
    }

    const sessions: GameSession[] = data.map(session => ({
      score: session.score,
      total: session.total_questions,
      mode: session.game_mode as 'fr-to-en' | 'en-to-fr',
      date: session.created_at,
      words: session.words_used ? 
        (typeof session.words_used === 'string' ? 
          JSON.parse(session.words_used) as GameWord[] : 
          session.words_used as unknown as GameWord[]) : 
        undefined
    }));

    console.log('✅ Historique chargé:', sessions.length, 'sessions');
    return sessions;
  } catch (error) {
    console.error('❌ Erreur lors du chargement:', error);
    return [];
  }
};
