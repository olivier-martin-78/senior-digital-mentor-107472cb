
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface PrivateNotesSectionProps {
  notes: string | null;
  isLocked: boolean | null;
}

const PrivateNotesSection: React.FC<PrivateNotesSectionProps> = ({ notes, isLocked }) => {
  const [showPrivateNotes, setShowPrivateNotes] = useState(false);
  
  // Ne pas afficher la section si pas de notes
  if (!notes || notes.trim() === '') return null;
  
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-medium">Notes privées</h2>
        {isLocked && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowPrivateNotes(!showPrivateNotes)}
          >
            {showPrivateNotes ? (
              <><EyeOff className="h-4 w-4 mr-1" /> Masquer</>
            ) : (
              <><Eye className="h-4 w-4 mr-1" /> Afficher</>
            )}
          </Button>
        )}
      </div>
      
      {(!isLocked || showPrivateNotes) ? (
        <p className="whitespace-pre-line">{notes}</p>
      ) : (
        <div className="p-4 border border-dashed border-gray-300 rounded text-gray-400 text-center">
          Notes masquées
        </div>
      )}
    </section>
  );
};

export default PrivateNotesSection;
