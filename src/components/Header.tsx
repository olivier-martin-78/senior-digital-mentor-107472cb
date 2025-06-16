import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, User, Calendar, FileText, Heart, BookOpen, Clock, Brain, Gamepad2, Users, Dumbbell, BookMarked, PenTool, Settings, ChevronDown } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

const Header = () => {
  const { user, signOut, hasRole, profile } = useAuth();
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
      label: 'Histoire',
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
    { label: 'Relaxation', href: '/activities/meditation', icon: Brain },
    { label: 'Jeux', href: '/activities/games', icon: Gamepad2 },
    { label: 'Gym douce', href: '/activities/exercises', icon: Dumbbell },
  ];

  const adminMenuItems = [
    { label: 'Mes groupes', href: '/my-groups' },
    { label: 'Gestion des utilisateurs', href: '/admin/users' },
    { label: 'Gestion des posts', href: '/admin/posts' },
    { label: 'Gestion des albums', href: '/admin/albums' },
    { label: 'Albums de souhaits', href: '/admin/wish-albums' },
    { label: 'Gestion du journal', href: '/admin/diary' },
    { label: 'Histoires de vie', href: '/admin/life-stories' },
    { label: 'Groupes d\'invitation', href: '/admin/invitation-groups' },
  ];

  const visibleItems = navigationItems.filter(item => item.show);

  const getAvatarFallback = () => {
    if (profile?.display_name) {
      return profile.display_name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <img 
              src="/SeniorDigital.png" 
              alt="SeniorDigital" 
              width={114}
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
                      <div className="grid gap-3 p-6 w-[300px] grid-cols-1">
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

          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Avatar pour desktop ET mobile */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'Avatar'} />
                        <AvatarFallback className="bg-tranches-sage text-white text-sm">
                          {getAvatarFallback()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-2 w-full cursor-pointer">
                        <User className="h-4 w-4" />
                        Profil
                      </Link>
                    </DropdownMenuItem>
                    
                    {/* Menu "Mes invités" pour les éditeurs et professionnels */}
                    {(hasRole('editor') || hasRole('professionnel')) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/my-groups" className="flex items-center gap-2 w-full cursor-pointer">
                            <Users className="h-4 w-4" />
                            Mes invités
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {hasRole('admin') && (
                      <>
                        <DropdownMenuSeparator />
                        {adminMenuItems.map((item) => (
                          <DropdownMenuItem key={item.href} asChild>
                            <Link to={item.href} className="flex items-center gap-2 w-full cursor-pointer">
                              <Settings className="h-4 w-4" />
                              {item.label}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-red-600 cursor-pointer">
                      <LogOut className="h-4 w-4" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Menu hamburger pour mobile */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-64 max-h-screen overflow-y-auto">
                    <nav className="flex flex-col space-y-4 mt-8">
                      <div className="flex items-center gap-3 p-2 border-b">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'Avatar'} />
                          <AvatarFallback className="bg-tranches-sage text-white">
                            {getAvatarFallback()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{profile?.display_name || user.email}</span>
                          <span className="text-xs text-gray-500">{user.email}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-900 px-2">Navigation</p>
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
                      </div>
                      
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium text-gray-900 mb-2 px-2">Activités</p>
                        <div className="space-y-1">
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
                      </div>
                      
                      <div className="border-t pt-4 space-y-1">
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 text-gray-600 hover:text-tranches-sage transition-colors p-2 rounded-md hover:bg-gray-50"
                        >
                          <User className="h-5 w-5" />
                          Profil
                        </Link>
                        
                        {/* Menu "Mes invités" pour mobile */}
                        {(hasRole('editor') || hasRole('professionnel')) && (
                          <Link
                            to="/my-groups"
                            className="flex items-center gap-3 text-gray-600 hover:text-tranches-sage transition-colors p-2 rounded-md hover:bg-gray-50"
                          >
                            <Users className="h-5 w-5" />
                            Mes invités
                          </Link>
                        )}
                        
                        {hasRole('admin') && (
                          <>
                            <div className="border-t my-2"></div>
                            <p className="text-sm font-medium text-gray-900 px-2">Administration</p>
                            {adminMenuItems.map((item) => (
                              <Link
                                key={item.href}
                                to={item.href}
                                className="flex items-center gap-3 text-gray-600 hover:text-tranches-sage transition-colors p-2 rounded-md hover:bg-gray-50"
                              >
                                <Settings className="h-5 w-5" />
                                {item.label}
                              </Link>
                            ))}
                          </>
                        )}
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 text-gray-600 hover:text-tranches-sage transition-colors p-2 rounded-md hover:bg-gray-50 text-left w-full"
                        >
                          <LogOut className="h-5 w-5" />
                          Déconnexion
                        </button>
                      </div>
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
