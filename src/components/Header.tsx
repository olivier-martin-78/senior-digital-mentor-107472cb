
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCircle, Book, BookOpen, ChevronDown } from 'lucide-react';

const Header = () => {
  const { user, profile, signOut, hasRole } = useAuth();
  
  return (
    <header className="w-full fixed top-0 left-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-2xl font-serif text-tranches-charcoal">
          Tranches de vie
        </Link>
        
        <div className="flex items-center space-x-4">
          <Link to="/" className="px-4 py-2 hover:bg-slate-100 rounded-md text-tranches-charcoal">
            Accueil
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center px-4 py-2 hover:bg-slate-100 rounded-md text-tranches-charcoal">
              Blog <ChevronDown className="h-4 w-4 ml-1" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Link to="/blog" className="w-full">
                  Tous les articles
                </Link>
              </DropdownMenuItem>
              {(user && (hasRole('admin') || hasRole('editor'))) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/blog/new" className="w-full">
                      Nouvel article
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {user && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center px-4 py-2 hover:bg-slate-100 rounded-md text-tranches-charcoal">
                  <Book className="w-4 h-4 mr-1" /> Journal <ChevronDown className="h-4 w-4 ml-1" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem asChild>
                    <Link to="/diary" className="w-full">
                      Mon journal
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/diary/new" className="w-full">
                      Nouvelle entrée
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center px-4 py-2 hover:bg-slate-100 rounded-md text-tranches-charcoal">
                  <BookOpen className="w-4 h-4 mr-1" /> Histoire de vie <ChevronDown className="h-4 w-4 ml-1" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem asChild>
                    <Link to="/life-story" className="w-full">
                      Mon histoire
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {(hasRole('admin') || hasRole('editor')) && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center px-4 py-2 hover:bg-slate-100 rounded-md text-tranches-charcoal">
                    Administration <ChevronDown className="h-4 w-4 ml-1" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/posts" className="w-full">
                        Gérer les articles
                      </Link>
                    </DropdownMenuItem>
                    {hasRole('admin') && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin/users" className="w-full">
                          Gérer les utilisateurs
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )}
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center px-4 py-2 hover:bg-slate-100 rounded-md text-tranches-charcoal">
                <span className="flex items-center gap-2">
                  <UserCircle className="w-5 h-5" />
                  {profile?.display_name || user.email}
                </span>
                <ChevronDown className="h-4 w-4 ml-1" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="w-full">
                    Mon profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => signOut()}
                  className="text-red-600"
                >
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth" className="bg-tranches-sage text-white hover:bg-tranches-sage/90 px-4 py-2 rounded-md">
              Se connecter
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
