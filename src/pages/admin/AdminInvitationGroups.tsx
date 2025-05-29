
import React from 'react';
import Header from '@/components/Header';
import InvitationGroups from '@/components/admin/InvitationGroups';

const AdminInvitationGroups = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-serif text-tranches-charcoal mb-2">
            Gestion des groupes d'invitation
          </h1>
          <p className="text-gray-600">
            Gérez les groupes d'invitation et leurs membres. Les invités héritent automatiquement 
            des permissions de la personne qui les a invités avec un accès en lecture seule.
          </p>
        </div>
        
        <InvitationGroups />
      </div>
    </div>
  );
};

export default AdminInvitationGroups;
