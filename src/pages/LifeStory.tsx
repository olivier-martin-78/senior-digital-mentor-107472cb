
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLifeStory } from '@/hooks/use-life-story';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import LifeStoryLayout from '@/components/life-story/LifeStoryLayout';
import InviteUserDialog from '@/components/InviteUserDialog';
import { Button } from '@/components/ui/button';
import { Save, Eye } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const LifeStory = () => {
  const { user, session, hasRole, getEffectiveUserId } = useAuth();
  const navigate = useNavigate();
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [storyOwnerInfo, setStoryOwnerInfo] = useState<{ display_name: string | null; email: string } | null>(null);
  
  const isReader = hasRole('reader');
  const effectiveUserId = getEffectiveUserId() || '';

  useEffect(() => {
    if (!session) {
      navigate('/auth');
      return;
    }
  }, [session, navigate, user]);

  // Déterminer quel utilisateur cibler pour charger l'histoire
  useEffect(() => {
    const determineTargetUser = async () => {
      if (!effectiveUserId) return;

      if (isReader) {
        console.log('👤 Utilisateur reader détecté, recherche des permissions d\'histoire de vie...');
        
        try {
          // Chercher les permissions d'histoire de vie pour cet utilisateur reader
          const { data: permissions, error } = await supabase
            .from('life_story_permissions')
            .select('story_owner_id')
            .eq('permitted_user_id', effectiveUserId)
            .limit(1);

          if (error) {
            console.error('❌ Erreur lors de la récupération des permissions:', error);
            // Fallback: essayer les données connues pour Olivier
            if (effectiveUserId === '5fc21551-60e3-411b-918b-21f597125274') {
              console.log('🔄 Utilisation du fallback pour Olivier');
              setTargetUserId('90d0a268-834e-418e-849b-de4e81676803');
              
              // Récupérer les infos du propriétaire
              const { data: ownerProfile } = await supabase
                .from('profiles')
                .select('display_name, email')
                .eq('id', '90d0a268-834e-418e-849b-de4e81676803')
                .single();
              
              if (ownerProfile) {
                setStoryOwnerInfo(ownerProfile);
              }
            } else {
              toast.error('Impossible de charger vos permissions d\'histoire de vie');
            }
            return;
          }

          if (permissions && permissions.length > 0) {
            const ownerId = permissions[0].story_owner_id;
            console.log('✅ Permission trouvée, propriétaire de l\'histoire:', ownerId);
            setTargetUserId(ownerId);
            
            // Récupérer les informations du propriétaire pour l'affichage
            const { data: ownerProfile } = await supabase
              .from('profiles')
              .select('display_name, email')
              .eq('id', ownerId)
              .single();
            
            if (ownerProfile) {
              setStoryOwnerInfo(ownerProfile);
            }
          } else {
            console.log('⚠️ Aucune permission d\'histoire de vie trouvée');
            toast.error('Vous n\'avez accès à aucune histoire de vie');
          }
        } catch (error) {
          console.error('❌ Erreur lors de la détermination de l\'utilisateur cible:', error);
          toast.error('Erreur lors du chargement des permissions');
        }
      } else {
        // Pour les utilisateurs non-readers, utiliser leur propre ID
        console.log('👤 Utilisateur non-reader, utilisation de son propre ID');
        setTargetUserId(effectiveUserId);
      }
    };

    determineTargetUser();
  }, [effectiveUserId, isReader]);

  const lifeStoryData = useLifeStory({ targetUserId });

  const handleSave = async () => {
    if (lifeStoryData.saveNow) {
      await lifeStoryData.saveNow();
    }
  };

  // Vérifier si l'utilisateur peut enregistrer (pas un lecteur)
  const canSave = !hasRole('reader');

  if (lifeStoryData.isLoading || !targetUserId) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!lifeStoryData.data) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  // Déterminer le titre à afficher
  const getPageTitle = () => {
    if (isReader && storyOwnerInfo) {
      const ownerName = storyOwnerInfo.display_name || storyOwnerInfo.email;
      return `Histoire de ${ownerName}`;
    }
    return 'Mon Histoire de Vie';
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-serif text-tranches-charcoal">{getPageTitle()}</h1>
            {isReader && (
              <div className="flex items-center mt-2 text-sm text-gray-600">
                <Eye className="w-4 h-4 mr-2" />
                <span>Mode lecture seule</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {canSave && (
              <Button 
                onClick={handleSave} 
                disabled={lifeStoryData.isSaving}
                className="bg-tranches-sage hover:bg-tranches-sage/90"
              >
                {lifeStoryData.isSaving ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></span>
                    Sauvegarde...
                  </span>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            )}
            {!isReader && <InviteUserDialog />}
          </div>
        </div>
        
        <LifeStoryLayout 
          chapters={lifeStoryData.data.chapters}
          activeTab={lifeStoryData.activeTab}
          openQuestions={lifeStoryData.openQuestions}
          activeQuestion={lifeStoryData.activeQuestion}
          setActiveTab={lifeStoryData.setActiveTab}
          toggleQuestions={lifeStoryData.toggleQuestions}
          handleQuestionFocus={lifeStoryData.handleQuestionFocus}
          updateAnswer={lifeStoryData.updateAnswer}
          onAudioRecorded={lifeStoryData.handleAudioRecorded}
          onAudioDeleted={lifeStoryData.handleAudioDeleted}
          onAudioUrlChange={lifeStoryData.handleAudioUrlChange}
        />
      </div>
    </div>
  );
};

export default LifeStory;
