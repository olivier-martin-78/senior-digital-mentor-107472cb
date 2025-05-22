// src/pages/LifeStory.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import LifeStoryForm from '@/components/life-story/LifeStoryForm';
import { LifeStory as LifeStoryType } from '@/types/lifeStory';
import { Button } from '@/components/ui/button';
import { Book, ChevronLeft } from 'lucide-react';

const LifeStory: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState<LifeStoryType | null>(null);

  useEffect(() => {
    const loadLifeStory = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('life_stories')
          .select('*')
          .eq('user_id', user.id)
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          const lifeStory: LifeStoryType = {
            id: data[0].id,
            user_id: data[0].user_id,
            title: data[0].title || 'Mon histoire',
            chapters: Array.isArray(data[0].chapters)
              ? data[0].chapters.map((chapter: any) => ({
                  id: chapter.id,
                  title: chapter.title,
                  questions: Array.isArray(chapter.questions)
                    ? chapter.questions.map((q: any) => ({
                        id: q.id,
                        text: q.text,
                        answer: q.answer || '',
                        audioBlob: null,
                        audioUrl: q.audioUrl || null,
                      }))
                    : [],
                }))
              : [
                  {
                    id: 'chapter-1',
                    title: 'Chapitre 1',
                    questions: [
                      { id: 'question-1', text: 'Quelle est votre première mémoire ?', answer: '', audioBlob: null, audioUrl: null },
                    ],
                  },
                ],
            created_at: data[0].created_at,
            updated_at: data[0].updated_at,
            last_edited_chapter: data[0].last_edited_chapter,
            last_edited_question: data[0].last_edited_question,
          };
          setStory(lifeStory);
        } else {
          // Initialiser une histoire par défaut si aucune n'est trouvée
          setStory({
            id: '',
            user_id: user.id,
            title: 'Mon histoire',
            chapters: [
              {
                id: 'chapter-1',
                title: 'Chapitre 1',
                questions: [
                  { id: 'question-1', text: 'Quelle est votre première mémoire ?', answer: '', audioBlob: null, audioUrl: null },
                ],
              },
            ],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_edited_chapter: null,
            last_edited_question: null,
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l’histoire de vie:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger votre histoire de vie.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadLifeStory();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Header />
      <div className="container mx-auto px-4 py-24">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Retour
          </Button>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-tranches-charcoal mb-2">
            <span className="flex items-center">
              <Book className="mr-3 h-6 w-6" />
              Histoire d’une vie
            </span>
          </h1>
          <p className="text-gray-600">
            Racontez votre histoire personnelle en répondant aux questions qui vous sont proposées.
            Vous pouvez utiliser l’enregistrement vocal pour dicter vos réponses.
          </p>
        </div>
        {loading ? (
          <div className="flex justify-center my-10">
            <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <LifeStoryForm existingStory={story || undefined} />
        )}
      </div>
    </div>
  );
};

export default LifeStory;
