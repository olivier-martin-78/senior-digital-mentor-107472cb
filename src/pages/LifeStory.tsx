import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLifeStory } from '@/hooks/use-life-story';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import LifeStoryLayout from '@/components/life-story/LifeStoryLayout';
import LifeStoryUserSelector from '@/components/life-story/LifeStoryUserSelector';
import InviteUserDialog from '@/components/InviteUserDialog';
import { Button } from '@/components/ui/button';
import { Save, Eye } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const LifeStory = () => {
  const { user, session, hasRole } = useAuth();
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [storyOwnerInfo, setStoryOwnerInfo] = useState<{ display_name: string | null; email: string } | null>(null);
  
  const isReader = hasRole('reader');

  console.log('🏠 LifeStory - État de la page:', {
    userId: user?.id,
    userEmail: user?.email,
    isReader,
    hasSession: !!session,
    selectedUserId
  });

  useEffect(() => {
    if (!session) {
      navigate('/auth');
      return;
    }
  }, [session, navigate, user]);

  // Déterminer l'utilisateur cible : selectedUserId ou l'utilisateur connecté
  const targetUserId = selectedUserId || user?.id;

  console.log('🎯 Utilisateur cible déterminé:', {
    targetUserId,
    selectedUserId,
    isReader,
    currentUserId: user?.id,
    isViewingOwnStory: targetUserId === user?.id
  });

  // Le hook se charge de charger les données pour l'utilisateur cible
  const lifeStoryData = useLifeStory({
    targetUserId: targetUserId || undefined
  });

  console.log('📊 Données chargées:', {
    hasData: !!lifeStoryData.data,
    dataUserId: lifeStoryData.data?.user_id,
    chaptersCount: lifeStoryData.data?.chapters?.length,
    isLoading: lifeStoryData.isLoading,
    chapters: lifeStoryData.data?.chapters
  });

  // Récupérer les informations du propriétaire de l'histoire pour l'affichage
  useEffect(() => {
    const getStoryOwnerInfo = async () => {
      const ownerUserId = lifeStoryData.data?.user_id;
      if (!ownerUserId) {
        console.log('🏠 Pas d\'owner ID, reset des infos propriétaire');
        setStoryOwnerInfo(null);
        return;
      }

      console.log('🏠 Récupération infos propriétaire pour:', ownerUserId);

      try {
        const { data: ownerProfile, error } = await supabase
          .from('profiles')
          .select('display_name, email')
          .eq('id', ownerUserId)
          .single();
        
        console.log('🏠 Profil propriétaire récupéré:', { ownerProfile, error });
        
        if (ownerProfile && !error) {
          setStoryOwnerInfo(ownerProfile);
          console.log('✅ Informations propriétaire définies:', ownerProfile);
        } else {
          setStoryOwnerInfo(null);
        }
      } catch (error) {
        console.error('❌ Erreur lors de la récupération des infos du propriétaire:', error);
        setStoryOwnerInfo(null);
      }
    };

    getStoryOwnerInfo();
  }, [lifeStoryData.data?.user_id]);

  const handleSave = async () => {
    if (lifeStoryData.saveNow) {
      await lifeStoryData.saveNow();
    }
  };

  // CORRECTION FINALE: Les permissions se basent uniquement sur qui possède l'histoire
  // - Si c'est sa propre histoire (selectedUserId est null OU selectedUserId === user?.id), TOUJOURS autoriser l'édition (sauf pour les readers)
  // - Si c'est l'histoire de quelqu'un d'autre, interdire l'édition (mode lecture seule)
  // Le rôle "reader" ne peut jamais éditer, même sa propre histoire
  const isViewingOwnStory = selectedUserId === null || selectedUserId === user?.id;
  const canSave = isViewingOwnStory && !isReader; // Les readers ne peuvent jamais sauvegarder, même leur propre histoire
  const isViewingOthersStory = selectedUserId !== null && selectedUserId !== user?.id;
  
  // NOUVELLE LOGIQUE: Calculer isReadOnly pour les composants enfants
  const isReadOnly = isViewingOthersStory || isReader; // Mode lecture seule pour les histoires des autres OU pour les readers

  console.log('🏠 Permissions calculées:', {
    canSave,
    isViewingOthersStory,
    isViewingOwnStory,
    storyOwnerInfo,
    effectiveStoryOwner: lifeStoryData.data?.user_id,
    selectedUserId,
    userIdMatch: selectedUserId === user?.id,
    isSelectedUserIdNull: selectedUserId === null,
    isReader,
    isReadOnly,
    finalDecision: `canSave: ${canSave}, isReadOnly: ${isReadOnly}, car isViewingOwnStory: ${isViewingOwnStory} et isReader: ${isReader}`
  });

  console.log('🔍 DEBUG PERMISSIONS DÉTAILLÉ pour utilisateur:', {
    userEmail: user?.email,
    userId: user?.id,
    selectedUserId,
    isViewingMyStory: selectedUserId === null,
    isSelectedUserIdMyId: selectedUserId === user?.id,
    calculatedIsViewingOwnStory: isViewingOwnStory,
    calculatedIsReadOnly: isReadOnly,
    calculatedCanSave: canSave,
    userRole: isReader ? 'reader' : 'not-reader',
    shouldBeAbleToEdit: (selectedUserId === null || selectedUserId === user?.id) && !isReader
  });

  if (lifeStoryData.isLoading) {
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
          <div className="text-center">
            <p className="text-gray-600 mb-4">Aucune histoire de vie trouvée.</p>
          </div>
        </div>
      </div>
    );
  }

  // Déterminer le titre à afficher
  const getPageTitle = () => {
    if (isViewingOthersStory && storyOwnerInfo) {
      return `Histoire de ${storyOwnerInfo.display_name || storyOwnerInfo.email}`;
    }
    return 'Mon Histoire de Vie';
  };

  // Wrapper function to match expected audio recording signature
  const handleAudioRecorded = (chapterId: string, questionId: string, blob: Blob) => {
    console.log('🎤 LifeStory - handleAudioRecorded appelé pour:', { chapterId, questionId, blobSize: blob.size });
  };

  // Wrapper function for audio URL change
  const handleAudioUrlChange = (chapterId: string, questionId: string, audioUrl: string | null) => {
    console.log('🔄 LifeStory - handleAudioUrlChange appelé pour:', { chapterId, questionId, audioUrl });
    lifeStoryData.handleAudioUrlChange(questionId, audioUrl);
  };

  // Wrapper function for audio deleted
  const handleAudioDeleted = (chapterId: string, questionId: string) => {
    lifeStoryData.handleAudioDeleted(questionId);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Sélecteur d'utilisateur - maintenant affiché pour tous les utilisateurs */}
        <LifeStoryUserSelector
          selectedUserId={selectedUserId}
          onUserChange={setSelectedUserId}
          className="mb-6"
        />

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-serif text-tranches-charcoal">{getPageTitle()}</h1>
            {(isViewingOthersStory || isReader) && (
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
          activeTab={lifeStoryData.data.chapters[lifeStoryData.activeTab]?.id || lifeStoryData.data.chapters[0]?.id || ''}
          openQuestions={Object.fromEntries(Array.from(lifeStoryData.openQuestions).map(key => [key, true]))}
          activeQuestion={lifeStoryData.activeQuestion}
          isReadOnly={isReadOnly}
          setActiveTab={(tabId: string) => {
            const tabIndex = lifeStoryData.data.chapters.findIndex(ch => ch.id === tabId);
            if (tabIndex !== -1) {
              lifeStoryData.setActiveTab(tabIndex);
            }
          }}
          toggleQuestions={lifeStoryData.toggleQuestions}
          handleQuestionFocus={(chapterId: string, questionId: string) => {
            lifeStoryData.handleQuestionFocus(questionId);
          }}
          updateAnswer={(chapterId: string, questionId: string, answer: string) => {
            // Empêcher la modification si on regarde l'histoire de quelqu'un d'autre ou si on est reader
            if (!isViewingOthersStory && !isReader) {
              lifeStoryData.updateAnswer(questionId, answer);
            }
          }}
          onAudioRecorded={handleAudioRecorded}
          onAudioDeleted={handleAudioDeleted}
          onAudioUrlChange={handleAudioUrlChange}
        />
      </div>
    </div>
  );
};

export default LifeStory;
