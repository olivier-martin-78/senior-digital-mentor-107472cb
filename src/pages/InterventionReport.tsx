
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import InterventionReportForm from '@/components/intervention/InterventionReportForm';
import InterventionReportView from '@/components/intervention/InterventionReportView';

const InterventionReport = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  if (!session) {
    navigate('/auth');
    return null;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const reportId = urlParams.get('report_id');
  const isEditMode = urlParams.get('edit') === 'true';

  // Si on a un report_id et qu'on n'est pas en mode édition, afficher la vue
  if (reportId && !isEditMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <InterventionReportView />
        </div>
      </div>
    );
  }

  // Sinon afficher le formulaire (création ou édition)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <InterventionReportForm />
      </div>
    </div>
  );
};

export default InterventionReport;
