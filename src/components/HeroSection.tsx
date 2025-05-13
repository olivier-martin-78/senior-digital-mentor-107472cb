
import React from 'react';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2240&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
      </div>
      
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-semibold text-white mb-4">
            Tranches de vie
          </h1>
          <p className="text-xl md:text-2xl text-white mb-8">
            Faire revivre nos souvenirs, une tranche de vie à la fois.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-tranches-charcoal hover:bg-tranches-cream">
              Je veux offrir une tranche de vie
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/20">
              Je veux revivre un moment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
