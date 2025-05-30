
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, LogOut } from 'lucide-react';
import { useImpersonationContext } from '@/contexts/ImpersonationContext';

export const ImpersonationBanner: React.FC = () => {
  const { isImpersonating, impersonatedUser, stopImpersonation } = useImpersonationContext();

  if (!isImpersonating || !impersonatedUser) {
    return null;
  }

  return (
    <div className="bg-orange-100 border-orange-500 border-l-4 p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
          <div>
            <p className="text-sm font-medium text-orange-800">
              Mode impersonnation activé
            </p>
            <p className="text-sm text-orange-700">
              Vous naviguez en tant que : <strong>{impersonatedUser.display_name || impersonatedUser.email}</strong>
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={stopImpersonation}
          className="text-orange-700 border-orange-300 hover:bg-orange-200"
        >
          <LogOut className="h-4 w-4 mr-1" />
          Arrêter l'impersonnation
        </Button>
      </div>
    </div>
  );
};

export default ImpersonationBanner;
