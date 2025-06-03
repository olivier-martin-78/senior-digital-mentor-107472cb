
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import WishForm from './WishForm';
import { WishPost } from '@/types/supabase';

const WishEditForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  
  const [wish, setWish] = useState<WishPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishPost = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('wish_posts')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (!data) {
          toast({
            title: "Souhait introuvable",
            description: "Le souhait que vous essayez d'éditer n'existe pas.",
            variant: "destructive"
          });
          navigate('/wishes');
          return;
        }
        
        // CORRECTION: Seul l'auteur du souhait peut le modifier (même les admins ne peuvent pas modifier les souhaits d'autres personnes)
        if (!user || user.id !== data.author_id) {
          console.log('WishEditForm - Accès refusé:', {
            userId: user?.id,
            authorId: data.author_id,
            userRole: hasRole('admin') ? 'admin' : hasRole('editor') ? 'editor' : 'reader'
          });
          
          toast({
            title: "Accès refusé",
            description: "Vous ne pouvez modifier que vos propres souhaits.",
            variant: "destructive"
          });
          navigate('/wishes');
          return;
        }
        
        setWish(data as WishPost);
      } catch (error) {
        console.error('Error fetching wish post:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger le souhait.",
          variant: "destructive"
        });
        navigate('/wishes');
      } finally {
        setLoading(false);
      }
    };

    fetchWishPost();
  }, [id, navigate, user, hasRole, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!wish) {
    return null;
  }

  return <WishForm wishToEdit={wish} />;
};

export default WishEditForm;
