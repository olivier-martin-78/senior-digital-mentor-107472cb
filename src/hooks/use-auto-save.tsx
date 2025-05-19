
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
  interval = 300000, // 5 minutes (300 000 ms) au lieu des 60 secondes par défaut
  onSaveSuccess,
}: AutoSaveHookOptions): AutoSaveHook {
  const [data, setData] = useState<LifeStory>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Pour suivre si une notification est déjà visible
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Pour enregistrer le dernier moment de sauvegarde (pour limiter la fréquence)
  const lastSaveTimeRef = useRef<number>(0);
  // Délai minimum entre deux notifications (5 secondes)
  const MIN_TOAST_INTERVAL = 5000;
  
  // Référence à la dernière version des données pour éviter les problèmes de stale closure
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
    if (JSON.stringify(data) !== JSON.stringify(initialData)) {
      setHasChanges(true); // Marquer comme modifié uniquement si les données ont réellement changé
    }
  }, [data, initialData]);
  
  const saveData = useCallback(async (forceNoChangesReset = false) => {
    const currentData = dataRef.current;
    
    // Pour les sauvegardes forcées (enregistrement audio), on ignore la vérification de hasChanges
    if (!currentData || !userId || (!hasChanges && !forceNoChangesReset)) return;
    
    // Vérifier si la dernière sauvegarde date de moins de 2 secondes
    const now = Date.now();
    if (now - lastSaveTimeRef.current < 2000) {
      return; // Ignorer les sauvegardes trop rapprochées
    }
    lastSaveTimeRef.current = now;
    
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
      
      // Ne réinitialiser le marqueur de changement que si ce n'est pas une sauvegarde forcée (audio)
      if (!forceNoChangesReset) {
        setHasChanges(false);
      }
      
      if (onSaveSuccess) {
        onSaveSuccess(result);
      }

      // Notification de sauvegarde réussie avec contrôle de fréquence
      // Clear any existing toast timeout
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      
      // Only show another toast if MIN_TOAST_INTERVAL has passed
      const lastToastTime = toastTimeoutRef.current ? now : 0;
      if (now - lastToastTime > MIN_TOAST_INTERVAL) {
        toast({
          title: "Sauvegarde réussie",
          description: "Vos réponses ont été sauvegardées avec succès.",
        });
        
        // Set a new timeout to track when we can show the next toast
        toastTimeoutRef.current = setTimeout(() => {
          toastTimeoutRef.current = null;
        }, MIN_TOAST_INTERVAL);
      }
      
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
  
  // Sauvegarde périodique sans déclenchement sur perte de focus
  useEffect(() => {
    // Première sauvegarde après un délai plus long (30 secondes) pour les données existantes
    const initialTimer = setTimeout(() => {
      if (hasChanges) {
        saveData();
      }
    }, 30000); // 30 secondes au lieu de 3 secondes
    
    // Sauvegarde périodique aux 5 minutes
    const timer = setInterval(() => {
      if (hasChanges) {
        saveData();
      }
    }, interval);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(timer);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      // Sauvegarde finale lorsque le composant est démonté
      if (hasChanges) {
        saveData();
      }
    };
  }, [saveData, interval, hasChanges]);
  
  // Fonction pour mettre à jour les données sans déclencher de sauvegarde immédiate
  const updateData = useCallback((newData: Partial<LifeStory>) => {
    setData(prev => {
      const updated = { ...prev, ...newData };
      return updated;
    });
    // Pas de saveData() ici pour éviter la sauvegarde immédiate sur perte de focus
  }, []);
  
  // Fonction pour forcer une sauvegarde immédiate
  const saveNow = useCallback(async () => {
    // true pour forcer la sauvegarde même s'il n'y a pas de changements marqués
    await saveData(true);
  }, [saveData]);
  
  return {
    data,
    updateData,
    isSaving,
    lastSaved,
    saveNow,
  };
}
