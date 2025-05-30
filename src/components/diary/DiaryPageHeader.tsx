
import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DiaryPageHeaderProps {
  entriesCount: number;
}

const DiaryPageHeader: React.FC<DiaryPageHeaderProps> = ({ entriesCount }) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h2 className="text-xl font-medium text-tranches-charcoal mb-2">
          {entriesCount === 0 ? 'Aucune entrée' : `${entriesCount} entrée${entriesCount > 1 ? 's' : ''}`}
        </h2>
      </div>
      <Link to="/diary/new">
        <Button className="bg-tranches-sage hover:bg-tranches-sage/90">
          <Plus className="mr-2 h-4 w-4" /> Nouvelle entrée
        </Button>
      </Link>
    </div>
  );
};

export default DiaryPageHeader;
