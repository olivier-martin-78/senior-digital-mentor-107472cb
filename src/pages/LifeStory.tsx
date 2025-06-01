
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

  useEffect(() => {
    if (!session) {
      navigate('/auth');
      return;
    }
  }, [session, navigate, user]);

  // Le hook se charge maintenant automatiquement de déterminer le bon utilisateur cible
  const lifeStoryData = useLifeStory({});

  // Récupérer les informations du propriétaire de l'histoire pour l'affichage
  useEffect(() => {
    const getStoryOwnerInfo = async () => {
      if (!lifeStoryData.data?.user_id || !isReader) return;

      try {
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('display_name, email')
          .eq('id', lifeStoryData.data.user_id)
          .single();
        
        if (ownerProfile) {
          setStoryOwnerInfo(ownerProfile);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des infos du propriétaire:', error);
      }
    };

    getStoryOwnerInfo();
  }, [lifeStoryData.data?.user_id, isReader]);

  const handleSave = async () => {
    if (lifeStoryData.saveNow) {
      await lifeStoryData.saveNow();
    }
  };

  // Vérifier si l'utilisateur peut enregistrer (pas un lecteur)
  const canSave = !hasRole('reader');

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
