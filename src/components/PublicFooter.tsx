
import React from 'react';
import { Mail, Phone } from 'lucide-react';

const PublicFooter = () => {
  return (
    <footer className="py-12 bg-tranches-beige border-t border-tranches-sage/50">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-start">
          <div className="mb-8 md:mb-0">
            <h3 className="text-2xl font-serif text-tranches-charcoal mb-2">Senior Digital Mentor</h3>
            <p className="text-tranches-warmgray">Offrez-leur le digital, ils vous offriront leurs plus belles histoires.</p>
          </div>
          
          <div className="w-full md:w-1/2 lg:w-2/5">
            <h4 className="text-lg font-serif text-tranches-charcoal mb-3">Contactez-nous</h4>
            <div className="space-y-3 text-tranches-charcoal/80">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>contact@seniordigitalmentor.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>01 23 45 67 89</span>
              </div>
              <p className="text-sm">
                Pour nous envoyer un message détaillé avec pièce jointe, 
                <a href="/auth" className="text-tranches-dustyblue hover:underline ml-1">
                  créez un compte gratuitement
                </a>
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-10 pt-6 border-t border-tranches-sage/30 text-center text-sm text-tranches-warmgray">
          <p>© {new Date().getFullYear()} Senior Digital Mentor. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
