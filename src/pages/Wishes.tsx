
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import WishCard from '@/components/WishCard';
import InviteUserDialog from '@/components/InviteUserDialog';

interface WishPost {
  id: string;
  title: string;
  content: string;
  first_name?: string;
  age?: string;
  location?: string;
  request_type?: string;
  importance?: string;
  published?: boolean;
  created_at: string;
  author_id: string;
}

const Wishes = () => {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [wishes, setWishes] = useState<WishPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      navigate('/auth');
      return;
    }
    
    fetchWishes();
  }, [session, navigate]);

  const fetchWishes = async () => {
    if (!user) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Récupérer les souhaits avec logique d'accès côté application
      const { data, error } = await supabase
        .from('wish_posts')
        .select('*')
        .or(`author_id.eq.${user.id},author_id.in.(${await getAuthorizedUserIds(user.id)})`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des souhaits:', error);
        throw error;
      }
      
      console.log('✅ Wishes récupérées côté application:', data?.length || 0);
      setWishes(data || []);
      
    } catch (error) {
      console.error('Erreur dans fetchWishes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les IDs des utilisateurs autorisés via les groupes
  const getAuthorizedUserIds = async (userId: string): Promise<string> => {
    try {
      const { data: groupMembers } = await supabase
        .from('group_members')
        .select(`
          user_id,
          group_members_same_group:group_members!inner(user_id)
        `)
        .eq('group_members.user_id', userId);

      const userIds = groupMembers?.flatMap(gm => 
        gm.group_members_same_group?.map(sgm => sgm.user_id) || []
      ).filter(id => id !== userId) || [];

      return userIds.join(',') || 'null';
    } catch (error) {
      console.error('Erreur récupération groupe membres:', error);
      return 'null';
    }
  };

  if (loading) {
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
          <h1 className="text-3xl font-serif text-tranches-charcoal">Souhaits</h1>
          <div className="flex items-center gap-4">
            <Button asChild className="bg-tranches-sage hover:bg-tranches-sage/90">
              <a href="/wishes/new">
                <Plus className="mr-2 h-5 w-5" />
                Nouveau souhait
              </a>
            </Button>
            <InviteUserDialog />
          </div>
        </div>
        
        {wishes.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-600 mb-4">Aucun souhait pour le moment</h2>
            <p className="text-gray-500 mb-6">Commencez par créer votre premier souhait</p>
            <Button asChild className="bg-tranches-sage hover:bg-tranches-sage/90">
              <a href="/wishes/new">
                <Plus className="mr-2 h-5 w-5" />
                Créer un souhait
              </a>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishes.map((wish) => (
              <WishCard key={wish.id} wish={wish} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishes;
