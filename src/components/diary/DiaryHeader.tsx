
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import InviteUserDialog from '@/components/InviteUserDialog';
import { useGroupPermissions } from '@/hooks/useGroupPermissions';

const DiaryHeader = () => {
  const { isInvitedUser } = useGroupPermissions();

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
      <h1 className="text-3xl font-serif text-tranches-charcoal">Mon Journal</h1>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
        {!isInvitedUser && (
          <div className="w-full sm:w-auto">
            <InviteUserDialog />
          </div>
        )}
        <Button asChild className="bg-black hover:bg-black/90 text-white w-full sm:w-auto">
          <Link to="/diary/new">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle entrée
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default DiaryHeader;
