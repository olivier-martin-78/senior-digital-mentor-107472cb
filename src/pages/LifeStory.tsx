
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
  const { user, session, hasRole } = useAuth();
  const navigate = useNavigate();
  const [storyOwnerInfo, setStoryOwnerInfo] = useState<{ display_name: string | null; email: string } | null>(null);
  
  const isReader = hasRole('reader');

  console.log('🏠 LifeStory - État de la page:', {
    userId: user?.id,
    userEmail: user?.email,
    isReader,
    hasSession: !!session
  });

  useEffect(() => {
    if (!session) {
      navigate('/auth');
      return;
    }
  }, [session, navigate, user]);

  // SUPPRESSION: Plus de sélection d'utilisateur, toujours utiliser l'utilisateur connecté
  const targetUserId = user?.id;

  console.log('🎯 Utilisateur cible déterminé:', {
    targetUserId,
    isReader,
    currentUserId: user?.id
  });

  // Le hook se charge de charger les données pour l'utilisateur connecté uniquement
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

  // Vérifier si l'utilisateur peut enregistrer (pas un lecteur et c'est sa propre histoire)
  const canSave = !hasRole('reader') && targetUserId === user?.id;
  const isViewingOthersStory = false; // Plus possible maintenant

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
          </div>
        </div>
      </div>
    );
  }

  // Déterminer le titre à afficher - toujours "Mon Histoire de Vie" maintenant
  const getPageTitle = () => {
    return 'Mon Histoire de Vie';
  };

  // Wrapper function to match expected audio recording signature
  const handleAudioRecorded = (chapterId: string, questionId: string, blob: Blob) => {
    // CORRECTION: Ne pas passer de chemin vide, laisser le système gérer l'URL
    console.log('🎤 LifeStory - handleAudioRecorded appelé pour:', { chapterId, questionId, blobSize: blob.size });
    // Ne rien faire ici, l'URL sera gérée par handleAudioUrlChange
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
        {/* SUPPRESSION: Plus de sélecteur d'utilisateur */}

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
          activeTab={lifeStoryData.data.chapters[lifeStoryData.activeTab]?.id || lifeStoryData.data.chapters[0]?.id || ''}
          openQuestions={Object.fromEntries(Array.from(lifeStoryData.openQuestions).map(key => [key, true]))}
          activeQuestion={lifeStoryData.activeQuestion}
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
            lifeStoryData.updateAnswer(questionId, answer);
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
