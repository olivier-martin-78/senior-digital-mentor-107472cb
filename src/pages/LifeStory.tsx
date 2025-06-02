
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
    selectedUserId,
    isReader,
    hasSession: !!session
  });

  useEffect(() => {
    if (!session) {
      navigate('/auth');
      return;
    }
  }, [session, navigate, user]);

  // Pour les non-readers, charger la dernière sélection depuis localStorage
  useEffect(() => {
    if (!isReader) {
      const savedSelection = localStorage.getItem('lifeStory_selectedUserId');
      if (savedSelection && savedSelection !== 'null') {
        console.log('📂 Chargement sélection sauvegardée:', savedSelection);
        setSelectedUserId(savedSelection);
      }
    }
    // Pour les readers, on laisse selectedUserId à null pour utiliser leur propre histoire
  }, [isReader]);

  // Sauvegarder la sélection dans localStorage (seulement pour les non-readers)
  useEffect(() => {
    if (!isReader) {
      localStorage.setItem('lifeStory_selectedUserId', selectedUserId || 'null');
    }
  }, [selectedUserId, isReader]);

  // Déterminer l'utilisateur cible selon le contexte
  const targetUserId = isReader ? user?.id : selectedUserId;

  console.log('🎯 Utilisateur cible déterminé:', {
    targetUserId,
    isReader,
    selectedUserId,
    currentUserId: user?.id
  });

  // Le hook se charge de charger les données pour l'utilisateur cible
  const lifeStoryData = useLifeStory({
    targetUserId: targetUserId || undefined
  });

  console.log('📊 Données chargées:', {
    hasData: !!lifeStoryData.data,
    dataUserId: lifeStoryData.data?.user_id,
    chaptersCount: lifeStoryData.data?.chapters?.length,
    isLoading: lifeStoryData.isLoading
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

  const handleUserChange = (userId: string | null) => {
    console.log('👤 Changement d\'utilisateur sélectionné:', userId);
    setSelectedUserId(userId);
  };

  // Vérifier si l'utilisateur peut enregistrer (pas un lecteur et c'est sa propre histoire ou il est admin)
  const canSave = !hasRole('reader') && (!targetUserId || targetUserId === user?.id || hasRole('admin'));
  const isViewingOthersStory = targetUserId && targetUserId !== user?.id;

  console.log('🏠 Permissions calculées:', {
    canSave,
    isViewingOthersStory,
    storyOwnerInfo,
    effectiveStoryOwner: lifeStoryData.data?.user_id
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
            {!isReader && (
              <p className="text-sm text-gray-500">
                Sélectionnez un utilisateur ci-dessus pour voir son histoire.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Déterminer le titre à afficher
  const getPageTitle = () => {
    if (isViewingOthersStory && storyOwnerInfo) {
      const ownerName = storyOwnerInfo.display_name || storyOwnerInfo.email;
      return `Histoire de ${ownerName}`;
    }
    if (isReader && storyOwnerInfo) {
      const ownerName = storyOwnerInfo.display_name || storyOwnerInfo.email;
      return `Mon Histoire de Vie`;
    }
    return 'Mon Histoire de Vie';
  };

  // Convert activeTab from number to string for component compatibility
  const activeTabString = lifeStoryData.activeTab.toString();
  
  // Convert openQuestions Set to object for component compatibility
  const openQuestionsObject: { [key: string]: boolean } = {};
  lifeStoryData.openQuestions.forEach(key => {
    openQuestionsObject[key] = true;
  });
  
  // Wrapper function to convert string to number for setActiveTab
  const handleSetActiveTab = (tab: string) => {
    const tabIndex = parseInt(tab, 10);
    if (!isNaN(tabIndex)) {
      lifeStoryData.setActiveTab(tabIndex);
    }
  };
  
  // Wrapper function to match expected audio recording signature
  const handleAudioRecorded = (chapterId: string, questionId: string, blob: Blob) => {
    lifeStoryData.handleAudioRecorded(questionId, blob, '');
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Sélecteur d'utilisateur pour les non-lecteurs */}
        {!isReader && (
          <div className="mb-6">
            <LifeStoryUserSelector
              selectedUserId={selectedUserId}
              onUserChange={handleUserChange}
            />
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-serif text-tranches-charcoal">{getPageTitle()}</h1>
            {(isReader || isViewingOthersStory) && (
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
            {!isReader && !isViewingOthersStory && <InviteUserDialog />}
          </div>
        </div>
        
        <LifeStoryLayout 
          chapters={lifeStoryData.data.chapters}
          activeTab={activeTabString}
          openQuestions={openQuestionsObject}
          activeQuestion={lifeStoryData.activeQuestion}
          setActiveTab={handleSetActiveTab}
          toggleQuestions={lifeStoryData.toggleQuestions}
          handleQuestionFocus={lifeStoryData.handleQuestionFocus}
          updateAnswer={lifeStoryData.updateAnswer}
          onAudioRecorded={handleAudioRecorded}
          onAudioDeleted={lifeStoryData.handleAudioDeleted}
          onAudioUrlChange={lifeStoryData.handleAudioUrlChange}
        />
      </div>
    </div>
  );
};

export default LifeStory;
