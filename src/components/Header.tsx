
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCaregiversAccess } from '@/hooks/useCaregiversAccess';
import { useCanCreateActivities } from '@/hooks/useCanCreateActivities';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Heart, 
  BookOpen, 
  Calendar, 
  Star, 
  User, 
  Settings, 
  LogOut,
  Users,
  Activity,
  CreditCard,
  Menu,
  X,
  Shield,
  BarChart3
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from '@/integrations/supabase/client';

const Header = () => {
  const { session, roles, profile } = useAuth();
  const { hasCaregiversAccess } = useCaregiversAccess();
  const { canCreate: canCreateActivities } = useCanCreateActivities();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const isProfessional = roles.includes('professionnel');
  const isAdmin = roles.includes('admin');

  console.log('🔍 Header - User roles:', roles, 'isProfessional:', isProfessional, 'isAdmin:', isAdmin);

  // Menu Senior regroupant les fonctionnalités principales
  const seniorMenuItems = [
    { path: '/recent', label: 'Récent', icon: Heart },
    { path: '/blog', label: 'Blog', icon: Calendar },
    { path: '/diary', label: 'Journal', icon: BookOpen },
    { path: '/life-story', label: 'Récit de vie', icon: Star },
    { path: '/wishes', label: 'Souhaits', icon: Star },
  ];

  // Menu Activités avec ses sous-menus
  const activitiesMenu = {
    path: '/activities',
    label: 'Activités',
    icon: Activity,
    subItems: [
      { path: '/activities/meditation', label: 'Relaxation' },
      { path: '/activities/games', label: 'Jeux cognitifs' },
      { path: '/activities/exercises', label: 'Gym douce' }
    ]
  };

  // Menu Professionnel regroupant les fonctionnalités métier
  const professionalMenuItems = [];
  
  if (isProfessional) {
    professionalMenuItems.push({
      path: '/professional-scheduler',
      label: 'Planning',
      icon: Calendar
    });
  }

  // Ajouter le menu Aidants si l'utilisateur y a accès
  if (hasCaregiversAccess) {
    professionalMenuItems.push({
      path: '/caregivers',
      label: 'Aidants',
      icon: Users
    });
  }

  // Fonction pour obtenir les initiales de l'utilisateur
  const getUserInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.split(' ').map(name => name[0]).join('').toUpperCase();
    }
    if (session?.user?.email) {
      return session.user.email[0].toUpperCase();
    }
    return 'U';
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Visible sur toutes les tailles d'écran */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <img 
              src="/SeniorDigital.png" 
              alt="SeniorDigital" 
              className="h-12 w-auto sm:h-14"
            />
          </Link>

          {session && (
            <>
              {/* Navigation Desktop - Cachée sur mobile */}
              <nav className="hidden lg:flex items-center space-x-6">
                {/* Menu Senior avec dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        seniorMenuItems.some(item => location.pathname === item.path || location.pathname.startsWith(item.path)) || location.pathname.startsWith('/activities')
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      <Heart className="h-4 w-4" />
                      <span>Senior</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 bg-white">
                    {seniorMenuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <DropdownMenuItem key={item.path} asChild>
                          <Link to={item.path} className="flex items-center">
                            <Icon className="mr-2 h-4 w-4" />
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/activities" className="flex items-center">
                        <Activity className="mr-2 h-4 w-4" />
                        Activités - Vue d'ensemble
                      </Link>
                    </DropdownMenuItem>
                    {activitiesMenu.subItems.map((subItem) => (
                      <DropdownMenuItem key={subItem.path} asChild>
                        <Link to={subItem.path} className="flex items-center pl-6">
                          {subItem.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Menu Professionnel avec dropdown - Affiché seulement si items disponibles */}
                {professionalMenuItems.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          professionalMenuItems.some(item => location.pathname === item.path || location.pathname.startsWith(item.path))
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <Settings className="h-4 w-4" />
                        <span>Professionnel</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 bg-white">
                      {professionalMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <DropdownMenuItem key={item.path} asChild>
                            <Link to={item.path} className="flex items-center">
                              <Icon className="mr-2 h-4 w-4" />
                              {item.label}
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </nav>

              {/* Mobile Menu Button et User Avatar */}
              <div className="flex items-center space-x-2">
                {/* Bouton hamburger - Visible uniquement sur mobile */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>

                {/* User Menu avec Avatar - Toujours visible */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 p-1 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || ''} alt="Photo de profil" />
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/subscription" className="flex items-center">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Abonnements
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/my-invitation-groups" className="flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        Invités
                      </Link>
                    </DropdownMenuItem>
                    
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin/dashboard" className="flex items-center">
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Tableau de bord
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/admin/users" className="flex items-center">
                            <Shield className="mr-2 h-4 w-4" />
                            Admin - Utilisateurs
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/admin/posts" className="flex items-center">
                            <BookOpen className="mr-2 h-4 w-4" />
                            Admin - Posts
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/admin/activities" className="flex items-center">
                            <Activity className="mr-2 h-4 w-4" />
                            Admin - Activités
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    {canCreateActivities && !isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/create-activities" className="flex items-center">
                            <Activity className="mr-2 h-4 w-4" />
                            Créer des activités
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>

        {/* Menu Mobile - Affiché quand isMobileMenuOpen est true */}
        {session && isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 py-4">
            <nav className="flex flex-col space-y-2">
              {/* Section Senior Mobile */}
              <div className="mb-4">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Senior
                </div>
                {seniorMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || 
                    (item.path !== '/recent' && location.pathname.startsWith(item.path));
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={closeMobileMenu}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                {/* Menu Activités Mobile */}
                <Link
                  to="/activities"
                  onClick={closeMobileMenu}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/activities'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Activity className="h-5 w-5" />
                  <span>Activités - Vue d'ensemble</span>
                </Link>
                
                {activitiesMenu.subItems.map((subItem) => (
                  <Link
                    key={subItem.path}
                    to={subItem.path}
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-3 px-4 py-3 ml-4 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === subItem.path
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>• {subItem.label}</span>
                  </Link>
                ))}
              </div>

              {/* Section Professionnel Mobile - Affiché seulement si items disponibles */}
              {professionalMenuItems.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Professionnel
                  </div>
                  {professionalMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || 
                      (item.path !== '/caregivers' && location.pathname.startsWith(item.path));
                    
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={closeMobileMenu}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                          isActive
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
