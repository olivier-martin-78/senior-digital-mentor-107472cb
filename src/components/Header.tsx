
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, Calendar, FileText, Crown, Sparkles, Users, Settings } from 'lucide-react';
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

  const isReader = hasRole('reader');

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/SeniorDigital.png" alt="Logo" className="h-12 w-auto" />
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
                
                <div className="relative group">
                  <Link
                    to="/activities/activities"
                    className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                      isActivePath('/activities/activities')
                        ? 'text-tranches-dustyblue'
                        : 'text-tranches-charcoal hover:text-tranches-dustyblue'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Activités</span>
                  </Link>
                  
                  {/* Sous-menu */}
                  <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2">
                      <Link
                        to="/activities/meditation"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-tranches-dustyblue"
                      >
                        Relaxation
                      </Link>
                      <Link
                        to="/activities/games"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-tranches-dustyblue"
                      >
                        Jeux
                      </Link>
                      <Link
                        to="/activities/exercises"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-tranches-dustyblue"
                      >
                        Gym douce
                      </Link>
                    </div>
                  </div>
                </div>

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

                {/* Mes invités - visible pour tous les utilisateurs authentifiés sauf les readers */}
                {!isReader && (
                  <Link
                    to="/my-invitation-groups"
                    className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                      isActivePath('/my-invitation-groups')
                        ? 'text-tranches-dustyblue'
                        : 'text-tranches-charcoal hover:text-tranches-dustyblue'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Mes invités</span>
                  </Link>
                )}

                {/* Menu Administration pour les admins */}
                {hasRole('admin') && (
                  <div className="relative group">
                    <Link
                      to="/admin/users"
                      className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                        location.pathname.startsWith('/admin')
                          ? 'text-tranches-dustyblue'
                          : 'text-tranches-charcoal hover:text-tranches-dustyblue'
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Administration</span>
                    </Link>
                    
                    {/* Sous-menu Administration */}
                    <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="py-2">
                        <Link
                          to="/admin/users"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-tranches-dustyblue"
                        >
                          Utilisateurs
                        </Link>
                        <Link
                          to="/admin/posts"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-tranches-dustyblue"
                        >
                          Articles de blog
                        </Link>
                        <Link
                          to="/admin/albums"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-tranches-dustyblue"
                        >
                          Albums
                        </Link>
                        <Link
                          to="/admin/wish-albums"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-tranches-dustyblue"
                        >
                          Albums de souhaits
                        </Link>
                        <Link
                          to="/admin/diary"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-tranches-dustyblue"
                        >
                          Journal
                        </Link>
                        <Link
                          to="/admin/life-stories"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-tranches-dustyblue"
                        >
                          Récits de vie
                        </Link>
                        <Link
                          to="/admin/activities"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-tranches-dustyblue"
                        >
                          Activités
                        </Link>
                        <Link
                          to="/admin/permissions-diagnostic"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-tranches-dustyblue"
                        >
                          Diagnostic permissions
                        </Link>
                        <Link
                          to="/admin/invitation-groups"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-tranches-dustyblue"
                        >
                          Groupes d'invitation
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
                
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
          <div className="md:hidden flex items-center space-x-2">
            {user && (
              <Link to="/profile">
                <Button variant="ghost" size="sm" className="p-2">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
            )}
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
                  
                  <Link
                    to="/activities/activities"
                    className="flex items-center space-x-1 text-sm font-medium text-tranches-charcoal hover:text-tranches-dustyblue px-2 py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Activités</span>
                  </Link>
                  
                  <div className="pl-6 space-y-1">
                    <Link
                      to="/activities/meditation"
                      className="block text-sm text-gray-600 hover:text-tranches-dustyblue px-2 py-1"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Relaxation
                    </Link>
                    <Link
                      to="/activities/games"
                      className="block text-sm text-gray-600 hover:text-tranches-dustyblue px-2 py-1"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Jeux
                    </Link>
                    <Link
                      to="/activities/exercises"
                      className="block text-sm text-gray-600 hover:text-tranches-dustyblue px-2 py-1"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Gym douce
                    </Link>
                  </div>
                  
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

                  {/* Mes invités - mobile */}
                  {!isReader && (
                    <Link
                      to="/my-invitation-groups"
                      className="flex items-center space-x-1 text-sm font-medium text-tranches-charcoal hover:text-tranches-dustyblue px-2 py-1"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Users className="w-4 h-4" />
                      <span>Mes invités</span>
                    </Link>
                  )}

                  {/* Administration mobile pour les admins */}
                  {hasRole('admin') && (
                    <>
                      <div className="text-sm font-medium text-tranches-charcoal px-2 py-1 flex items-center space-x-1">
                        <Settings className="w-4 h-4" />
                        <span>Administration</span>
                      </div>
                      <div className="pl-6 space-y-1">
                        <Link
                          to="/admin/users"
                          className="block text-sm text-gray-600 hover:text-tranches-dustyblue px-2 py-1"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Utilisateurs
                        </Link>
                        <Link
                          to="/admin/posts"
                          className="block text-sm text-gray-600 hover:text-tranches-dustyblue px-2 py-1"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Articles de blog
                        </Link>
                        <Link
                          to="/admin/albums"
                          className="block text-sm text-gray-600 hover:text-tranches-dustyblue px-2 py-1"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Albums
                        </Link>
                        <Link
                          to="/admin/wish-albums"
                          className="block text-sm text-gray-600 hover:text-tranches-dustyblue px-2 py-1"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Albums de souhaits
                        </Link>
                        <Link
                          to="/admin/diary"
                          className="block text-sm text-gray-600 hover:text-tranches-dustyblue px-2 py-1"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Journal
                        </Link>
                        <Link
                          to="/admin/life-stories"
                          className="block text-sm text-gray-600 hover:text-tranches-dustyblue px-2 py-1"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Récits de vie
                        </Link>
                        <Link
                          to="/admin/activities"
                          className="block text-sm text-gray-600 hover:text-tranches-dustyblue px-2 py-1"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Activités
                        </Link>
                        <Link
                          to="/admin/permissions-diagnostic"
                          className="block text-sm text-gray-600 hover:text-tranches-dustyblue px-2 py-1"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Diagnostic permissions
                        </Link>
                        <Link
                          to="/admin/invitation-groups"
                          className="block text-sm text-gray-600 hover:text-tranches-dustyblue px-2 py-1"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Groupes d'invitation
                        </Link>
                      </div>
                    </>
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
