
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { UserCircle } from 'lucide-react';

const Header = () => {
  const { user, profile, signOut, hasRole } = useAuth();
  
  return (
    <header className="w-full fixed top-0 left-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-2xl font-serif text-tranches-charcoal">
          Tranches de vie
        </Link>
        
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link to="/" className={cn(navigationMenuTriggerStyle())}>
                Accueil
              </Link>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Link to="/blog" className={cn(navigationMenuTriggerStyle())}>
                Blog
              </Link>
            </NavigationMenuItem>
            
            {user ? (
              <>
                {(hasRole('admin') || hasRole('editor')) && (
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>Administration</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-[200px] p-2">
                        <Link 
                          to="/admin/posts" 
                          className="block p-2 hover:bg-slate-100 rounded-md"
                        >
                          Gérer les articles
                        </Link>
                        {hasRole('admin') && (
                          <Link 
                            to="/admin/users" 
                            className="block p-2 hover:bg-slate-100 rounded-md"
                          >
                            Gérer les utilisateurs
                          </Link>
                        )}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )}
                
                <NavigationMenuItem>
                  <NavigationMenuTrigger>
                    <span className="flex items-center gap-2">
                      <UserCircle className="w-5 h-5" />
                      {profile?.display_name || user.email}
                    </span>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[200px] p-2">
                      <Link 
                        to="/profile" 
                        className="block p-2 hover:bg-slate-100 rounded-md"
                      >
                        Mon profil
                      </Link>
                      <button 
                        onClick={() => signOut()}
                        className="block w-full text-left p-2 hover:bg-slate-100 rounded-md text-red-600"
                      >
                        Déconnexion
                      </button>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </>
            ) : (
              <NavigationMenuItem>
                <Link to="/auth" className={cn(navigationMenuTriggerStyle(), "bg-tranches-sage text-white hover:bg-tranches-sage/90")}>
                  Se connecter
                </Link>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
};

export default Header;
