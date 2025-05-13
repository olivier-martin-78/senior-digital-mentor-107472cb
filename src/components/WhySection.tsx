
import React from 'react';

const WhySection = () => {
  return (
    <section className="section bg-tranches-cream">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center animate-on-scroll">
          <h2 className="text-3xl md:text-4xl font-serif mb-6 text-tranches-charcoal">
            Il n'est jamais trop tard pour revivre un souvenir.
          </h2>
          <div className="space-y-4 text-lg text-tranches-charcoal/90">
            <p>
              Des milliers de personnes âgées gardent en elles des souvenirs précieux, des émotions enfouies, des choses qu'elles n'osent plus demander.
            </p>
            <p>
              Chez Tranches de vie, nous croyons que chaque histoire mérite d'être réactivée, racontée, partagée.
            </p>
            <p className="mt-6">
              Nous proposons aux aînés de vivre ou revivre des moments profonds :
              retrouvailles, témoignages, lieux de mémoire, gestes d'affection, plats d'enfance, lettres de transmission…
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhySection;
