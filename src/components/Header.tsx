
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Settings, LogOut, User, Shield, Users, Calendar, Pen, Heart, BookOpen, Clock } from 'lucide-react';
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

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 text-2xl font-serif text-tranches-charcoal hover:text-tranches-sage transition-colors">
            <img 
              src="/SeniorDigital.png" 
              alt="Senior Digital Mentor" 
              width ="150%"
            />
            <span>Senior Digital Mentor</span>
          </Link>

          {user ? (
            <div className="flex items-center space-x-4">
              <nav className="hidden md:flex items-center space-x-6">
                <Link 
                  to="/recent" 
                  className={`flex items-center text-sm font-medium transition-colors hover:text-tranches-sage ${
                    isActive('/recent') ? 'text-tranches-sage' : 'text-gray-600'
                  }`}
                >
                  <Clock className="w-4 h-4 mr-1" />
                  Récent
                </Link>
                <Link 
                  to="/blog" 
                  className={`flex items-center text-sm font-medium transition-colors hover:text-tranches-sage ${
                    isActive('/blog') ? 'text-tranches-sage' : 'text-gray-600'
                  }`}
                >
                  <Pen className="w-4 h-4 mr-1" />
                  Blog
                </Link>
                <Link 
                  to="/diary" 
                  className={`flex items-center text-sm font-medium transition-colors hover:text-tranches-sage ${
                    isActive('/diary') ? 'text-tranches-sage' : 'text-gray-600'
                  }`}
                >
                  <BookOpen className="w-4 h-4 mr-1" />
                  Journal
                </Link>
                <Link 
                  to="/life-story" 
                  className={`flex items-center text-sm font-medium transition-colors hover:text-tranches-sage ${
                    isActive('/life-story') ? 'text-tranches-sage' : 'text-gray-600'
                  }`}
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Histoire
                </Link>
                <Link 
                  to="/wishes" 
                  className={`flex items-center text-sm font-medium transition-colors hover:text-tranches-sage ${
                    isActive('/wishes') ? 'text-tranches-sage' : 'text-gray-600'
                  }`}
                >
                  <Heart className="w-4 h-4 mr-1" />
                  Souhaits
                </Link>
              </nav>

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
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="w-full cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profil
                    </Link>
                  </DropdownMenuItem>
                  {(hasRole('admin') || hasRole('editor')) && (
                    <DropdownMenuItem asChild>
                      <Link to="/my-groups" className="w-full cursor-pointer">
                        <Users className="mr-2 h-4 w-4" />
                        Mes groupes
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {hasRole('admin') && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin/users" className="w-full cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          Administration
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    disabled={isLoading}
                    className="cursor-pointer"
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
