
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import SeniorDigitalLogo from '@/SeniorDigital.png';

const Header: React.FC = () => {
  const { session, user, profile, signOut, hasRole } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  const getInitials = () => {
    if (!profile?.email) return '';
    return profile.email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white z-30 border-b border-gray-100">
      <div className="container mx-auto flex justify-between items-center h-16 px-4">
        <Link to="/" className="flex items-center space-x-2">
          <img src={SeniorDigitalLogo} alt="Le digital à mon rythme" width="110"/>
        </Link>
        <span className="font-bold text-xl text-tranches-charcoal font-serif"></span>
        <nav className="hidden md:flex space-x-8">
          <Link to="/" className="text-gray-600 hover:text-tranches-sage transition-colors">
            Accueil
          </Link>
          {session && (
            <>
              <Link to="/blog" className="text-gray-600 hover:text-tranches-sage transition-colors">
                Albums
              </Link>
              <Link to="/wishes" className="text-gray-600 hover:text-tranches-sage transition-colors">
                Souhaits
              </Link>
              <Link to="/diary" className="text-gray-600 hover:text-tranches-sage transition-colors">
                Journal
              </Link>
              <Link to="/life-story" className="text-gray-600 hover:text-tranches-sage transition-colors">
                Histoire de vie
              </Link>
            </>
          )}
        </nav>

        {/* Menu utilisateur */}
        <div className="flex items-center space-x-4">
          {session ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback>{getInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profil</Link>
                  </DropdownMenuItem>
                  {hasRole('admin') && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Administration</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/users">Utilisateurs</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/posts">Articles</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/albums">Albums</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/life-stories">Histoires de vie</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/diary">Journal intime</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {!hasRole('admin') && hasRole('editor') && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Édition</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/posts">Articles</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild variant="outline">
              <Link to="/auth">Se connecter</Link>
            </Button>
          )}
          
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="grid gap-4 h-full">
                <Link to="/" className="flex items-center space-x-2">
                  <span className="font-bold text-xl text-tranches-charcoal font-serif">Senior Digital Mentor</span>
                </Link>
                <nav className="grid gap-6 text-lg">
                  <Link to="/" className="hover:text-tranches-sage transition-colors">
                    Accueil
                  </Link>
                  {session && (
                    <>
                      <Link to="/blog" className="hover:text-tranches-sage transition-colors">
                        Albums
                      </Link>
                      <Link to="/wishes" className="hover:text-tranches-sage transition-colors">
                        Souhaits
                      </Link>
                      <Link to="/diary" className="hover:text-tranches-sage transition-colors">
                        Journal
                      </Link>
                      <Link to="/life-story" className="hover:text-tranches-sage transition-colors">
                        Histoire de vie
                      </Link>
                      <Link to="/profile" className="hover:text-tranches-sage transition-colors">
                        Profil
                      </Link>
                      {hasRole('admin') && (
                        <>
                          <Link to="/admin/users" className="hover:text-tranches-sage transition-colors">
                            Utilisateurs
                          </Link>
                          <Link to="/admin/posts" className="hover:text-tranches-sage transition-colors">
                            Articles
                          </Link>
                          <Link to="/admin/albums" className="hover:text-tranches-sage transition-colors">
                            Albums
                          </Link>
                          <Link to="/admin/life-stories" className="hover:text-tranches-sage transition-colors">
                            Histoires de vie
                          </Link>
                          <Link to="/admin/diary" className="hover:text-tranches-sage transition-colors">
                            Journal intime
                          </Link>
                        </>
                      )}
                      {!hasRole('admin') && hasRole('editor') && (
                        <Link to="/admin/posts" className="hover:text-tranches-sage transition-colors">
                          Articles
                        </Link>
                      )}
                      <Button variant="outline" onClick={handleLogout}>
                        Déconnexion
                      </Button>
                    </>
                  )}
                  {!session && (
                    <Button asChild variant="outline">
                      <Link to="/auth">Se connecter</Link>
                    </Button>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
