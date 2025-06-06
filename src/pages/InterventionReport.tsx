
import React from 'react';
import Header from '@/components/Header';
import InterventionReportForm from '@/components/intervention/InterventionReportForm';

const InterventionReport = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-tranches-charcoal mb-2">
            Compte-rendu d'intervention
          </h1>
          <p className="text-tranches-warmgray">
            Formulaire pour documenter les interventions d'auxiliaire de vie
          </p>
        </div>
        
        <InterventionReportForm />
      </div>
    </div>
  );
};

export default InterventionReport;
