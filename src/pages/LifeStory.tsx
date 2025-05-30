
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLifeStory } from '@/hooks/use-life-story';
import Header from '@/components/Header';
import LifeStoryLayout from '@/components/life-story/LifeStoryLayout';
import InviteUserDialog from '@/components/InviteUserDialog';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

const LifeStory = () => {
  const { user, session, hasRole, getEffectiveUserId } = useAuth();
  const navigate = useNavigate();
  
  // Utiliser l'ID de l'utilisateur effectif (impersonné ou réel)
  const targetUserId = getEffectiveUserId() || '';
  
  const lifeStoryData = useLifeStory({ targetUserId });

  useEffect(() => {
    if (!session) {
      navigate('/auth');
      return;
    }
  }, [session, navigate, user]);

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

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-serif text-tranches-charcoal">Mon Histoire de Vie</h1>
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
            <InviteUserDialog />
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
