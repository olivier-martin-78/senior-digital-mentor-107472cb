
import { supabase } from '@/integrations/supabase/client';

export const isExpiredBlobUrl = (url: string): boolean => {
  return url.startsWith('blob:');
};

export const validateAndCleanAudioUrl = async (url: string, reportId: string): Promise<string | null> => {
  console.log('🔧 AUDIO_CLEANUP - Validation de l\'URL:', { url, reportId });
  
  // Si c'est une blob URL, elle est expirée
  if (isExpiredBlobUrl(url)) {
    console.log('🔧 AUDIO_CLEANUP - URL blob expirée détectée');
    
    // Nettoyer l'URL expirée de la base de données
    const { error } = await supabase
      .from('intervention_reports')
      .update({ audio_url: null })
      .eq('id', reportId);
    
    if (error) {
      console.error('❌ AUDIO_CLEANUP - Erreur lors du nettoyage:', error);
    } else {
      console.log('✅ AUDIO_CLEANUP - URL expirée nettoyée');
    }
    
    return null;
  }
  
  // Vérifier si l'URL Supabase est accessible
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok) {
      console.log('✅ AUDIO_CLEANUP - URL valide');
      return url;
    } else {
      console.log('❌ AUDIO_CLEANUP - URL inaccessible, nettoyage');
      
      // Nettoyer l'URL inaccessible
      await supabase
        .from('intervention_reports')
        .update({ audio_url: null })
        .eq('id', reportId);
      
      return null;
    }
  } catch (error) {
    console.log('❌ AUDIO_CLEANUP - Erreur de validation URL:', error);
    return null;
  }
};

export const cleanupExpiredAudioUrls = async (): Promise<void> => {
  console.log('🔧 AUDIO_CLEANUP - Début du nettoyage global');
  
  try {
    // Récupérer tous les rapports avec des URLs audio
    const { data: reports, error } = await supabase
      .from('intervention_reports')
      .select('id, audio_url')
      .not('audio_url', 'is', null);
    
    if (error) {
      console.error('❌ AUDIO_CLEANUP - Erreur lors de la récupération:', error);
      return;
    }
    
    console.log(`🔧 AUDIO_CLEANUP - ${reports?.length || 0} rapports avec audio trouvés`);
    
    let cleanedCount = 0;
    
    for (const report of reports || []) {
      if (report.audio_url && isExpiredBlobUrl(report.audio_url)) {
        await validateAndCleanAudioUrl(report.audio_url, report.id);
        cleanedCount++;
      }
    }
    
    console.log(`✅ AUDIO_CLEANUP - ${cleanedCount} URLs expirées nettoyées`);
  } catch (error) {
    console.error('❌ AUDIO_CLEANUP - Erreur générale:', error);
  }
};
