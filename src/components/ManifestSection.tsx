
import React from 'react';
import { Button } from '@/components/ui/button';

const ManifestSection = () => {
  return (
    <section className="section bg-tranches-cream">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center animate-on-scroll">
          <h2 className="text-3xl md:text-4xl font-serif mb-8 text-tranches-charcoal">
            Ce en quoi nous croyons
          </h2>
          
          <div className="space-y-4 text-xl italic text-tranches-charcoal/90 mb-8">
            <p>Nous croyons qu'un souvenir peut réveiller un sourire.</p>
            <p>Qu'une parole peut réparer un silence.</p>
            <p>Et qu'il n'est jamais trop tard pour ressentir, dire, aimer.</p>
          </div>
          
          <Button variant="link" className="text-tranches-dustyblue hover:text-tranches-dustyblue/80">
            Lire notre manifeste complet
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ManifestSection;
