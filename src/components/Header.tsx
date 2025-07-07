import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCaregiversAccess } from '@/hooks/useCaregiversAccess';
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
  CreditCard
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
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const isProfessional = roles.includes('professionnel');

  const navigationItems = [
    { path: '/recent', label: 'Récent', icon: Heart },
    { path: '/diary', label: 'Journal', icon: BookOpen },
    { path: '/blog', label: 'Blog', icon: Calendar },
    { path: '/life-story', label: 'Récit de vie', icon: Star },
    { path: '/wishes', label: 'Souhaits', icon: Star },
  ];

  // Ajouter le menu Activités avec ses sous-menus corrigés
  const activitiesMenu = {
    path: '/activities',
    label: 'Activités',
    icon: Activity,
    subItems: [
      { path: '/activities/meditation', label: 'Méditation' },
      { path: '/activities/games', label: 'Jeux' },
      { path: '/activities/exercises', label: 'Exercices' }
    ]
  };

  if (isProfessional) {
    navigationItems.push(
      { path: '/professional-scheduler', label: 'Planning', icon: Calendar }
    );
  }

  // Ajouter le menu Aidants si l'utilisateur y a accès
  if (hasCaregiversAccess) {
    navigationItems.push({
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

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/SeniorDigital.png" 
              alt="SeniorDigital" 
              className="h-12 w-auto"
            />
          </Link>

          {session && (
            <>
              {/* Navigation */}
              <nav className="hidden md:flex items-center space-x-6">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || 
                    (item.path !== '/recent' && location.pathname.startsWith(item.path));
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                {/* Menu Activités avec dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname.startsWith('/activities')
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      <Activity className="h-4 w-4" />
                      <span>{activitiesMenu.label}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/activities" className="flex items-center">
                        <Activity className="mr-2 h-4 w-4" />
                        Vue d'ensemble
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {activitiesMenu.subItems.map((subItem) => (
                      <DropdownMenuItem key={subItem.path} asChild>
                        <Link to={subItem.path} className="flex items-center">
                          {subItem.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </nav>

              {/* User Menu avec Avatar */}
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
                <DropdownMenuContent align="end" className="w-56">
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
