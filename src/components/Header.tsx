
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, User, Calendar, FileText, Heart, BookOpen, Clock, Brain, Gamepad2, Smile, Users, Dumbbell, HeartHandshake, BookMarked, PenTool } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

const Header = () => {
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const navigationItems = [
    {
      label: 'Récents',
      href: '/recent',
      icon: Clock,
      show: !!user
    },
    {
      label: 'Blog',
      href: '/blog',
      icon: FileText,
      show: !!user
    },
    {
      label: 'Journal',
      href: '/diary',
      icon: BookOpen,
      show: !!user
    },
    {
      label: 'Histoire de vie',
      href: '/life-story',
      icon: User,
      show: !!user
    },
    {
      label: 'Souhaits',
      href: '/wishes',
      icon: Heart,
      show: !!user
    },
    {
      label: 'Planificateur',
      href: '/scheduler',
      icon: Calendar,
      show: hasRole('admin') || hasRole('professionnel')
    }
  ];

  const activitiesItems = [
    { label: 'Méditation', href: '/activities/meditation', icon: Brain },
    { label: 'Jeux', href: '/activities/games', icon: Gamepad2 },
    { label: 'Gratitude', href: '/activities/gratitude', icon: Smile },
    { label: 'Connexion', href: '/activities/connection', icon: Users },
    { label: 'Exercices', href: '/activities/exercises', icon: Dumbbell },
    { label: 'Compassion', href: '/activities/compassion', icon: HeartHandshake },
    { label: 'Lecture', href: '/activities/reading', icon: BookMarked },
    { label: 'Ecriture', href: '/activities/writing', icon: PenTool },
  ];

  const visibleItems = navigationItems.filter(item => item.show);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <img 
              src="/SeniorDigital.png" 
              alt="SeniorDigital" 
              width={116}
              className="h-auto"
            />
          </Link>

          {user && (
            <nav className="hidden md:flex items-center space-x-6">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="flex items-center gap-2 text-gray-600 hover:text-tranches-sage transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="text-gray-600 hover:text-tranches-sage">
                      Activités
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid gap-3 p-6 w-[400px] grid-cols-2">
                        {activitiesItems.map((activity) => {
                          const Icon = activity.icon;
                          return (
                            <NavigationMenuLink key={activity.href} asChild>
                              <Link
                                to={activity.href}
                                className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50 transition-colors"
                              >
                                <Icon className="h-5 w-5 text-tranches-sage" />
                                <span className="text-sm font-medium">{activity.label}</span>
                              </Link>
                            </NavigationMenuLink>
                          );
                        })}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </nav>
          )}

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-4">
                  <Link to="/profile">
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profil
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleSignOut}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </Button>
                </div>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-64">
                    <nav className="flex flex-col space-y-4 mt-8">
                      {visibleItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            to={item.href}
                            className="flex items-center gap-3 text-gray-600 hover:text-tranches-sage transition-colors p-2 rounded-md hover:bg-gray-50"
                          >
                            <Icon className="h-5 w-5" />
                            {item.label}
                          </Link>
                        );
                      })}
                      
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium text-gray-900 mb-2">Activités</p>
                        {activitiesItems.map((activity) => {
                          const Icon = activity.icon;
                          return (
                            <Link
                              key={activity.href}
                              to={activity.href}
                              className="flex items-center gap-3 text-gray-600 hover:text-tranches-sage transition-colors p-2 rounded-md hover:bg-gray-50 ml-2"
                            >
                              <Icon className="h-4 w-4" />
                              {activity.label}
                            </Link>
                          );
                        })}
                      </div>
                      
                      <hr className="my-4" />
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 text-gray-600 hover:text-tranches-sage transition-colors p-2 rounded-md hover:bg-gray-50"
                      >
                        <User className="h-5 w-5" />
                        Profil
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 text-gray-600 hover:text-tranches-sage transition-colors p-2 rounded-md hover:bg-gray-50 text-left w-full"
                      >
                        <LogOut className="h-5 w-5" />
                        Déconnexion
                      </button>
                    </nav>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm">Connexion</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
