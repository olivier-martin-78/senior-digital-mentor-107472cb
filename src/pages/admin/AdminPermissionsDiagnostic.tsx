
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import UserPermissionsAnalyzer from '@/components/admin/UserPermissionsAnalyzer';
import PermissionsSyncControls from '@/components/admin/PermissionsSyncControls';

const AdminPermissionsDiagnostic = () => {
  const { hasRole, isLoading } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
    </div>;
  }

  if (!hasRole('admin')) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Diagnostic des permissions
        </h1>
        <p className="text-gray-600">
          Analysez et corrigez les permissions des utilisateurs invités
        </p>
      </div>

      <div className="grid gap-6">
        {/* Contrôles de synchronisation globaux */}
        <Card>
          <CardHeader>
            <CardTitle>Synchronisation globale</CardTitle>
          </CardHeader>
          <CardContent>
            <PermissionsSyncControls />
          </CardContent>
        </Card>

        {/* Analyseur de permissions utilisateur */}
        <Card>
          <CardHeader>
            <CardTitle>Analyse des permissions par utilisateur</CardTitle>
          </CardHeader>
          <CardContent>
            <UserPermissionsAnalyzer 
              selectedUserId={selectedUserId}
              onUserChange={setSelectedUserId}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPermissionsDiagnostic;
