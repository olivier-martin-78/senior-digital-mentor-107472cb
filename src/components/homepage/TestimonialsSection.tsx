
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Marie, 86 ans",
      text: "Grâce à CaprIA, j'ai partagé l'histoire de ma vie au sein de mon cercle familial. J'ai reçu de nombreux messages remplis de gratitude, et des questions pour en savoir un peu plus sur certains faits marquants de mon parcours.",
      rating: 5,
      image: "/lovable-uploads/efd23d12-e834-4877-95dc-3ef3f17a3949.png"
    },
    {
      name: "Robert, 80 ans", 
      text: "Les exercices de gym douce et de yoga m'ont redonné confiance. Je me sens plus énergique qu'avant.",
      rating: 5,
      image: "/lovable-uploads/27aeb031-b6fb-4376-aaaf-3d6cfb399d90.png"
    },
    {
      name: "Suzanne, 72 ans",
      text: "Suzanne a invité sa petite-fille à découvrir son journal intime. Depuis, Suzanne est ravie de pouvoir échanger plus simplement et spontanément avec elle.",
      rating: 5,
      image: "/lovable-uploads/2164fbcc-360e-4fdc-99c0-3aba13d45ce3.png"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-serif text-center text-tranches-charcoal mb-16">
          Ils ont retrouvé le sourire avec CaprIA
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-none shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <div className="flex mb-2">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-tranches-dustyblue font-medium">{testimonial.name}</p>
                  </div>
                </div>
                <p className="text-tranches-charcoal/80 italic">"{testimonial.text}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
