
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

  // LOGS DIAGNOSTIC DÉTAILLÉS
  (() => {
    console.log('🚀 ===== WISHES COMPONENT - DÉBUT DIAGNOSTIC =====');
    console.log('🔐 État d\'authentification:', {
      hasSession: !!session,
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email
    });
  })();

  useEffect(() => {
    console.log('🔄 useEffect déclenché - Conditions:', {
      session: !!session,
      sessionId: session?.user?.id,
      shouldRedirect: !session
    });
    
    if (!session) {
      console.log('❌ Pas de session - Redirection vers /auth');
      navigate('/auth');
      return;
    }
    
    console.log('✅ Session validée - Lancement de fetchWishes');
    fetchWishes();
  }, [session, navigate]);

  const fetchWishes = async () => {
    console.log('📡 ===== DÉBUT FETCH WISHES =====');
    console.log('👤 Utilisateur actuel:', {
      user: !!user,
      userId: user?.id,
      userEmail: user?.email
    });
    
    if (!user) {
      console.log('❌ Pas d\'utilisateur - Arrêt de fetchWishes');
      return;
    }
    
    try {
      console.log('⏳ État loading activé');
      setLoading(true);
      console.log('🔧 Utilisation des politiques RLS ultra-simplifiées CORRIGÉES');
      
      console.log('📤 Lancement requête Supabase...');
      const { data, error } = await supabase
        .from('wish_posts')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📥 Réponse Supabase reçue:', {
        hasData: !!data,
        dataLength: data?.length || 0,
        hasError: !!error,
        errorMessage: error?.message || 'Aucune erreur'
      });

      if (error) {
        console.log('❌ Erreur Supabase détectée:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('✅ Données récupérées avec succès:', {
        nombre: data?.length || 0,
        premiersElements: data?.slice(0, 3).map(w => ({
          id: w.id,
          title: w.title,
          published: w.published
        })) || []
      });
      
      setWishes(data || []);
      
    } catch (error) {
      console.log('💥 ERREUR DANS fetchWishes:', {
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : 'Erreur inconnue',
        errorStack: error instanceof Error ? error.stack : 'Pas de stack',
        fullError: error
      });
    } finally {
      console.log('🏁 fetchWishes terminé - Désactivation loading');
      setLoading(false);
    }
    console.log('📡 ===== FIN FETCH WISHES =====');
  };

  // LOGS DIAGNOSTIC DU RENDU
  (() => {
    console.log('🎨 ===== DÉBUT RENDU COMPONENT =====');
    console.log('📊 État actuel du component:', {
      loading,
      wishesLength: wishes.length,
      wishesData: wishes
    });
  })();

  if (loading) {
    console.log('⏳ Affichage du spinner de chargement');
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  // LOGS POUR LA LOGIQUE D'AFFICHAGE
  (() => {
    console.log('🚦 Condition d\'affichage des souhaits:', {
      wishesLength: wishes.length,
      isEmpty: wishes.length === 0,
      shouldShowEmpty: wishes.length === 0,
      shouldShowGrid: wishes.length > 0
    });
  })();

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
        
        {(() => {
          console.log('🔍 Analyse du rendu final:', {
            isEmptyState: wishes.length === 0,
            shouldShowGrid: wishes.length > 0,
            wishesArray: wishes,
            renderingEmptyMessage: wishes.length === 0,
            renderingGrid: wishes.length > 0
          });
          return null;
        })()}

        {wishes.length === 0 ? (
          (() => {
            console.log('📭 Affichage du message "Aucun souhait"');
            return (
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
            );
          })()
        ) : (
          (() => {
            console.log('📋 Affichage de la grille des souhaits:', {
              nombre: wishes.length,
              souhaits: wishes.map(w => ({ id: w.id, title: w.title }))
            });
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishes.map((wish) => {
                  console.log('🎴 Rendu WishCard pour:', { id: wish.id, title: wish.title });
                  return <WishCard key={wish.id} wish={wish} />;
                })}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
};

export default Wishes;
