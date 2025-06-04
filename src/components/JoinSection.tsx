
import React from 'react';
import { Button } from '@/components/ui/button';

const JoinSection = () => {
  return (
    <section className="section bg-tranches-sage/30">
      <div className="container">
        <h2 className="text-3xl md:text-4xl font-serif text-center mb-8 text-tranches-charcoal animate-on-scroll">
          Rejoindre le mouvement
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10 animate-on-scroll">
          <Button size="lg" className="bg-tranches-dustyblue text-white hover:bg-tranches-dustyblue/80">
            Senior ou un proche aidant ? Contactez-nous !
          </Button>
          <Button size="lg" variant="outline" className="border-tranches-dustyblue text-tranches-charcoal hover:bg-tranches-dustyblue/10">
            Je veux devenir Mentor Digital
          </Button>
        </div>
        
        <div className="max-w-2xl mx-auto text-center animate-on-scroll">
          <p className="text-lg text-tranches-charcoal/90 mb-6">
            Vous voulez offrir un moment de bonheur simple à quelqu'un qui a tant donné ?
            Vous souhaitez devenir Mentors digitaux ? Nous mettons à otre disposition application .
          </p>
        </div>
      </div>
    </section>
  );
};

export default JoinSection;
