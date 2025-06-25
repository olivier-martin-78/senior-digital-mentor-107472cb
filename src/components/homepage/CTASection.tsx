
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-tranches-dustyblue to-tranches-sage text-white">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-serif mb-6">
            Commencez votre nouvelle vie dès aujourd'hui
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Rejoignez les dizaines de seniors joyeux qui ont déjà transformé leur quotidien avec CaprIA.
          </p>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 mb-8">
            <h3 className="text-2xl font-serif mb-4">🎁 Offre de lancement – Plan Senior</h3>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-4">
              <span className="text-3xl font-bold">4,90€/mois</span>
              <span className="text-lg opacity-75 line-through">9,80€/mois</span>
              <span className="bg-yellow-400 text-tranches-charcoal px-3 py-1 rounded-full text-sm font-medium">
                -50% pendant 1 an
              </span>
            </div>
            <p className="text-sm opacity-75">Puis 9,80€/mois • Résiliable à tout moment</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/subscription">
              <Button size="lg" className="bg-white text-tranches-dustyblue hover:bg-gray-100 text-lg px-8 py-4">
                Essayer 15 jours gratuitement
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-4 bg-tranches-charcoal">
              Programmer une démonstration
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-8 text-sm opacity-75">
            <span>✓ Sans engagement</span>
            <span>✓ Support 6j/7</span>
            <span>✓ Données sécurisées</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
