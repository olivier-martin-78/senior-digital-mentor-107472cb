
import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

interface StoryHeaderProps {
  title: string;
  lastSaved: Date | null;
  isSaving: boolean;
  onSave: () => void;
}

export const StoryHeader: React.FC<StoryHeaderProps> = ({ 
  title, 
  lastSaved, 
  isSaving, 
  onSave 
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-serif font-medium text-tranches-charcoal">
          {title || "Mon histoire de vie"}
        </h2>
        <div className="text-sm text-gray-500 mt-1">
          {lastSaved ? (
            <span>Dernière sauvegarde: {format(new Date(lastSaved), 'dd MMMM yyyy à HH:mm', { locale: fr })}</span>
          ) : (
            <span>Modification en cours...</span>
          )}
        </div>
      </div>
      
      <Button onClick={onSave} disabled={isSaving}>
        {isSaving ? (
          <span className="flex items-center">
            <span className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-tranches-sage rounded-full"></span>
            Sauvegarde...
          </span>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </>
        )}
      </Button>
    </div>
  );
};

export default StoryHeader;
