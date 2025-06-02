import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LifeStory, Chapter } from '@/types/lifeStory';
import { toast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { initialChapters } from '@/components/life-story/initialChapters';

export const useLifeStory = (storyId?: string, userId?: string) => {
  const { user, hasRole } = useAuth();
  const [lifeStory, setLifeStory] = useState<LifeStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<Array<{id: string, name: string}>>([]);

  const loadLifeStory = async (storyId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      console.log(`🔍 Chargement de l'histoire de vie avec l'ID: ${storyId}`);

      const { data, error } = await supabase
        .from('life_stories')
        .select('*')
        .eq('id', storyId)
        .single();

      if (error) {
        console.error('❌ Erreur lors du chargement de l\'histoire:', error);
        throw error;
      }

      if (data) {
        console.log('✅ Histoire de vie chargée avec succès:', data);
        setLifeStory(data);
      } else {
        console.warn('⚠️ Aucune histoire de vie trouvée avec cet ID.');
        setLifeStory(null);
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: `Impossible de charger l'histoire de vie : ${error.message}`,
        variant: 'destructive',
      });
      setLifeStory(null);
    } finally {
      setLoading(false);
    }
  };

  const saveLifeStory = async (lifeStoryToSave: LifeStory) => {
    if (!user) return;

    try {
      setSaving(true);
      console.log('💾 Sauvegarde de l\'histoire de vie:', lifeStoryToSave);

      const { error } = await supabase
        .from('life_stories')
        .upsert(lifeStoryToSave, { onConflict: 'id' });

      if (error) {
        console.error('❌ Erreur lors de la sauvegarde de l\'histoire:', error);
        throw error;
      }

      console.log('✅ Histoire de vie sauvegardée avec succès.');
      toast({
        title: 'Succès',
        description: 'Histoire de vie sauvegardée !',
      });

      setLifeStory(lifeStoryToSave);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: `Impossible de sauvegarder l'histoire de vie : ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const createNewLifeStory = async (title: string, userId: string) => {
    if (!user) return;

    try {
      setSaving(true);
      console.log('✨ Création d\'une nouvelle histoire de vie pour l\'utilisateur:', userId);

      const newStory: LifeStory = {
        user_id: userId,
        title: title,
        chapters: initialChapters.map(chapter => ({
          ...chapter,
          id: uuidv4(),
          questions: chapter.questions.map(question => ({
            ...question,
            id: uuidv4()
          }))
        })),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('life_stories')
        .insert([newStory])
        .select()

      if (error) {
        console.error('❌ Erreur lors de la création de l\'histoire:', error);
        throw error;
      }

      if (data && data.length > 0) {
        console.log('✅ Nouvelle histoire de vie créée avec succès:', data[0]);
        toast({
          title: 'Succès',
          description: 'Nouvelle histoire de vie créée !',
        });
        setLifeStory(data[0]);
      } else {
        console.error('❌ Erreur lors de la création de l\'histoire: Pas de données retournées');
        throw new Error('Pas de données retournées lors de la création de l\'histoire');
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: `Impossible de créer l'histoire de vie : ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const loadAvailableUsers = async () => {
    if (!user) return;

    try {
      console.log('🔍 Chargement des utilisateurs disponibles...');
      
      const isAdmin = hasRole('admin');
      let users: Array<{id: string, name: string}> = [];

      if (isAdmin) {
        console.log('🔍 Mode admin - récupération de tous les utilisateurs');
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, email')
          .order('display_name');

        if (profiles) {
          users = profiles.map(profile => ({
            id: profile.id,
            name: profile.display_name || profile.email || 'Utilisateur inconnu'
          }));
        }
      } else {
        console.log('🔍 Mode utilisateur normal - récupération via groupes');
        
        // Récupérer les utilisateurs du même groupe via RLS
        // Les politiques RLS gèrent automatiquement l'accès
        const { data: groupMembers } = await supabase
          .from('group_members')
          .select(`
            user_id,
            profiles(id, display_name, email)
          `);

        if (groupMembers) {
          // Créer un Set pour éviter les doublons
          const userSet = new Set();
          
          groupMembers.forEach(member => {
            if (member.profiles && !userSet.has(member.profiles.id)) {
              userSet.add(member.profiles.id);
              users.push({
                id: member.profiles.id,
                name: member.profiles.display_name || member.profiles.email || 'Utilisateur inconnu'
              });
            }
          });
        }

        // Toujours inclure l'utilisateur actuel
        if (!users.find(u => u.id === user.id)) {
          const { data: currentUserProfile } = await supabase
            .from('profiles')
            .select('display_name, email')
            .eq('id', user.id)
            .single();

          users.unshift({
            id: user.id,
            name: currentUserProfile?.display_name || currentUserProfile?.email || 'Moi'
          });
        }
      }

      console.log('🔍 Utilisateurs disponibles:', users);
      setAvailableUsers(users);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des utilisateurs:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la liste des utilisateurs',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (storyId) {
      loadLifeStory(storyId);
    } else if (userId) {
      // Si on a un userId mais pas de storyId, on ne charge pas l'histoire
      // Cela permet de créer une nouvelle histoire pour cet utilisateur
      setLifeStory(null);
      setLoading(false);
    } else {
      setLifeStory(null);
      setLoading(false);
    }
  }, [storyId, user, userId]);

  useEffect(() => {
    loadAvailableUsers();
  }, [user, hasRole]);

  return {
    lifeStory,
    loading,
    saving,
    availableUsers,
    saveLifeStory,
    createNewLifeStory,
    loadAvailableUsers
  };
};
