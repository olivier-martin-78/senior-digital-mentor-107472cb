
import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import InvitationGroups, { InvitationGroupsRef } from '@/components/admin/InvitationGroups';
import ProcessPendingInvitations from '@/components/admin/ProcessPendingInvitations';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

const AdminInvitationGroups = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const invitationGroupsRef = useRef<InvitationGroupsRef>(null);

  // Vérifier les permissions admin
  React.useEffect(() => {
    if (!hasRole('admin')) {
      navigate('/unauthorized');
      return;
    }
  }, [hasRole, navigate]);

  const handleInvitationsProcessed = () => {
    // Recharger les groupes après traitement des invitations
    if (invitationGroupsRef.current) {
      invitationGroupsRef.current.loadGroups();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mr-4"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Retour
            </Button>
            <h1 className="text-3xl font-serif text-tranches-charcoal">
              Gestion des groupes d'invitation
            </h1>
          </div>
        </div>
        
        <div className="mb-6">
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
