
import React, { useState } from 'react';
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
              href="/subscription"
              className="flex items-center space-x-1 text-sm font-medium text-tranches-charcoal hover:text-tranches-dustyblue transition-colors"
            >
              <Crown className="w-4 h-4" />
              <span>Abonnements</span>
            </a>
            <a href="/auth">
              <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                Connexion
              </button>
            </a>
            <a href="/auth">
              <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-tranches-dustyblue text-primary-foreground hover:bg-tranches-dustyblue/90 h-9 px-3">
                S'inscrire
              </button>
            </a>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-2">
              <a
                href="/subscription"
                className="flex items-center space-x-1 text-sm font-medium text-tranches-charcoal hover:text-tranches-dustyblue px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                <Crown className="w-4 h-4" />
                <span>Abonnements</span>
              </a>
              <div className="flex items-center space-x-2 px-2 py-2">
                <a href="/auth" onClick={() => setIsMenuOpen(false)}>
                  <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                    Connexion
                  </button>
                </a>
                <a href="/auth" onClick={() => setIsMenuOpen(false)}>
                  <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-tranches-dustyblue text-primary-foreground hover:bg-tranches-dustyblue/90 h-9 px-3">
                    S'inscrire
                  </button>
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
