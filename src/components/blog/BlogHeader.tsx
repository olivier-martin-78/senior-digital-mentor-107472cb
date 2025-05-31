
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { BlogAlbum } from '@/types/supabase';
import InviteUserDialog from '@/components/InviteUserDialog';
import { useAuth } from '@/contexts/AuthContext';

interface BlogHeaderProps {
  albums: BlogAlbum[];
  hasCreatePermission: boolean;
}

const BlogHeader: React.FC<BlogHeaderProps> = ({ albums, hasCreatePermission }) => {
  const { hasRole } = useAuth();
  const canInvite = hasRole('editor') || hasRole('admin');

  return (
    <div className="flex justify-between items-center mb-8">
      <div></div>
      <div className="flex gap-3">
        {canInvite && <InviteUserDialog />}
        {hasCreatePermission && (
          <Button asChild className="bg-tranches-sage hover:bg-tranches-sage/90">
            <Link to="/blog/new">
              <PlusCircle className="mr-2 h-5 w-5" />
              Nouvel article
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default BlogHeader;
