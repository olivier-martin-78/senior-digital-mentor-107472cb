r
import React from 'react';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
        style={{ 
          backgroundImage: "url('/lovable-uploads/268baaf6-cc72-4fd0-b786-6c48d7ee83bc.png')",
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
      </div>
      
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-semibold text-white mb-4">
            Tranches de vie
          </h1>
          <p className="text-xl md:text-2xl text-white mb-8">
            Revisiter ses souvenirs pour les revivre une fois encore
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-tranches-charcoal hover:bg-tranches-cream">
              Je veux aider Tranches de vie
            </Button>
            <Button size="lg" className="bg-tranches-charcoal text-white hover:bg-tranches-warmgray">
              Je veux revivre un souvenir
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
