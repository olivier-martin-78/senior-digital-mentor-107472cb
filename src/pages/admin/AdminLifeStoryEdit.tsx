
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Save, User, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { LifeStory, Chapter } from '@/types/lifeStory';
import LifeStoryForm from '@/components/life-story/LifeStoryForm';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UserInfo {
  email: string;
  display_name?: string | null;
}

const AdminLifeStoryEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState<LifeStory | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hasRole('admin')) {
      navigate('/unauthorized');
      return;
    }
    
    if (id) {
      loadLifeStory(id);
    }
  }, [id, hasRole, navigate]);

  const loadLifeStory = async (storyId: string) => {
    try {
      setLoading(true);
      
      // Récupérer l'histoire de vie
      const { data, error } = await supabase
        .from('life_stories')
        .select('*')
        .eq('id', storyId)
        .single();

      if (error) throw error;

      if (data) {
        // Récupérer les informations de l'utilisateur séparément
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('email, display_name')
          .eq('id', data.user_id)
          .single();
          
        if (userError) {
          console.error('Erreur lors de la récupération des informations utilisateur:', userError);
          // On continue même si on n'a pas pu récupérer l'utilisateur
        } else if (userData) {
          setUserInfo({
            email: userData.email,
            display_name: userData.display_name
          });
        }
        
        // Convertir le champ JSON chapters en type Chapter[] de façon sécurisée
        let parsedChapters: Chapter[] = [];
        
        console.log('Raw chapters data:', data.chapters);
        
        if (data.chapters) {
          try {
            if (typeof data.chapters === 'string') {
              // Si chapters est une chaîne JSON, la parser
              parsedChapters = JSON.parse(data.chapters) as Chapter[];
            } else if (Array.isArray(data.chapters)) {
              // Vérifier et convertir chaque élément du tableau en Chapter
              parsedChapters = (data.chapters as any[]).map(chapter => ({
                id: chapter.id || '',
                title: chapter.title || '',
                description: chapter.description || '',
                questions: Array.isArray(chapter.questions) ? chapter.questions.map(q => ({
                  id: q.id || '',
                  text: q.text || '',
                  answer: q.answer || '',
                  audioBlob: q.audioBlob || null,
                  audioUrl: q.audioUrl || null
                })) : []
              }));
            } else if (typeof data.chapters === 'object') {
              // Si c'est un objet, essayer de le convertir en tableau
              parsedChapters = Object.values(data.chapters as any).map((chapter: any) => ({
                id: chapter.id || '',
                title: chapter.title || '',
                description: chapter.description || '',
                questions: Array.isArray(chapter.questions) ? chapter.questions.map((q: any) => ({
                  id: q.id || '',
                  text: q.text || '',
                  answer: q.answer || '',
                  audioBlob: q.audioBlob || null,
                  audioUrl: q.audioUrl || null
                })) : []
              }));
            }
          } catch (parseError) {
            console.error('Erreur lors du parsing des chapitres:', parseError);
            parsedChapters = [];
          }
        }
        
        console.log('Parsed chapters:', parsedChapters);
        
        // Formater l'histoire de vie pour le composant LifeStoryForm
        const lifeStory: LifeStory = {
          id: data.id,
          user_id: data.user_id,
          title: data.title,
          chapters: parsedChapters,
          created_at: data.created_at,
          updated_at: data.updated_at,
          last_edited_chapter: data.last_edited_chapter,
          last_edited_question: data.last_edited_question,
        };
        
        setStory(lifeStory);
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: `Impossible de charger l'histoire de vie : ${error.message}`,
        variant: 'destructive',
      });
      navigate('/admin/life-stories');
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!story) return;
    
    const newTitle = e.target.value;
    setStory({ ...story, title: newTitle });
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('life_stories')
        .update({ title: newTitle })
        .eq('id', story.id);
      
      if (error) throw error;
      
      toast({
        title: 'Titre mis à jour',
        description: 'Le titre de l\'histoire a été mis à jour avec succès',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: `Impossible de mettre à jour le titre : ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-24">
        <div className="mb-8 flex items-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/life-stories')}
            className="mr-auto"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Retour à la liste
          </Button>
          <h1 className="text-3xl font-serif text-tranches-charcoal">
            Édition d'une histoire de vie
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center my-10">
            <div className="animate-spin h-12 w-12 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
          </div>
        ) : story ? (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-1">
                    Titre de l'histoire
                  </label>
                  <Input
                    id="title"
                    value={story.title}
                    onChange={handleTitleChange}
                    className="max-w-lg"
                  />
                </div>

                {userInfo && (
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-1" />
                    <span>
                      Utilisateur : {userInfo.display_name || userInfo.email}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>
                    Dernière modification : {story.updated_at 
                      ? format(new Date(story.updated_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })
                      : 'Non disponible'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-medium mb-6">Contenu de l'histoire</h2>
              <LifeStoryForm existingStory={story} />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-10 text-center">
            <p className="text-gray-600">
              Cette histoire de vie n'existe pas ou a été supprimée.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLifeStoryEdit;
