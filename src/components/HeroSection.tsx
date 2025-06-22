
import React from 'react';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
        style={{ 
          backgroundImage: "url('/lovable-uploads/268baaf6-cc72-4fd0-b786-6c48d7ee83bc11.png')",
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
      </div>
      
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4 pt-16">
        <div className="max-w-3xl">
          <p className="text-xl md:text-2xl text-white mb-8">
            Offrez-leur le digital, ils vous offriront leurs plus belles histoires.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-tranches-charcoal hover:bg-tranches-cream" asChild>
              <a href="/auth">
                Partager mes souvenirs<br/>et mes photos sur un blog
              </a>
            </Button>
            <Button size="lg" className="bg-tranches-charcoal text-white hover:bg-tranches-warmgray" asChild>
              <a href="/auth">
                Laissez-vous surprendre par ce que l'IA<br/>peut apporter à votre quotidien.
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
