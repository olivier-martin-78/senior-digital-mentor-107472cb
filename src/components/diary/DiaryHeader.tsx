
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, Plus } from 'lucide-react';
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
  entriesCount?: number;
  entryId?: string;
  onDelete?: () => Promise<void>;
}

const DiaryHeader: React.FC<DiaryHeaderProps> = ({ entriesCount, entryId, onDelete }) => {
  const navigate = useNavigate();
  
  if (entryId && onDelete) {
    // Mode affichage d'une entrée spécifique
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
  }

  // Mode liste des entrées
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-2xl font-serif text-tranches-charcoal">
          Mes entrées de journal
        </h2>
        <p className="text-gray-600">
          {entriesCount || 0} entrée{(entriesCount || 0) > 1 ? 's' : ''} au total
        </p>
      </div>
      <Button asChild className="bg-tranches-sage hover:bg-tranches-sage/90">
        <Link to="/diary/new">
          <Plus className="mr-2 h-5 w-5" />
          Nouvelle entrée
        </Link>
      </Button>
    </div>
  );
};

export default DiaryHeader;
