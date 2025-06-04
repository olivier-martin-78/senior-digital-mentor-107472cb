
import React from 'react';
import { Mail, MapPin, Video } from 'lucide-react';

const HowItWorksSection = () => {
  const steps = [
    {
      icon: <Mail className="w-12 h-12 text-tranches-charcoal" />,
      title: "La demande",
      description: "Une personne âgée ou l’un de ses proches formule une demande : \"J’aimerais aider mon père à gagner en autonomie avec les outils numériques, car son isolement ne fait que s’accentuer au fil des années."
    },
    {
      icon: <MapPin className="w-12 h-12 text-tranches-charcoal" />,
      title: "Notre mission",
      description: "Nous proposons des mini-séances de formation directement à domicile, avec un apprentissage adapté à son rythme. Nos sessions couvrent les applications numériques les plus utilisées, afin de faciliter la communication avec ses proches en toute simplicité."
    },
    {
      icon: <Video className="w-12 h-12 text-tranches-charcoal" />,
      title: "Le suivi",
      description: "Ensemble avec le demandeur et la personne accompagnée, nous faisons régulièrement le point sur les progrès réalisés. Cela nous permet d’adapter l’accompagnement au plus près de ses besoins et de ses progrès."
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
