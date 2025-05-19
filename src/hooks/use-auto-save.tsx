
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LifeStory } from '@/types/lifeStory';

interface AutoSaveHookOptions {
  initialData: LifeStory;
  userId: string;
  interval?: number;
  onSaveSuccess?: (savedData: LifeStory) => void;
}

interface AutoSaveHook {
  data: LifeStory;
  updateData: (newData: Partial<LifeStory>) => void;
  isSaving: boolean;
  lastSaved: Date | null;
  saveNow: () => Promise<void>;
}

export function useAutoSave({
  initialData,
  userId,
  interval = 60000, // 60 secondes par défaut
  onSaveSuccess,
}: AutoSaveHookOptions): AutoSaveHook {
  const [data, setData] = useState<LifeStory>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Référence à la dernière version des données pour éviter les problèmes de stale closure
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
    setHasChanges(true); // Marquer comme modifié quand les données changent
  }, [data]);
  
  const saveData = useCallback(async () => {
    const currentData = dataRef.current;
    
    if (!currentData || !userId || !hasChanges) return;
    
    setIsSaving(true);
    try {
      // Préparer les données pour la sauvegarde
      const savePayload = {
        ...currentData,
        user_id: userId,
        updated_at: new Date().toISOString(),
      };
      
      let result;
      
      if (currentData.id) {
        // Mise à jour d'une histoire existante
        // Utilisation de "as any" pour contourner les restrictions de typage
        const { data, error } = await (supabase as any)
          .from('life_stories')
          .update(savePayload)
          .eq('id', currentData.id)
          .select();
          
        if (error) throw error;
        result = data[0]; // Modification pour récupérer le premier élément du tableau
      } else {
        // Création d'une nouvelle histoire
        savePayload.created_at = new Date().toISOString();
        
        // Utilisation de "as any" pour contourner les restrictions de typage
        const { data, error } = await (supabase as any)
          .from('life_stories')
          .insert(savePayload)
          .select();
          
        if (error) throw error;
        result = data[0]; // Modification pour récupérer le premier élément du tableau
      }
      
      // Mettre à jour les données locales avec l'ID retourné
      setData(prev => ({ ...prev, id: result.id }));
      setLastSaved(new Date());
      setHasChanges(false); // Réinitialiser le marqueur de changement
      
      if (onSaveSuccess) {
        onSaveSuccess(result);
      }

      // Notification de sauvegarde réussie
      toast({
        title: "Sauvegarde réussie",
        description: "Vos réponses ont été sauvegardées avec succès.",
      });
      
    } catch (error) {
      console.error("Erreur lors de la sauvegarde automatique:", error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder vos modifications.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [userId, onSaveSuccess, hasChanges]);
  
  // Sauvegarde périodique
  useEffect(() => {
    // Première sauvegarde après un délai court pour les données existantes
    const initialTimer = setTimeout(() => {
      if (hasChanges) {
        saveData();
      }
    }, 3000);
    
    // Sauvegarde périodique régulière
    const timer = setInterval(() => {
      if (hasChanges) {
        saveData();
      }
    }, interval);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(timer);
      // Sauvegarde finale lorsque le composant est démonté
      if (hasChanges) {
        saveData();
      }
    };
  }, [saveData, interval, hasChanges]);
  
  // Fonction pour mettre à jour les données
  const updateData = useCallback((newData: Partial<LifeStory>) => {
    setData(prev => {
      const updated = { ...prev, ...newData };
      return updated;
    });
  }, []);
  
  // Fonction pour forcer une sauvegarde immédiate
  const saveNow = useCallback(async () => {
    await saveData();
  }, [saveData]);
  
  return {
    data,
    updateData,
    isSaving,
    lastSaved,
    saveNow,
  };
}
