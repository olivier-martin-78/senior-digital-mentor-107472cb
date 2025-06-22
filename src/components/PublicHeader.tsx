
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Crown } from 'lucide-react';

const PublicHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center space-x-2">
            <img src="/SeniorDigital.png" alt="Logo" className="h-14 w-auto" />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a
              href="/auth"
              className="flex items-center space-x-1 text-sm font-medium text-tranches-charcoal hover:text-tranches-dustyblue transition-colors"
            >
              <Crown className="w-4 h-4" />
              <span>Abonnements</span>
            </a>
            <a href="/auth">
              <Button variant="outline" size="sm">
                Connexion
              </Button>
            </a>
            <a href="/auth">
              <Button size="sm" className="bg-tranches-dustyblue hover:bg-tranches-dustyblue/90">
                S'inscrire
              </Button>
            </a>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-2">
              <a
                href="/auth"
                className="flex items-center space-x-1 text-sm font-medium text-tranches-charcoal hover:text-tranches-dustyblue px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                <Crown className="w-4 h-4" />
                <span>Abonnements</span>
              </a>
              <div className="flex items-center space-x-2 px-2 py-2">
                <a href="/auth" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" size="sm">
                    Connexion
                  </Button>
                </a>
                <a href="/auth" onClick={() => setIsMenuOpen(false)}>
                  <Button size="sm" className="bg-tranches-dustyblue hover:bg-tranches-dustyblue/90">
                    S'inscrire
                  </Button>
                </a>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default PublicHeader;
