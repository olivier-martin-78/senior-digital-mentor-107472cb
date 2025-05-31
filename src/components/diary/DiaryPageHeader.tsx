
import React from 'react';

interface DiaryPageHeaderProps {
  entriesCount: number;
}

const DiaryPageHeader: React.FC<DiaryPageHeaderProps> = ({ entriesCount }) => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-medium text-tranches-charcoal mb-2">
        {entriesCount === 0 ? 'Aucune entrée' : `${entriesCount} entrée${entriesCount > 1 ? 's' : ''}`}
      </h2>
    </div>
  );
};

export default DiaryPageHeader;
