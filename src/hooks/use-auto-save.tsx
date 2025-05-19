
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LifeStory } from '@/types/lifeStory';

interface AutoSaveHookOptions {
  initialData: LifeStory;
  userId: string;
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
  onSaveSuccess,
}: AutoSaveHookOptions): AutoSaveHook {
  const [data, setData] = useState<LifeStory>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Pour suivre la dernière version des données
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
    if (JSON.stringify(data) !== JSON.stringify(initialData)) {
      setHasChanges(true);
    }
  }, [data, initialData]);
  
  const saveData = useCallback(async () => {
    const currentData = dataRef.current;
    
    if (!currentData || !userId) return;
    
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
        const { data, error } = await (supabase as any)
          .from('life_stories')
          .update(savePayload)
          .eq('id', currentData.id)
          .select();
          
        if (error) throw error;
        result = data[0]; 
      } else {
        // Création d'une nouvelle histoire
        savePayload.created_at = new Date().toISOString();
        
        const { data, error } = await (supabase as any)
          .from('life_stories')
          .insert(savePayload)
          .select();
          
        if (error) throw error;
        result = data[0];
      }
      
      // Mettre à jour les données locales avec l'ID retourné
      setData(prev => ({ ...prev, id: result.id }));
      setLastSaved(new Date());
      setHasChanges(false);
      
      if (onSaveSuccess) {
        onSaveSuccess(result);
      }
      
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder vos modifications.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [userId, onSaveSuccess]);
  
  // Fonction pour mettre à jour les données sans déclencher de sauvegarde
  const updateData = useCallback((newData: Partial<LifeStory>) => {
    setData(prev => {
      const updated = { ...prev, ...newData };
      return updated;
    });
  }, []);
  
  // Fonction pour forcer une sauvegarde manuelle
  const saveNow = useCallback(async () => {
    await saveData();
    // Afficher la notification uniquement lors d'une sauvegarde manuelle
    toast({
      title: "Sauvegarde réussie",
      description: "Vos réponses ont été sauvegardées avec succès.",
    });
  }, [saveData]);
  
  return {
    data,
    updateData,
    isSaving,
    lastSaved,
    saveNow,
  };
}
