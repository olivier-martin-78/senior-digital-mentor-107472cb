
import React from 'react';

interface ReportSectionProps {
  title: string;
  data: string[] | string;
  otherData?: string;
  detailsData?: string;
  comments?: string;
}

export const ReportSection: React.FC<ReportSectionProps> = ({
  title,
  data,
  otherData,
  detailsData,
  comments
}) => {
  const formatArrayToText = (array: string[] = []) => {
    return array.length > 0 ? array.join(', ') : 'Aucun';
  };

  const displayData = Array.isArray(data) ? formatArrayToText(data) : (data || 'Non renseigné');

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">{title}</h3>
      <div className="bg-gray-50 p-3 rounded-md">
        <p>{displayData}</p>
        {otherData && (
          <p className="mt-2"><strong>Autres :</strong> {otherData}</p>
        )}
        {detailsData && (
          <p className="mt-2"><strong>Détails :</strong> {detailsData}</p>
        )}
        {comments && (
          <p className="mt-2"><strong>Commentaires :</strong> {comments}</p>
        )}
      </div>
    </div>
  );
};
