
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import WishCard from '@/components/WishCard';
import InviteUserDialog from '@/components/InviteUserDialog';
import { useGroupPermissions } from '@/hooks/useGroupPermissions';

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
  profiles?: {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
    created_at: string;
  };
}

const Wishes = () => {
  const { user, session, hasRole } = useAuth();
  const navigate = useNavigate();
  const [wishes, setWishes] = useState<WishPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { authorizedUserIds, loading: permissionsLoading } = useGroupPermissions();
  
  const isReader = hasRole('reader');

  console.log('📖 Wishes - Vérification rôle reader:', {
    isReader,
    hasReaderRole: hasRole('reader')
  });

  useEffect(() => {
    if (!session) {
      navigate('/auth');
      return;
    }
  }, [session, navigate]);

  useEffect(() => {
    if (!permissionsLoading) {
      fetchWishes();
    }
  }, [authorizedUserIds, permissionsLoading]);

  const fetchWishes = async () => {
    if (!user) {
      return;
    }
    
    try {
      setLoading(true);
      
      console.log('🔍 Wishes - Récupération avec permissions de groupe centralisées');
      console.log('🎯 Wishes - Utilisateurs autorisés:', authorizedUserIds);

      if (authorizedUserIds.length === 0) {
        console.log('⚠️ Wishes - Aucun utilisateur autorisé');
        setWishes([]);
        return;
      }

      // Utiliser la jointure directe maintenant que les FK sont correctes
      const { data, error } = await supabase
        .from('wish_posts')
        .select(`
          *,
          profiles!inner(id, email, display_name, avatar_url, created_at)
        `)
        .in('author_id', authorizedUserIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Wishes - Erreur lors de la récupération des souhaits:', error);
        throw error;
      }
      
      console.log('✅ Wishes - Souhaits récupérés:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('📝 Wishes - Détail des souhaits:', data.map(w => ({
          id: w.id,
          title: w.title,
          author_id: w.author_id,
          published: w.published,
          author_name: w.profiles?.display_name || w.profiles?.email
        })));
      }
      
      setWishes(data || []);
      
    } catch (error) {
      console.error('💥 Wishes - Erreur dans fetchWishes:', error);
      setWishes([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading || permissionsLoading) {
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-serif text-tranches-charcoal">Souhaits</h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            {!isReader && (
              <Button asChild className="bg-tranches-sage hover:bg-tranches-sage/90 w-full sm:w-auto">
                <a href="/wishes/new">
                  <Plus className="mr-2 h-5 w-5" />
                  Nouveau souhait
                </a>
              </Button>
            )}
            {!isReader && (
              <div className="w-full sm:w-auto">
                <InviteUserDialog />
              </div>
            )}
          </div>
        </div>
        
        {wishes.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-600 mb-4">Aucun souhait pour le moment</h2>
            {!isReader ? (
              <>
                <p className="text-gray-500 mb-6">Commencez par créer votre premier souhait</p>
                <Button asChild className="bg-tranches-sage hover:bg-tranches-sage/90 w-full sm:w-auto">
                  <a href="/wishes/new">
                    <Plus className="mr-2 h-5 w-5" />
                    Créer un souhait
                  </a>
                </Button>
              </>
            ) : (
              <p className="text-gray-500">Aucun souhait disponible à consulter.</p>
            )}
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
