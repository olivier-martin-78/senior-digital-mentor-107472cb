
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
  const { user, session, getEffectiveUserId } = useAuth();
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
      
      console.log('🔍 Wishes - Récupération avec logique de groupe CORRIGÉE');
      
      const effectiveUserId = getEffectiveUserId();
      console.log('👤 Wishes - Utilisateur courant:', effectiveUserId);

      // 1. Récupérer les groupes où l'utilisateur est membre
      const { data: userGroupMemberships, error: userGroupsError } = await supabase
        .from('group_members')
        .select(`
          group_id, 
          role,
          invitation_groups!inner(
            id,
            name,
            created_by
          )
        `)
        .eq('user_id', effectiveUserId);

      if (userGroupsError) {
        console.error('❌ Wishes - Erreur récupération groupes utilisateur:', userGroupsError);
        setWishes([]);
        setLoading(false);
        return;
      }

      console.log('👥 Wishes - Groupes de l\'utilisateur (DÉTAILLÉ):', {
        count: userGroupMemberships?.length || 0,
        groups: userGroupMemberships?.map(g => ({
          group_id: g.group_id,
          role: g.role,
          group_name: g.invitation_groups?.name,
          created_by: g.invitation_groups?.created_by
        }))
      });

      // 2. Construire la liste des utilisateurs autorisés
      let authorizedUsers = [effectiveUserId]; // Toujours inclure l'utilisateur courant
      console.log('✅ Wishes - ÉTAPE 1 - Utilisateur courant ajouté:', authorizedUsers);

      if (userGroupMemberships && userGroupMemberships.length > 0) {
        // Pour chaque groupe, ajouter le créateur du groupe ET tous les membres
        for (const membership of userGroupMemberships) {
          const groupCreator = membership.invitation_groups?.created_by;
          if (groupCreator && !authorizedUsers.includes(groupCreator)) {
            authorizedUsers.push(groupCreator);
            console.log('✅ Wishes - Ajout du créateur du groupe:', groupCreator);
          }
        }

        // Récupérer tous les membres des groupes où l'utilisateur est présent
        const groupIds = userGroupMemberships.map(g => g.group_id);
        const { data: allGroupMembers } = await supabase
          .from('group_members')
          .select('user_id')
          .in('group_id', groupIds);

        if (allGroupMembers) {
          for (const member of allGroupMembers) {
            if (!authorizedUsers.includes(member.user_id)) {
              authorizedUsers.push(member.user_id);
            }
          }
        }
        
        console.log('✅ Wishes - ÉTAPE 2 - Après ajout des membres de groupe:', {
          authorizedUsers,
          ajoutés: authorizedUsers.filter(id => id !== effectiveUserId)
        });
      } else {
        console.log('⚠️ Wishes - Aucun groupe trouvé pour l\'utilisateur');
      }

      console.log('🎯 Wishes - Utilisateurs autorisés FINAL:', {
        count: authorizedUsers.length,
        userIds: authorizedUsers,
        currentUser: effectiveUserId
      });

      // 3. Récupérer les souhaits avec logique d'accès côté application
      const { data, error } = await supabase
        .from('wish_posts')
        .select('*')
        .in('author_id', authorizedUsers)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Wishes - Erreur lors de la récupération des souhaits:', error);
        throw error;
      }
      
      console.log('✅ Wishes - Souhaits récupérés côté application (DÉTAILLÉ):', {
        count: data?.length || 0,
        wishes: data?.map(w => ({
          id: w.id,
          title: w.title,
          author_id: w.author_id,
          first_name: w.first_name
        }))
      });

      console.log('🏁 Wishes - FIN - Récapitulatif:', {
        authorizedUsers: authorizedUsers.length,
        wishesFound: data?.length || 0
      });

      setWishes(data || []);
      
    } catch (error) {
      console.error('💥 Wishes - Erreur dans fetchWishes:', error);
    } finally {
      setLoading(false);
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
