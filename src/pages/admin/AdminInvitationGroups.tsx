
import React, { useRef } from 'react';
import InvitationGroups, { InvitationGroupsRef } from '@/components/admin/InvitationGroups';
import ProcessPendingInvitations from '@/components/admin/ProcessPendingInvitations';

const AdminInvitationGroups = () => {
  const invitationGroupsRef = useRef<InvitationGroupsRef>(null);

  const handleInvitationsProcessed = () => {
    // Recharger les groupes après traitement des invitations
    if (invitationGroupsRef.current) {
      invitationGroupsRef.current.loadGroups();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
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
        
        <div className="space-y-6">
          <ProcessPendingInvitations onInvitationsProcessed={handleInvitationsProcessed} />
          <InvitationGroups 
            ref={invitationGroupsRef}
            onDataChange={handleInvitationsProcessed}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminInvitationGroups;
