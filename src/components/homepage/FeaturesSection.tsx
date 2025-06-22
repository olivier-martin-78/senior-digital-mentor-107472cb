
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Brain, Activity, Users, CheckCircle } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: <Users className="w-8 h-8 text-blue-400" />,
      title: "Lien social",
      description: "Blog, albums photo, souhaits partagés avec vos proches",
      benefits: ["Rompt l'isolement", "Renforce les liens familiaux", "Crée du partage"]
    },
    {
      icon: <Heart className="w-8 h-8 text-red-400" />,
      title: "Bien-être émotionnel",
      description: "Relaxation guidée, journal intime, récits de vie pour apaiser l'esprit",
      benefits: ["Réduit stress et anxiété", "Favorise l'introspection", "Préserve vos souvenirs"]
    },    
    {
      icon: <Brain className="w-8 h-8 text-purple-400" />,
      title: "Stimulation mentale",
      description: "Jeux de mémoire, casse-têtes, activités cognitives adaptées",
      benefits: ["Améliore la mémoire", "Renforce la concentration", "Maintient l'autonomie"]
    },    
    {
      icon: <Activity className="w-8 h-8 text-green-400" />,
      title: "Activités physiques",
      description: "Gym douce, yoga, exercices adaptés depuis chez vous",
      benefits: ["Améliore la circulation", "Réduit les chutes", "Libère les endorphines"]
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif text-tranches-charcoal mb-6">
            4 piliers pour votre bien-être
          </h2>
          <p className="text-xl text-tranches-charcoal/70 max-w-2xl mx-auto">
            Des activités pensées par des professionnels pour votre épanouissement personnel
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow border-none">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {feature.icon}
                  <h3 className="text-2xl font-serif text-tranches-charcoal ml-3">{feature.title}</h3>
                </div>
                <p className="text-tranches-charcoal/80 mb-6 text-lg">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center text-tranches-charcoal/70">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
