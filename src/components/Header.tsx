import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Book,
  BookOpen,
  FileText,
  Heart,
  Image,
  LogOut,
  Settings,
  Users,
} from "lucide-react"

const Header = () => {
  const { user, session, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de se déconnecter',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white border-b border-gray-200 fixed top-0 left-0 w-full z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-tranches-charcoal font-serif">
          Tranches de Vie
        </Link>
        <nav>
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.avatar_url || undefined} alt="Avatar" />
                  <AvatarFallback>{getInitials(user?.email || '??')}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    Profil
                  </Link>
                </DropdownMenuItem>
                {hasRole('admin') && (
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/admin/users" className="w-full">
                        <Users className="mr-2 h-4 w-4" />
                        Gestion des utilisateurs
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/invitation-groups" className="w-full">
                        <Users className="mr-2 h-4 w-4" />
                        Groupes d'invitation
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/posts" className="w-full">
                        <FileText className="mr-2 h-4 w-4" />
                        Articles de blog
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/albums" className="w-full">
                        <Image className="mr-2 h-4 w-4" />
                        Albums photos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/wish-albums" className="w-full">
                        <Heart className="mr-2 h-4 w-4" />
                        Albums de souhaits
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/diary" className="w-full">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Journaux intimes
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/life-stories" className="w-full">
                        <Book className="mr-2 h-4 w-4" />
                        Histoires de vie
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                )}
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div>
              <Link to="/auth" className="text-tranches-charcoal hover:text-tranches-sage">
                Se connecter
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
