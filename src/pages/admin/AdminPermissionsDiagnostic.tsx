
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Header from '@/components/Header';

const AdminPermissionsDiagnostic = () => {
  const { hasRole, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
    </div>;
  }

  if (!hasRole('admin')) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-16">
        <div className="container mx-auto py-8 px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Système de permissions simplifié
            </h1>
            <p className="text-gray-600">
              Le système de permissions a été simplifié et fonctionne maintenant automatiquement via les groupes et les politiques RLS.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Nouvelles règles d'accès automatiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="p-4 border rounded bg-green-50">
                  <h4 className="font-medium text-green-900 mb-2">✅ Contenu personnel</h4>
                  <p className="text-green-700 text-sm">
                    Chaque utilisateur peut voir, modifier et supprimer son propre contenu (blog, journal, histoire de vie, souhaits).
                  </p>
                </div>
                
                <div className="p-4 border rounded bg-blue-50">
                  <h4 className="font-medium text-blue-900 mb-2">👥 Partage via groupes</h4>
                  <p className="text-blue-700 text-sm">
                    Les utilisateurs d'un même groupe peuvent voir le contenu des autres membres (lecture seule).
                    L'appartenance aux groupes se fait automatiquement lors de l'acceptation d'une invitation.
                  </p>
                </div>
                
                <div className="p-4 border rounded bg-purple-50">
                  <h4 className="font-medium text-purple-900 mb-2">🔒 Email confirmé requis</h4>
                  <p className="text-purple-700 text-sm">
                    Seuls les utilisateurs avec email confirmé peuvent créer du contenu et laisser des commentaires.
                  </p>
                </div>
                
                <div className="p-4 border rounded bg-orange-50">
                  <h4 className="font-medium text-orange-900 mb-2">🛡️ Contenu publié</h4>
                  <p className="text-orange-700 text-sm">
                    Le contenu marqué comme "publié" est visible par tous les utilisateurs authentifiés.
                    Les brouillons ne sont visibles que par l'auteur et les membres du même groupe.
                  </p>
                </div>
                
                <div className="p-4 border rounded bg-red-50">
                  <h4 className="font-medium text-red-900 mb-2">👑 Accès administrateur</h4>
                  <p className="text-red-700 text-sm">
                    Les administrateurs ont accès à tout le contenu, publié ou non.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 p-4 border-2 border-gray-200 rounded bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-2">ℹ️ Note importante</h4>
                <p className="text-gray-700 text-sm">
                  Ces règles fonctionnent automatiquement via les politiques de sécurité au niveau de la base de données (RLS).
                  Aucune intervention manuelle n'est nécessaire pour gérer les permissions.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPermissionsDiagnostic;
