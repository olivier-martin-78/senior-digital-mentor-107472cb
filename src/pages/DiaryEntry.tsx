
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DiaryEntry } from '@/types/diary';
import { useToast } from '@/hooks/use-toast';
import EntryHeader from '@/components/diary/EntryHeader';
import EntryContent from '@/components/diary/EntryContent';
import LoadingSpinner from '@/components/diary/LoadingSpinner';
import GroupNotificationButton from '@/components/GroupNotificationButton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useContentReadStatus } from '@/hooks/useContentReadStatus';
import { UserActionsService } from '@/services/UserActionsService';

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
  const { markAsRead } = useContentReadStatus('diary', id || '');

  console.log('🔍 DiaryEntry - Debug state:', {
    id,
    loading,
    entry: entry ? { id: entry.id, title: entry.title } : null,
    user: user ? user.id : null
  });

  useEffect(() => {
    const fetchEntry = async () => {
      if (!id) {
        console.log('❌ DiaryEntry - No ID provided');
        setLoading(false);
        return;
      }

      if (!user) {
        console.log('❌ DiaryEntry - No user logged in');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('🔍 DiaryEntry - Fetching entry:', id);
        
        // First get the diary entry
        const { data: entryData, error: entryError } = await supabase
          .from('diary_entries')
          .select('*')
          .eq('id', id)
          .single();

        if (entryError) {
          console.error('❌ DiaryEntry - Error fetching entry:', entryError);
          throw entryError;
        }

        console.log('✅ DiaryEntry - Entry found:', entryData?.id);

        if (entryData) {
          // Then get the profile data separately
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('display_name, email')
            .eq('id', entryData.user_id)
            .single();

          if (profileError) {
            console.error('⚠️ DiaryEntry - Error fetching profile:', profileError);
            // Set entry with null profile if profile fetch fails
            setEntry({
              ...entryData,
              profiles: null
            } as DiaryEntryWithAuthor);
          } else {
            console.log('✅ DiaryEntry - Profile found:', profileData?.email);
            setEntry({
              ...entryData,
              profiles: profileData
            } as DiaryEntryWithAuthor);
          }

          // Marquer comme lu si ce n'est pas l'auteur
          if (user.id !== entryData.user_id) {
            markAsRead();
          }

          // Tracker la vue de l'entrée
          if (entryData) {
            UserActionsService.trackView('diary_entry', entryData.id, entryData.title);
          }
        }
      } catch (error: any) {
        console.error('💥 DiaryEntry - Critical error:', error);
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
  }, [id, user, toast, navigate, markAsRead]);

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

      // Tracker la suppression
      if (entry) {
        await UserActionsService.trackDelete('diary_entry', entry.id, entry.title);
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
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-gray-50">
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
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto">
          {/* En-tête de navigation et actions */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/diary')}
              className="flex items-center gap-2 self-start"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au journal
            </Button>
            
            {canEdit && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/diary/edit/${entry.id}`)}
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Modifier
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </Button>
              </div>
            )}
          </div>

          {/* Informations sur l'auteur et la date */}
          <div className="mb-4 text-sm text-gray-600">
            <p>Par {authorName}</p>
            {entry.created_at && (
              <p>Créé le {new Date(entry.created_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            )}
          </div>
          
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
