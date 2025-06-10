
import React from 'react';
import { Book, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const EmptyDiary: React.FC = () => {
  const { hasRole } = useAuth();
  const isReader = hasRole('reader');

  console.log('📖 EmptyDiary - Vérification rôle reader:', {
    isReader,
    hasReaderRole: hasRole('reader')
  });

  return (
    <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
      <Book className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900">
        {isReader ? 'Aucune entrée de journal' : 'Commencez votre journal'}
      </h3>
      <p className="mt-2 text-gray-500">
        {isReader 
          ? 'Aucune entrée de journal disponible à consulter pour le moment.'
          : 'Vous n\'avez pas encore d\'entrées dans votre journal. Créez votre première entrée pour commencer à documenter votre vie quotidienne.'
        }
      </p>
      {!isReader && (
        <Link to="/diary/new" className="mt-4 inline-block">
          <Button className="bg-tranches-sage hover:bg-tranches-sage/90">
            <Plus className="mr-2 h-4 w-4" /> Créer ma première entrée
          </Button>
        </Link>
      )}
    </div>
  );
};

export default EmptyDiary;
