
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import InterventionReportForm from '@/components/intervention/InterventionReportForm';
import InterventionReportView from '@/components/intervention/InterventionReportView';

const InterventionReport = () => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();

  // Afficher un loader pendant le chargement de l'authentification
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Rediriger seulement après avoir vérifié que l'authentification est complètement chargée
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
