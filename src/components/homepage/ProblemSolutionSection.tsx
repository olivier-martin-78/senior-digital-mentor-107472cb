
import React from 'react';

const ProblemSolutionSection = () => {
  return (
    <section className="py-16 bg-tranches-cream">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-tranches-charcoal mb-8">
            Vous ressentez parfois...
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-gray-100 rounded-lg">
              <p className="text-tranches-charcoal font-medium">😔 De la solitude</p>
            </div>
            <div className="p-6 bg-gray-100 rounded-lg">
              <p className="text-tranches-charcoal font-medium">🧠 Une baisse de motivation</p>
            </div>
            <div className="p-6 bg-gray-100 rounded-lg">
              <p className="text-tranches-charcoal font-medium">💭 L'envie de partager vos souvenirs</p>
            </div>
          </div>
          <h3 className="text-2xl md:text-3xl font-serif text-tranches-dustyblue mb-6">
            CaprIA transforme votre quotidien !
          </h3>
          <p className="text-lg text-tranches-charcoal/80">
            Une application simple et bienveillante qui vous redonne de l'énergie, 
            stimule votre esprit et vous reconnecte avec vos proches.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolutionSection;
