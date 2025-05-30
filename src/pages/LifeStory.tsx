
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLifeStory } from '@/hooks/use-life-story';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import LifeStoryLayout from '@/components/life-story/LifeStoryLayout';
import InviteUserDialog from '@/components/InviteUserDialog';
import UserSelector from '@/components/UserSelector';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

const LifeStory = () => {
  const { user, session, hasRole } = useAuth();
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [authorizedUserIds, setAuthorizedUserIds] = useState<string[]>([]);
  
  // Utiliser l'ID de l'utilisateur sélectionné ou l'utilisateur actuel
  const targetUserId = selectedUserId || user?.id || '';
  
  const lifeStoryData = useLifeStory({ targetUserId });

  useEffect(() => {
    if (!session) {
      navigate('/auth');
      return;
    }
    
    // Récupérer les utilisateurs autorisés via les groupes d'invitation
    fetchAuthorizedUsers();
  }, [session, navigate, user]);

  const fetchAuthorizedUsers = async () => {
    if (!user) return;
    
    try {
      console.log('LifeStory - Récupération des utilisateurs autorisés');
      
      // Récupérer les créateurs de groupes dont l'utilisateur est membre
      const { data: groupPermissions, error: groupError } = await supabase
        .from('group_members')
        .select(`
          group_id,
          invitation_groups!inner(created_by)
        `)
        .eq('user_id', user.id);

      if (groupError) {
        console.error('LifeStory - Erreur groupes:', groupError);
        setAuthorizedUserIds([]);
        return;
      }

      // IDs des utilisateurs autorisés via les groupes d'invitation (créateurs des groupes)
      const groupCreatorIds = groupPermissions?.map(p => p.invitation_groups.created_by).filter(id => id !== user.id) || [];
      
      console.log('LifeStory - Utilisateurs autorisés via groupes:', groupCreatorIds);
      setAuthorizedUserIds(groupCreatorIds);
    } catch (error) {
      console.error('LifeStory - Erreur lors de la récupération des utilisateurs autorisés:', error);
    }
  };

  const handleUserChange = (userId: string | null) => {
    console.log('LifeStory - Changement d\'utilisateur sélectionné vers:', userId);
    
    // Vérifier les permissions avant de changer d'utilisateur
    if (userId && userId !== user?.id && !hasRole('admin')) {
      if (!authorizedUserIds.includes(userId)) {
        console.log('LifeStory - Utilisateur non autorisé:', userId);
        return;
      }
    }
    
    setSelectedUserId(userId);
  };

  const handleSave = async () => {
    if (lifeStoryData.saveNow) {
      await lifeStoryData.saveNow();
    }
  };

  // Vérifier si l'utilisateur peut enregistrer (pas un lecteur et c'est son propre story)
  const canSave = !hasRole('reader') && (!selectedUserId || selectedUserId === user?.id);

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
          <h1 className="text-3xl font-serif text-tranches-charcoal">
            {selectedUserId && selectedUserId !== user?.id ? 'Histoire de Vie' : 'Mon Histoire de Vie'}
          </h1>
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

        <UserSelector
          permissionType="life_story"
          selectedUserId={selectedUserId}
          onUserChange={handleUserChange}
          className="mb-6"
        />
        
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
        />
      </div>
    </div>
  );
};

export default LifeStory;
