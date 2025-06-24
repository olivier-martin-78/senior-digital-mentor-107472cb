
import { supabase } from '@/integrations/supabase/client';

export const isExpiredBlobUrl = (url: string | null): boolean => {
  if (!url) return false;
  
  // URLs blob sont temporaires et commencent par "blob:"
  if (url.startsWith('blob:')) {
    return true;
  }
  
  // URLs vides ou invalides
  if (!url.trim() || url === 'null' || url === 'undefined') {
    return true;
  }
  
  return false;
};

export const cleanupExpiredAudioUrl = async (reportId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('intervention_reports')
      .update({ audio_url: null })
      .eq('id', reportId);
    
    if (error) {
      console.error('❌ Erreur lors du nettoyage de l\'URL audio:', error);
      return false;
    }
    
    console.log('✅ URL audio expirée nettoyée pour le rapport:', reportId);
    return true;
  } catch (error) {
    console.error('❌ Erreur inattendue lors du nettoyage:', error);
    return false;
  }
};

export const validateAndCleanAudioUrl = async (audioUrl: string | null, reportId: string): Promise<string | null> => {
  if (!audioUrl || isExpiredBlobUrl(audioUrl)) {
    console.log('🧹 URL audio expirée détectée, nettoyage en cours...');
    await cleanupExpiredAudioUrl(reportId);
    return null;
  }
  
  return audioUrl;
};
