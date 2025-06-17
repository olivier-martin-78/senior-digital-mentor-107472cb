
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, Calendar, FileText, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, hasRole } = useAuth();
  const { subscription } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/SeniorDigital.png" alt="Logo" className="h-19 w-24" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                <Link
                  to="/recent"
                  className={`text-sm font-medium transition-colors ${
                    isActivePath('/recent')
                      ? 'text-tranches-dustyblue'
                      : 'text-tranches-charcoal hover:text-tranches-dustyblue'
                  }`}
                >
                  Récent
                </Link>
                <Link
                  to="/blog"
                  className={`text-sm font-medium transition-colors ${
                    isActivePath('/blog')
                      ? 'text-tranches-dustyblue'
                      : 'text-tranches-charcoal hover:text-tranches-dustyblue'
                  }`}
                >
                  Blog
                </Link>
                <Link
                  to="/diary"
                  className={`text-sm font-medium transition-colors ${
                    isActivePath('/diary')
                      ? 'text-tranches-dustyblue'
                      : 'text-tranches-charcoal hover:text-tranches-dustyblue'
                  }`}
                >
                  Journal
                </Link>
                <Link
                  to="/life-story"
                  className={`text-sm font-medium transition-colors ${
                    isActivePath('/life-story')
                      ? 'text-tranches-dustyblue'
                      : 'text-tranches-charcoal hover:text-tranches-dustyblue'
                  }`}
                >
                  Récits de vie
                </Link>
                <Link
                  to="/wishes"
                  className={`text-sm font-medium transition-colors ${
                    isActivePath('/wishes')
                      ? 'text-tranches-dustyblue'
                      : 'text-tranches-charcoal hover:text-tranches-dustyblue'
                  }`}
                >
                  Souhaits
                </Link>

                {(hasRole('professionnel') || hasRole('admin')) && (
                  <Link
                    to="/scheduler"
                    className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                      isActivePath('/scheduler')
                        ? 'text-tranches-dustyblue'
                        : 'text-tranches-charcoal hover:text-tranches-dustyblue'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Planificateur</span>
                  </Link>
                )}
                
                {/* Lien vers les abonnements sans badge */}
                <Link
                  to="/subscription"
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                    isActivePath('/subscription')
                      ? 'text-tranches-dustyblue'
                      : 'text-tranches-charcoal hover:text-tranches-dustyblue'
                  }`}
                >
                  <Crown className="w-4 h-4" />
                  <span>Abonnements</span>
                </Link>

                <div className="flex items-center space-x-2">
                  <Link to="/profile">
                    <Button variant="ghost" size="sm" className="p-2">
                      <User className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button onClick={handleSignOut} variant="outline" size="sm">
                    Déconnexion
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/subscription"
                  className="flex items-center space-x-1 text-sm font-medium text-tranches-charcoal hover:text-tranches-dustyblue transition-colors"
                >
                  <Crown className="w-4 h-4" />
                  <span>Abonnements</span>
                </Link>
                <Link to="/auth">
                  <Button variant="outline" size="sm">
                    Connexion
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="bg-tranches-dustyblue hover:bg-tranches-dustyblue/90">
                    S'inscrire
                  </Button>
                </Link>
              </>
            )}
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
              {user ? (
                <>
                  <Link
                    to="/recent"
                    className="text-sm font-medium text-tranches-charcoal hover:text-tranches-dustyblue px-2 py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Récent
                  </Link>
                  <Link
                    to="/blog"
                    className="text-sm font-medium text-tranches-charcoal hover:text-tranches-dustyblue px-2 py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Blog
                  </Link>
                  <Link
                    to="/diary"
                    className="text-sm font-medium text-tranches-charcoal hover:text-tranches-dustyblue px-2 py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Journal
                  </Link>
                  <Link
                    to="/life-story"
                    className="text-sm font-medium text-tranches-charcoal hover:text-tranches-dustyblue px-2 py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Récits de vie
                  </Link>
                  <Link
                    to="/wishes"
                    className="text-sm font-medium text-tranches-charcoal hover:text-tranches-dustyblue px-2 py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Souhaits
                  </Link>
                  
                  {(hasRole('professionnel') || hasRole('admin')) && (
                    <Link
                      to="/scheduler"
                      className="flex items-center space-x-1 text-sm font-medium text-tranches-charcoal hover:text-tranches-dustyblue px-2 py-1"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Planificateur</span>
                    </Link>
                  )}
                  
                  <Link
                    to="/subscription"
                    className="flex items-center space-x-1 text-sm font-medium text-tranches-charcoal hover:text-tranches-dustyblue px-2 py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Crown className="w-4 h-4" />
                    <span>Abonnements</span>
                  </Link>
                  
                  <div className="flex items-center space-x-2 px-2 py-2">
                    <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" size="sm">
                        Profil
                      </Button>
                    </Link>
                    <Button onClick={handleSignOut} variant="outline" size="sm">
                      Déconnexion
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/subscription"
                    className="flex items-center space-x-1 text-sm font-medium text-tranches-charcoal hover:text-tranches-dustyblue px-2 py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Crown className="w-4 h-4" />
                    <span>Abonnements</span>
                  </Link>
                  <div className="flex items-center space-x-2 px-2 py-2">
                    <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" size="sm">
                        Connexion
                      </Button>
                    </Link>
                    <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                      <Button size="sm" className="bg-tranches-dustyblue hover:bg-tranches-dustyblue/90">
                        S'inscrire
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
