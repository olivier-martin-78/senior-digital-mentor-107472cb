import React from 'react';
import { MiniSiteForm } from '@/components/mini-site/MiniSiteForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Globe2 } from 'lucide-react';

interface MiniSiteManagerProps {
  userId: string;
  userName: string;
}

export const MiniSiteManager: React.FC<MiniSiteManagerProps> = ({ userId, userName }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Globe2 className="w-4 h-4 mr-2" />
          Mini-site
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Gérer le mini-site de {userName}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <MiniSiteForm userId={userId} />
        </div>
      </DialogContent>
    </Dialog>
  );
};