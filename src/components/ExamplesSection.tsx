import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const ExamplesSection = () => {
  const examples = [
    {
      text: "Louis, 83 ans, a pu retourner dans le village de son enfance après avoir exprimé un souhait sur l'application.",
      image: "/lovable-uploads/8ac879f0-eb39-4064-9a78-17e88d05dcb2.png"
    },
    {
      text: "Suzanne a invité sa petite-fille à découvrir son journal digital. Depuis, elle est ravie de pouvoir échanger plus simplement et spontanément avec elle.",
      image: "/lovable-uploads/2164fbcc-360e-4fdc-99c0-3aba13d45ce3.png"
    },
    {
      text: "Raymonde a partagé l'histoire de sa vie avec ses proches. En retour, elle a reçu de nombreux messages remplis de gratitude, et parfois des questions pour en savoir un peu plus sur certains moments marquants de son parcours.",
      image: "/lovable-uploads/efd23d12-e834-4877-95dc-3ef3f17a3949.png"
    }
  ];

  return (
    <section className="section bg-white">
      <div className="container">
        <h2 className="text-3xl md:text-4xl font-serif text-center mb-12 text-tranches-charcoal animate-on-scroll">
          Exemples d'activités réalisées avec nous
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {examples.map((example, index) => (
            <Card key={index} className="overflow-hidden border-none shadow-md animate-on-scroll">
              <div className="h-48 bg-tranches-sage/30 flex items-center justify-center">
                <img 
                  src={example.image} 
                  alt="Exemple de tranche de vie" 
                  className="h-full w-full object-cover"
                />
              </div>
              <CardContent className="p-6 bg-white">
                <p className="text-tranches-charcoal/90 text-lg italic">"{example.text}"</p>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
};

export default ExamplesSection;
