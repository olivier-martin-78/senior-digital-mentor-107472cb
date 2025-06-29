
import React from 'react';
import PermissionsDiagnosticTool from '@/components/admin/PermissionsDiagnosticTool';

const AdminPermissionsDiagnostic = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-serif text-tranches-charcoal mb-2">
            Diagnostic des permissions
          </h1>
          <p className="text-gray-600">
            Outil pour diagnostiquer et corriger les problèmes d'accès aux contenus.
          </p>
        </div>
        
        <div className="flex justify-center">
          <PermissionsDiagnosticTool />
        </div>
      </div>
    </div>
  );
};

export default AdminPermissionsDiagnostic;
