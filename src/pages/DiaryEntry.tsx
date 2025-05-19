
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DiaryEntry } from '@/types/diary';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, Eye, EyeOff, Calendar, Smile } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';

const DiaryEntryPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPrivateNotes, setShowPrivateNotes] = useState(false);

  useEffect(() => {
    const fetchEntry = async () => {
      if (!id || !user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('diary_entries')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setEntry(data as DiaryEntry);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
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
            <Button 
              className="mt-4"
              onClick={() => navigate('/diary')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour au journal
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render media based on type
  const renderMedia = () => {
    if (!entry.media_url) return null;
    
    if (entry.media_type?.startsWith('image/')) {
      return (
        <div className="mt-6 rounded-lg overflow-hidden">
          <img 
            src={entry.media_url} 
            alt="Media" 
            className="w-full h-auto max-h-[500px] object-contain" 
          />
        </div>
      );
    } else if (entry.media_type?.startsWith('video/')) {
      return (
        <div className="mt-6 rounded-lg overflow-hidden">
          <video 
            src={entry.media_url} 
            controls 
            className="w-full max-h-[500px]"
          >
            Votre navigateur ne prend pas en charge la lecture vidéo.
          </video>
        </div>
      );
    } else if (entry.media_type?.startsWith('audio/')) {
      return (
        <div className="mt-6">
          <audio src={entry.media_url} controls className="w-full">
            Votre navigateur ne prend pas en charge la lecture audio.
          </audio>
        </div>
      );
    }
    
    return (
      <div className="mt-6">
        <a 
          href={entry.media_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-tranches-sage hover:underline"
        >
          Voir le média
        </a>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button 
              variant="outline"
              onClick={() => navigate('/diary')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour
            </Button>
            <div className="flex space-x-2">
              <Link to={`/diary/edit/${entry.id}`}>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" /> Modifier
                </Button>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action supprimera définitivement cette entrée de journal et ne peut pas être annulée.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
            <header className="mb-6 border-b border-gray-200 pb-6">
              <div className="flex items-center text-sm text-gray-500 mb-3">
                <Calendar className="h-4 w-4 mr-2" />
                {entry.entry_date && format(parseISO(entry.entry_date), "EEEE d MMMM yyyy", { locale: fr })}
              </div>
              <h1 className="text-3xl font-serif text-tranches-charcoal">{entry.title}</h1>
              
              {entry.mood_rating && (
                <div className="flex items-center mt-4">
                  <Smile className="h-5 w-5 mr-2 text-gray-600" />
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span 
                        key={i} 
                        className={`w-5 h-5 rounded-full mx-0.5 ${i < entry.mood_rating! ? 'bg-yellow-400' : 'bg-gray-200'}`}
                      ></span>
                    ))}
                  </div>
                </div>
              )}
            </header>

            <div className="space-y-6">
              {renderMedia()}

              {entry.activities && (
                <section>
                  <h2 className="text-xl font-medium mb-2">Ce que j'ai fait aujourd'hui</h2>
                  <p className="whitespace-pre-line">{entry.activities}</p>
                </section>
              )}

              <div className="grid md:grid-cols-2 gap-8">
                {entry.positive_things && (
                  <section>
                    <h2 className="text-xl font-medium mb-2">Choses positives</h2>
                    <p className="whitespace-pre-line">{entry.positive_things}</p>
                  </section>
                )}

                {entry.negative_things && (
                  <section>
                    <h2 className="text-xl font-medium mb-2">Choses négatives</h2>
                    <p className="whitespace-pre-line">{entry.negative_things}</p>
                  </section>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {entry.physical_state && (
                  <section>
                    <h2 className="text-xl font-medium mb-2">Forme physique</h2>
                    <p className="capitalize">{entry.physical_state}</p>
                  </section>
                )}

                {entry.mental_state && (
                  <section>
                    <h2 className="text-xl font-medium mb-2">Forme mentale</h2>
                    <p className="capitalize">{entry.mental_state}</p>
                  </section>
                )}
              </div>

              {entry.contacted_people && entry.contacted_people.length > 0 && (
                <section>
                  <h2 className="text-xl font-medium mb-2">Personnes contactées</h2>
                  <div className="flex flex-wrap gap-2">
                    {entry.contacted_people.map((person, idx) => (
                      <Badge key={idx} variant="secondary">{person}</Badge>
                    ))}
                  </div>
                </section>
              )}

              {entry.reflections && (
                <section>
                  <h2 className="text-xl font-medium mb-2">Réflexions du jour</h2>
                  <p className="whitespace-pre-line">{entry.reflections}</p>
                </section>
              )}

              {entry.desire_of_day && (
                <section>
                  <h2 className="text-xl font-medium mb-2">Envie du jour</h2>
                  <p>{entry.desire_of_day}</p>
                </section>
              )}

              {entry.private_notes && (
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-medium">Notes privées</h2>
                    {entry.is_private_notes_locked && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowPrivateNotes(!showPrivateNotes)}
                      >
                        {showPrivateNotes ? (
                          <><EyeOff className="h-4 w-4 mr-1" /> Masquer</>
                        ) : (
                          <><Eye className="h-4 w-4 mr-1" /> Afficher</>
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {(!entry.is_private_notes_locked || showPrivateNotes) ? (
                    <p className="whitespace-pre-line">{entry.private_notes}</p>
                  ) : (
                    <div className="p-4 border border-dashed border-gray-300 rounded text-gray-400 text-center">
                      Notes masquées
                    </div>
                  )}
                </section>
              )}

              {entry.objectives && (
                <section>
                  <h2 className="text-xl font-medium mb-2">Objectifs ou tâches</h2>
                  <p className="whitespace-pre-line">{entry.objectives}</p>
                </section>
              )}

              {entry.tags && entry.tags.length > 0 && (
                <section>
                  <h2 className="text-xl font-medium mb-2">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {entry.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};

export default DiaryEntryPage;
