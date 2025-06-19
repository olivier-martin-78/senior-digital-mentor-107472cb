
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
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DiaryHeaderProps {
  entryId?: string;
  onDelete?: () => void;
  canEdit?: boolean;
  authorName?: string;
  createdAt?: string;
}

const DiaryHeader: React.FC<DiaryHeaderProps> = ({ 
  entryId, 
  onDelete, 
  canEdit = true,
  authorName,
  createdAt
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <Button 
        variant="outline"
        onClick={() => navigate('/diary')}
        className="w-full sm:w-auto"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Retour au journal
      </Button>
      
      {entryId && canEdit && (
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            variant="outline"
            onClick={() => navigate(`/diary/edit/${entryId}`)}
            className="w-full sm:w-auto"
          >
            <Edit3 className="mr-2 h-4 w-4" /> Modifier
          </Button>
          
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
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
      
      {/* Informations d'auteur et de création sous les boutons */}
      {(authorName || createdAt) && (
        <div className="mt-4 sm:mt-2 text-sm text-gray-600 w-full sm:w-auto text-center sm:text-right">
          {authorName && (
            <div className="font-medium">
              Créé par {authorName}
            </div>
          )}
          {createdAt && (
            <div className="text-xs text-gray-500 mt-1">
              {format(new Date(createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiaryHeader;
