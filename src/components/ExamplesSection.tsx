
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const ExamplesSection = () => {
  const examples = [
    {
      text: "Louis, 83 ans, a pu retrouver le village de son enfance après 60 ans.",
      image: "/lovable-uploads/8ac879f0-eb39-4064-9a78-17e88d05dcb2.png"
    },
    {
      text: "Suzanne a laissé une lettre vocale à sa petite-fille qu'elle n'avait jamais rencontrée.",
      image: "/lovable-uploads/2164fbcc-360e-4fdc-99c0-3aba13d45ce3.png"
    },
    {
      text: "Raymonde a pu déguster à nouveau un couscous comme celui de sa mère, avec l'aide d'un chef bénévole.",
      image: "/placeholder.svg"
    }
  ];

  return (
    <section className="section bg-white">
      <div className="container">
        <h2 className="text-3xl md:text-4xl font-serif text-center mb-12 text-tranches-charcoal animate-on-scroll">
          Exemples de tranches de vie réalisées
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {examples.map((example, index) => (
            <Card key={index} className="overflow-hidden border-none shadow-md animate-on-scroll">
              <div className="h-48 bg-tranches-sage/30 flex items-center justify-center">
                <img 
                  src={example.image} 
                  alt="Exemple de tranche de vie" 
                  className="h-full w-full object-cover"
                  style={index === 0 || index === 1 ? {opacity: '1'} : {opacity: '0.7'}}
                />
              </div>
              <CardContent className="p-6 bg-white">
                <p className="text-tranches-charcoal/90 text-lg italic">"{example.text}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <p className="text-center mt-8 text-tranches-warmgray italic">
          (des témoignages photo/audio seront ajoutés prochainement)
        </p>
      </div>
    </section>
  );
};

export default ExamplesSection;
