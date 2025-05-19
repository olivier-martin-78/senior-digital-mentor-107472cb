
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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
} from "@/components/ui/alert-dialog";

interface DiaryHeaderProps {
  entryId: string;
  onDelete: () => Promise<void>;
}

const DiaryHeader: React.FC<DiaryHeaderProps> = ({ entryId, onDelete }) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center justify-between mb-8">
      <Button 
        variant="outline"
        onClick={() => navigate('/diary')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Retour
      </Button>
      <div className="flex space-x-2">
        <Link to={`/diary/edit/${entryId}`}>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" /> Modifier
          </Button>
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Supprimer
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action supprimera définitivement cette entrée de journal et ne peut pas être annulée.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Supprimer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default DiaryHeader;
