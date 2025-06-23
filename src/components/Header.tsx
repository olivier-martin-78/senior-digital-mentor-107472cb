import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, Calendar, FileText, Crown, Sparkles, Users, Settings, LogOut } from 'lucide-react';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';
import { useIsMobile } from '@/hooks/use-mobile';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, hasRole, profile } = useOptionalAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobileDevice, isMobileViewport } = useIsMobile();

  // Utiliser le menu mobile si c'est un appareil mobile OU si la viewport est petite OU si c'est un iPad
  const shouldUseMobileMenu = isMobileDevice || isMobileViewport || window.innerWidth <= 1024;

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

  // Helper function to get user initials
  const getUserInitials = () => {
    if (profile?.display_name) {
      return profile.display_name
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/SeniorDigital.png" alt="Logo" className="h-14 w-auto" />
          </Link>

          {/* Desktop Navigation - maintenant masqué sur tablettes aussi */}
          {!shouldUseMobileMenu && (
            <nav className="hidden lg:flex items-center space-x-6">
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
                    {/* Avatar avec menu admin pour les administrateurs */}
                    {hasRole('admin') ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-tranches-dustyblue transition-all">
                            <AvatarImage 
                              src={profile?.avatar_url} 
                              alt={profile?.display_name || user?.email || 'User'} 
                            />
                            <AvatarFallback className="bg-tranches-dustyblue text-white text-sm">
                              {getUserInitials()}
                            </AvatarFallback>
                          </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                          <DropdownMenuLabel className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>Mon compte</span>
                          </DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link to="/profile" className="flex items-center space-x-2">
                              <User className="w-4 h-4" />
                              <span>Profil</span>
                            </Link>
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuLabel className="flex items-center space-x-2">
                            <Settings className="w-4 h-4" />
                            <span>Administration</span>
                          </DropdownMenuLabel>
                          
                          <DropdownMenuItem asChild>
                            <Link to="/admin/users" className="flex items-center space-x-2">
                              <Users className="w-4 h-4" />
                              <span>Utilisateurs</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/admin/posts" className="flex items-center space-x-2">
                              <FileText className="w-4 h-4" />
                              <span>Articles de blog</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/admin/albums" className="flex items-center space-x-2">
                              <FileText className="w-4 h-4" />
                              <span>Albums</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/admin/wish-albums" className="flex items-center space-x-2">
                              <FileText className="w-4 h-4" />
                              <span>Albums de souhaits</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/admin/diary" className="flex items-center space-x-2">
                              <FileText className="w-4 h-4" />
                              <span>Journal</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/admin/life-stories" className="flex items-center space-x-2">
                              <FileText className="w-4 h-4" />
                              <span>Récits de vie</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/admin/activities" className="flex items-center space-x-2">
                              <Sparkles className="w-4 h-4" />
                              <span>Activités</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/admin/permissions-diagnostic" className="flex items-center space-x-2">
                              <Settings className="w-4 h-4" />
                              <span>Diagnostic permissions</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/admin/invitation-groups" className="flex items-center space-x-2">
                              <Users className="w-4 h-4" />
                              <span>Groupes d'invitation</span>
                            </Link>
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={handleSignOut} className="flex items-center space-x-2 text-red-600">
                            <LogOut className="w-4 h-4" />
                            <span>Déconnexion</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Link to="/profile">
                        <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-tranches-dustyblue transition-all">
                          <AvatarImage 
                            src={profile?.avatar_url} 
                            alt={profile?.display_name || user?.email || 'User'} 
                          />
                          <AvatarFallback className="bg-tranches-dustyblue text-white text-sm">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                    )}
                    
                    {!hasRole('admin') && (
                      <Button onClick={handleSignOut} variant="outline" size="sm">
                        Déconnexion
                      </Button>
                    )}
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
          )}

          {/* Mobile menu button - maintenant visible sur tablettes aussi */}
          {shouldUseMobileMenu && (
            <div className="flex items-center space-x-2">
              {user && (
                <Link to="/profile">
                  <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-tranches-dustyblue transition-all">
                    <AvatarImage 
                      src={profile?.avatar_url} 
                      alt={profile?.display_name || user?.email || 'User'} 
                    />
                    <AvatarFallback className="bg-tranches-dustyblue text-white text-sm">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
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
          )}
        </div>

        {/* Mobile Navigation - maintenant affiché sur tablettes aussi */}
        {shouldUseMobileMenu && isMenuOpen && (
          <div className="py-4 border-t border-gray-100">
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
