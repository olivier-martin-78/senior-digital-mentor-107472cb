import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCanCreateActivities } from '@/hooks/useCanCreateActivities';
import { Loader2 } from 'lucide-react';

const ActivityCreatorRoute: React.FC = () => {
  const { user } = useAuth();
  const { canCreate, loading } = useCanCreateActivities();

  console.log('🔍 ActivityCreatorRoute: État actuel', { user: user?.id, canCreate, loading });

  if (loading) {
    console.log('⏳ ActivityCreatorRoute: Chargement en cours...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-tranches-sage" />
          <p className="text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('❌ ActivityCreatorRoute: Pas d\'utilisateur - redirection vers auth');
    return <Navigate to="/auth" replace />;
  }

  if (!canCreate) {
    console.log('❌ ActivityCreatorRoute: Permissions insuffisantes - redirection vers unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('✅ ActivityCreatorRoute: Accès autorisé');
  return <Outlet />;
};

export default ActivityCreatorRoute;