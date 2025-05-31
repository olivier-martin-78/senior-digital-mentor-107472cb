
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
  const { user, session, hasRole } = useAuth();
  const navigate = useNavigate();
  const [wishes, setWishes] = useState<WishPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    if (!session) {
      navigate('/auth');
      return;
    }
    fetchWishes();
  }, [session, navigate]);

  const fetchWishes = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('=== DEBUG Wishes - Début du diagnostic ===');
      console.log('Utilisateur actuel:', user.id);
      console.log('Session présente:', !!session);
      console.log('Est admin?', hasRole('admin'));
      
      // Test de la fonction is_admin()
      const { data: adminTest, error: adminError } = await supabase
        .rpc('is_admin');
      
      console.log('Test fonction is_admin():', adminTest, adminError);
      
      // Test des rôles utilisateur
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
        
      console.log('Rôles utilisateur:', userRoles, rolesError);
      
      // Tentative de récupération des souhaits avec debug détaillé
      console.log('Tentative de récupération des souhaits...');
      
      const { data, error, count } = await supabase
        .from('wish_posts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      console.log('Requête wish_posts - Données récupérées:', data);
      console.log('Requête wish_posts - Nombre total:', count);
      console.log('Requête wish_posts - Erreur:', error);
      
      // Sauvegarde des infos de debug
      setDebugInfo({
        userId: user.id,
        isAdmin: hasRole('admin'),
        adminRpcTest: adminTest,
        userRoles: userRoles,
        wishesCount: count,
        error: error,
        hasData: !!data
      });
      
      if (error) {
        console.error('Erreur lors du chargement des souhaits:', error);
        throw error;
      }
      
      console.log('Souhaits récupérés avec succès:', data?.length || 0);
      setWishes(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des souhaits:', error);
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
        
        {/* Section de debug (à supprimer une fois le problème résolu) */}
        {debugInfo && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">Informations de diagnostic :</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>ID Utilisateur: {debugInfo.userId}</p>
              <p>Est Admin: {debugInfo.isAdmin ? 'Oui' : 'Non'}</p>
              <p>Test fonction admin RPC: {JSON.stringify(debugInfo.adminRpcTest)}</p>
              <p>Rôles utilisateur: {JSON.stringify(debugInfo.userRoles)}</p>
              <p>Nombre de souhaits: {debugInfo.wishesCount}</p>
              <p>A des données: {debugInfo.hasData ? 'Oui' : 'Non'}</p>
              {debugInfo.error && (
                <p className="text-red-600">Erreur: {JSON.stringify(debugInfo.error)}</p>
              )}
            </div>
          </div>
        )}
        
        {wishes.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-600 mb-4">Aucun souhait pour le moment</h2>
            <p className="text-gray-500 mb-6">
              {debugInfo?.error 
                ? "Il y a eu une erreur lors du chargement des souhaits. Vérifiez les informations de diagnostic ci-dessus."
                : "Commencez par créer votre premier souhait"
              }
            </p>
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
