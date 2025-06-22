
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQSection = () => {
  return (
    <section id="faq" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-serif text-tranches-charcoal mb-12 text-center">
          ❓ FAQ – Questions fréquentes
        </h2>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left">
                Les activités sont-elles accessibles à tous les niveaux ?
              </AccordionTrigger>
              <AccordionContent>
                Oui ! Chaque atelier est conçu pour s'adapter au rythme, aux capacités physiques et cognitives de chaque personne. Aucune compétence préalable n'est requise.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left">
                Proposez-vous des activités à domicile ?
              </AccordionTrigger>
              <AccordionContent>
                Oui, nos activités sont organisée directement à domicile, en résidence seniors.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left">
                Et si mon parent est en perte d'autonomie ?
              </AccordionTrigger>
              <AccordionContent>
                Nous adaptons nos propositions en douceur. Un entretien préalable permet d'identifier les besoins et d'évaluer ce qui est réaliste, motivant et bénéfique pour lui/elle.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left">
                Combien cela coûte-t-il ?
              </AccordionTrigger>
              <AccordionContent>
                Les tarifs varient selon la fréquence et la distance (individuel, à domicile ou en extérieur). Des forfaits mensuels d'au moins 2 heures consécutives sont proposés.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left">
                Est-ce que les familles peuvent participer ?
              </AccordionTrigger>
              <AccordionContent>
                Absolument ! Certaines activités sont même conçues pour renforcer les liens familiaux et intergénérationnels. Et nous favorisons une communication régulière avec les proches.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
