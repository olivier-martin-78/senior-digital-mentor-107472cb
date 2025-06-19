import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DiaryEntry } from '@/types/diary';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import DiaryHeader from '@/components/diary/DiaryHeader';
import EntryHeader from '@/components/diary/EntryHeader';
import EntryContent from '@/components/diary/EntryContent';
import LoadingSpinner from '@/components/diary/LoadingSpinner';
import GroupNotificationButton from '@/components/GroupNotificationButton';

interface DiaryEntryWithAuthor extends DiaryEntry {
  profiles: {
    display_name?: string | null;
    email: string;
  } | null;
}

const DiaryEntryPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [entry, setEntry] = useState<DiaryEntryWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntry = async () => {
      if (!id || !user) return;

      try {
        setLoading(true);
        
        // First get the diary entry
        const { data: entryData, error: entryError } = await supabase
          .from('diary_entries')
          .select('*')
          .eq('id', id)
          .single();

        if (entryError) {
          throw entryError;
        }

        if (entryData) {
          // Then get the profile data separately
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('display_name, email')
            .eq('id', entryData.user_id)
            .single();

          if (profileError) {
            console.error('Error fetching profile:', profileError);
            // Set entry with null profile if profile fetch fails
            setEntry({
              ...entryData,
              profiles: null
            } as DiaryEntryWithAuthor);
          } else {
            setEntry({
              ...entryData,
              profiles: profileData
            } as DiaryEntryWithAuthor);
          }
        }
      } catch (error: any) {
        console.error('Erreur lors de la récupération de l\'entrée:', error);
        toast({
          title: 'Erreur',
          description: "Impossible de récupérer cette entrée de journal.",
          variant: 'destructive',
        });
        navigate('/diary');
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [id, user, toast, navigate]);

  const handleDelete = async () => {
    if (!id || !user) return;

    try {
      // Delete media if exists
      if (entry?.media_url) {
        const mediaPath = entry.media_url.split('/').pop();
        if (mediaPath) {
          await supabase.storage
            .from('diary_media')
            .remove([`${user.id}/${mediaPath}`]);
        }
      }

      // Delete entry
      const { error } = await supabase
        .from('diary_entries')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Succès',
        description: "L'entrée a été supprimée avec succès.",
      });

      navigate('/diary');
    } catch (error: any) {
      console.error('Erreur lors de la suppression de l\'entrée:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de supprimer cette entrée de journal.",
        variant: 'destructive',
      });
    }
  };

  const handleGroupNotificationSent = () => {
    if (entry) {
      setEntry({
        ...entry,
        email_notification_sent: true,
        email_notification_requested: true
      });
    }
  };

  // Vérifier les permissions de modification
  const canEdit = entry && user && (
    entry.user_id === user.id || // L'auteur peut toujours modifier
    hasRole('admin') // Les admins peuvent modifier
  );

  // Afficher le bouton de notification de groupe seulement si l'utilisateur est l'auteur
  const canNotifyGroup = entry && user && entry.user_id === user.id;

  // Déterminer le nom de l'auteur
  const authorName = entry?.profiles?.display_name || entry?.profiles?.email || 'Utilisateur inconnu';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-24">
          <div className="text-center">
            <h2 className="text-2xl font-serif text-tranches-charcoal">Entrée non trouvée</h2>
            <button 
              className="mt-4 bg-tranches-sage text-white px-4 py-2 rounded hover:bg-tranches-sage/90"
              onClick={() => navigate('/diary')}
            >
              Retour au journal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto">
          <DiaryHeader 
            entryId={entry.id} 
            onDelete={handleDelete}
            canEdit={canEdit}
            authorName={authorName}
            createdAt={entry.created_at || undefined}
          />
          
          <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
            <EntryHeader 
              title={entry.title} 
              date={entry.entry_date} 
              moodRating={entry.mood_rating}
              isLocked={entry.is_private_notes_locked}
            />
            
            <EntryContent entry={entry} />
          </article>

          {/* Notification de groupe pour les auteurs */}
          {canNotifyGroup && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Notifier votre groupe de cette entrée
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Envoyez un email aux membres de votre groupe
                  </p>
                </div>
                <GroupNotificationButton
                  contentType="diary"
                  contentId={entry.id}
                  title={entry.title}
                  isNotificationSent={entry.email_notification_sent}
                  onNotificationSent={handleGroupNotificationSent}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiaryEntryPage;
