
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

const ProfessionalSection = () => {
  return (
    <section className="py-16 bg-tranches-sage/20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Calendar className="w-16 h-16 text-tranches-dustyblue mx-auto mb-6" />
          <h2 className="text-3xl font-serif text-tranches-charcoal mb-6">
            Pour les professionnels : Module auxiliaires de vie & aides à domicile
          </h2>
          <p className="text-lg text-tranches-charcoal/80 mb-8">
            Un outil de coordination professionnel intégré : planification, comptes-rendus, 
            facturation. Simplifiez la communication et valorisez votre rôle auprès des familles. Proposez de nouvelles activités engageantes pendant vos interventions.
          </p>
          <Button variant="outline" className="border-tranches-dustyblue text-tranches-charcoal">
            En savoir plus sur le module pro
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ProfessionalSection;
