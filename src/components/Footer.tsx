
import React from 'react';
import { Mail, Phone, User } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="py-12 bg-tranches-beige border-t border-tranches-sage/50">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start">
          <div className="mb-8 md:mb-0">
            <h3 className="text-2xl font-serif text-tranches-charcoal mb-2">Tranches de vie</h3>
            <p className="text-tranches-warmgray">Faire revivre nos souvenirs</p>
          </div>
          
          <div className="text-center md:text-right">
            <h4 className="text-lg font-serif text-tranches-charcoal mb-3">Contact</h4>
            <ul className="space-y-2">
              <li className="flex items-center justify-center md:justify-end text-tranches-charcoal/80">
                <User className="w-4 h-4 mr-2" />
                <span>Marie Durand</span>
              </li>
              <li className="flex items-center justify-center md:justify-end text-tranches-charcoal/80">
                <Mail className="w-4 h-4 mr-2" />
                <a href="mailto:marie.durand.14@gmail.com" className="hover:text-tranches-dustyblue">
                  marie.durand.14@gmail.com
                </a>
              </li>
              <li className="flex items-center justify-center md:justify-end text-tranches-charcoal/80">
                <Phone className="w-4 h-4 mr-2" />
                <a href="tel:0754661480" className="hover:text-tranches-dustyblue">
                  0754661480
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-10 pt-6 border-t border-tranches-sage/30 text-center text-sm text-tranches-warmgray">
          <p>© {new Date().getFullYear()} Tranches de vie. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
