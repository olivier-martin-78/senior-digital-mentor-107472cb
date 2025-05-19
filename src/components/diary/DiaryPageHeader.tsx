
import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DiaryPageHeaderProps {
  title: string;
}

const DiaryPageHeader: React.FC<DiaryPageHeaderProps> = ({ title }) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-serif text-tranches-charcoal">{title}</h1>
      <Link to="/diary/new">
        <Button className="bg-tranches-sage hover:bg-tranches-sage/90">
          <Plus className="mr-2 h-4 w-4" /> Nouvelle entrée
        </Button>
      </Link>
    </div>
  );
};

export default DiaryPageHeader;
