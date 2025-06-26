
import React from 'react';
import { User } from 'lucide-react';

interface GeneralInfoSectionProps {
  report: any;
}

export const GeneralInfoSection: React.FC<GeneralInfoSectionProps> = ({ report }) => {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold flex items-center gap-2">
        <User className="h-4 w-4" />
        Informations générales
      </h3>
      <div className="bg-gray-50 p-3 rounded-md space-y-1">
        <p><strong>Patient :</strong> {report.patient_name}</p>
        <p><strong>Auxiliaire :</strong> {report.auxiliary_name}</p>
        <p><strong>Date :</strong> {new Date(report.date).toLocaleDateString()}</p>
        {report.start_time && report.end_time && (
          <p><strong>Horaires :</strong> {report.start_time} - {report.end_time}</p>
        )}
        {report.hourly_rate && (
          <p><strong>Taux horaire :</strong> {report.hourly_rate}€</p>
        )}
      </div>
    </div>
  );
};
