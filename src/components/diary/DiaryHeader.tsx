
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DiaryHeaderProps {
  entryId?: string;
  onDelete?: () => void;
  canEdit?: boolean;
}

const DiaryHeader: React.FC<DiaryHeaderProps> = ({ entryId, onDelete, canEdit = true }) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between mb-8">
      <Button 
        variant="outline"
        onClick={() => navigate('/diary')}
        className="mr-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Retour au journal
      </Button>
      
      {entryId && canEdit && (
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => navigate(`/diary/edit/${entryId}`)}
          >
            <Edit3 className="mr-2 h-4 w-4" /> Modifier
          </Button>
          
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer cette entrée de journal ? 
                    Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
    </div>
  );
};

export default DiaryHeader;
