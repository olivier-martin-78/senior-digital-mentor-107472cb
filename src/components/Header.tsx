
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Settings, LogOut, User, Shield, Users, Calendar, Pen, Heart, BookOpen, Clock, Menu } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const Header = () => {
  const { user, profile, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut();
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès."
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la déconnexion.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const navigationItems = [
    { path: '/recent', label: 'Récent', icon: Clock },
    { path: '/blog', label: 'Blog', icon: Pen },
    { path: '/diary', label: 'Journal', icon: BookOpen },
    { path: '/life-story', label: 'Histoire', icon: Calendar },
    { path: '/wishes', label: 'Souhaits', icon: Heart },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3 text-2xl font-serif text-tranches-charcoal hover:text-tranches-sage transition-colors">
            <img 
              src="/SeniorDigital.png" 
              alt="Senior Digital Mentor" 
              width ="125px"
            />
          </Link>

          {user ? (
            <div className="flex items-center space-x-4">
              {/* Navigation */}
              <nav className="hidden md:flex items-center space-x-6">
                {navigationItems.map(({ path, label, icon: Icon }) => (
                  <Link 
                    key={path}
                    to={path} 
                    className={`flex items-center text-sm font-medium transition-colors hover:text-tranches-sage ${
                      isActive(path) ? 'text-tranches-sage' : 'text-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-1" />
                    {label}
                  </Link>
                ))}
                
                {/* Ajouter le lien vers le planificateur pour les admins */}
                {hasRole('admin') && (
                  <Link 
                    to="/scheduler" 
                    className="text-gray-700 hover:text-tranches-sage font-medium transition-colors"
                  >
                    Planificateur
                  </Link>
                )}
              </nav>

              {/* Menu mobile hamburger - visible uniquement sur mobile */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Ouvrir le menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col space-y-4 mt-6">
                    <h2 className="text-lg font-semibold text-tranches-charcoal">Navigation</h2>
                    {navigationItems.map(({ path, label, icon: Icon }) => (
                      <SheetClose key={path} asChild>
                        <Link 
                          to={path} 
                          className={`flex items-center text-sm font-medium transition-colors hover:text-tranches-sage p-2 rounded-md ${
                            isActive(path) ? 'text-tranches-sage bg-tranches-sage/10' : 'text-gray-600'
                          }`}
                        >
                          <Icon className="w-4 h-4 mr-3" />
                          {label}
                        </Link>
                      </SheetClose>
                    ))}
                    
                    <div className="border-t pt-4 mt-4">
                      <h3 className="text-sm font-semibold text-gray-500 mb-2">Compte</h3>
                      <SheetClose asChild>
                        <Link 
                          to="/profile" 
                          className="flex items-center text-sm font-medium transition-colors hover:text-tranches-sage p-2 rounded-md text-gray-600"
                        >
                          <User className="w-4 h-4 mr-3" />
                          Profil
                        </Link>
                      </SheetClose>
                      
                      {(hasRole('admin') || hasRole('editor')) && (
                        <SheetClose asChild>
                          <Link 
                            to="/my-groups" 
                            className="flex items-center text-sm font-medium transition-colors hover:text-tranches-sage p-2 rounded-md text-gray-600"
                          >
                            <Users className="w-4 h-4 mr-3" />
                            Mes groupes
                          </Link>
                        </SheetClose>
                      )}
                      
                      {hasRole('admin') && (
                        <SheetClose asChild>
                          <Link 
                            to="/admin/users" 
                            className="flex items-center text-sm font-medium transition-colors hover:text-tranches-sage p-2 rounded-md text-gray-600"
                          >
                            <Settings className="w-4 h-4 mr-3" />
                            Administration
                          </Link>
                        </SheetClose>
                      )}
                      
                      <button
                        onClick={handleSignOut}
                        disabled={isLoading}
                        className="flex items-center text-sm font-medium transition-colors hover:text-red-600 p-2 rounded-md text-gray-600 w-full text-left"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        {isLoading ? 'Déconnexion...' : 'Se déconnecter'}
                      </button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Avatar dropdown - visible sur toutes les tailles */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || ''} alt={profile?.display_name || user.email || ''} />
                      <AvatarFallback>
                        {getInitials(profile?.display_name || null, user.email || '')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{profile?.display_name || 'Utilisateur'}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link to="/profile" className="w-full cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profil
                    </Link>
                  </DropdownMenuItem>
                  {(hasRole('admin') || hasRole('editor')) && (
                    <DropdownMenuItem asChild className="md:hidden">
                      <Link to="/my-groups" className="w-full cursor-pointer">
                        <Users className="mr-2 h-4 w-4" />
                        Mes groupes
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {hasRole('admin') && (
                    <>
                      <DropdownMenuSeparator className="md:hidden" />
                      <DropdownMenuItem asChild className="md:hidden">
                        <Link to="/admin/users" className="w-full cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          Administration
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="md:hidden" />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    disabled={isLoading}
                    className="cursor-pointer md:hidden"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isLoading ? 'Déconnexion...' : 'Se déconnecter'}
                  </DropdownMenuItem>
                  
                  {/* Items desktop uniquement */}
                  <DropdownMenuItem asChild className="hidden md:flex">
                    <Link to="/profile" className="w-full cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profil
                    </Link>
                  </DropdownMenuItem>
                  {(hasRole('admin') || hasRole('editor')) && (
                    <DropdownMenuItem asChild className="hidden md:flex">
                      <Link to="/my-groups" className="w-full cursor-pointer">
                        <Users className="mr-2 h-4 w-4" />
                        Mes groupes
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {hasRole('admin') && (
                    <>
                      <DropdownMenuSeparator className="hidden md:block" />
                      <DropdownMenuItem asChild className="hidden md:flex">
                        <Link to="/admin/users" className="w-full cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          Administration
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="hidden md:block" />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    disabled={isLoading}
                    className="cursor-pointer hidden md:flex"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isLoading ? 'Déconnexion...' : 'Se déconnecter'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost">
                <Link to="/auth">Se connecter</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
