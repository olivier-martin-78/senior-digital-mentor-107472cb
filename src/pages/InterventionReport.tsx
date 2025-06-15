
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import InterventionReportForm from '@/components/intervention/InterventionReportForm';
import InterventionReportView from '@/components/intervention/InterventionReportView';

const InterventionReport = () => {
  const [searchParams] = useSearchParams();
  const reportId = searchParams.get('report_id');
  const editMode = searchParams.get('edit') === 'true';
  
  // Si on a un reportId mais pas le mode edit, afficher en lecture
  const isViewMode = reportId && !editMode;

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-tranches-charcoal mb-2">
            {isViewMode ? 'Rapport d\'intervention' : 'Compte-rendu d\'intervention'}
          </h1>
          <p className="text-tranches-warmgray">
            {isViewMode 
              ? 'Consultation du rapport d\'intervention'
              : 'Formulaire pour documenter les interventions d\'auxiliaire de vie'
            }
          </p>
        </div>
        
        {isViewMode ? <InterventionReportView /> : <InterventionReportForm />}
      </div>
    </div>
  );
};

export default InterventionReport;
