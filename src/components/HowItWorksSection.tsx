
import React from 'react';
import { Mail, MapPin, Video } from 'lucide-react';

const HowItWorksSection = () => {
  const steps = [
    {
      icon: <Mail className="w-12 h-12 text-tranches-charcoal" />,
      title: "La demande",
      description: "Une personne âgée ou un proche exprime un souhait : \"J'aimerais revoir cette amie\", \"Revenir là où j'ai grandi\", \"Laisser un message à mon petit-fils\"."
    },
    {
      icon: <MapPin className="w-12 h-12 text-tranches-charcoal" />,
      title: "La mission",
      description: "Nous organisons une \"tranche de vie\" : une micro-expérience personnalisée, douce et humaine, grâce à notre accompagnement."
    },
    {
      icon: <Video className="w-12 h-12 text-tranches-charcoal" />,
      title: "Le souvenir",
      description: "Nous captons (parfois) l'instant en photo, audio ou vidéo, et l'offrons comme trace vivante de l'expérience."
    }
  ];

  return (
    <section className="section bg-tranches-beige">
      <div className="container">
        <h2 className="text-3xl md:text-4xl font-serif text-center mb-12 text-tranches-charcoal animate-on-scroll">
          Comment ça fonctionne ?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm animate-on-scroll">
              <div className="p-3 bg-tranches-sage/30 rounded-full mb-4">
                {step.icon}
              </div>
              <h3 className="text-xl font-serif mb-3 text-tranches-charcoal">{step.title}</h3>
              <p className="text-tranches-charcoal/80">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
