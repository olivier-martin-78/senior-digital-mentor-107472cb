
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import LifeStoryForm from '@/components/LifeStoryForm';
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
          .maybeSingle();
          
        if (error) throw error;
        
        if (data) {
          setStory(data as LifeStoryType);
        }
        
      } catch (error) {
        console.error("Erreur lors du chargement de l'histoire de vie:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger votre histoire de vie.",
          variant: "destructive",
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
              Histoire d'une vie
            </span>
          </h1>
          <p className="text-gray-600">
            Racontez votre histoire personnelle en répondant aux questions qui vous sont proposées.
            Vous pouvez utiliser l'enregistrement vocal pour dicter vos réponses.
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
