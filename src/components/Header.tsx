
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCaregiversAccess } from '@/hooks/useCaregiversAccess';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  BookOpen, 
  Calendar, 
  Star, 
  User, 
  Settings, 
  LogOut,
  Users,
  Shield,
  Activity
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
  const { session, roles } = useAuth();
  const { hasCaregiversAccess } = useCaregiversAccess();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const isProfessional = roles.includes('professionnel');

  const navigationItems = [
    { path: '/recent', label: 'Accueil', icon: Heart },
    { path: '/diary', label: 'Journal', icon: BookOpen },
    { path: '/blog', label: 'Blog', icon: Calendar },
    { path: '/life-story', label: 'Récit de vie', icon: Star },
    { path: '/wishes', label: 'Souhaits', icon: Star },
  ];

  if (isProfessional) {
    navigationItems.push(
      { path: '/professional-scheduler', label: 'Planning', icon: Calendar },
      { path: '/professional-module', label: 'Module Pro', icon: Shield }
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

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/recent" className="flex items-center space-x-2">
            <img 
              src="/SeniorDigital.png" 
              alt="SeniorDigital" 
              className="h-8 w-auto"
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
              </nav>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline">Mon compte</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Profil
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
