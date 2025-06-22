
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import InvitationGroups from '@/components/admin/InvitationGroups';

const MyInvitationGroups = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mes groupes d'invitation</h1>
        <InvitationGroups userId={user.id} />
      </div>
    </div>
  );
};

export default MyInvitationGroups;
