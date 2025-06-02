
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import ImpersonationBanner from '@/components/admin/ImpersonationBanner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  Clock,
  Camera,
  PenTool,
  UserCheck,
} from "lucide-react"

const Header = () => {
  const { user, session, signOut, hasRole, profile } = useAuth();
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
    <>
      <ImpersonationBanner />
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 w-full z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/">
              <img 
                src="/SeniorDigital.png" 
                alt="Senior Digital Logo" 
                width="100"
                className="object-contain cursor-pointer hover:opacity-80 transition-opacity"
              />
            </Link>
          </div>

          {/* Navigation principale */}
          {session && (
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                to="/recent" 
                className="flex items-center space-x-1 text-tranches-charcoal hover:text-tranches-sage transition-colors"
              >
                <Clock className="w-4 h-4" />
                <span>Récents</span>
              </Link>
              <Link 
                to="/blog" 
                className="flex items-center space-x-1 text-tranches-charcoal hover:text-tranches-sage transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span>Blog (Photos/Vidéos)</span>
              </Link>
              <Link 
                to="/diary" 
                className="flex items-center space-x-1 text-tranches-charcoal hover:text-tranches-sage transition-colors"
              >
                <PenTool className="w-4 h-4" />
                <span>Journal</span>
              </Link>
              <Link 
                to="/life-story" 
                className="flex items-center space-x-1 text-tranches-charcoal hover:text-tranches-sage transition-colors"
              >
                <Book className="w-4 h-4" />
                <span>Histoire de vie</span>
              </Link>
              <Link 
                to="/wishes" 
                className="flex items-center space-x-1 text-tranches-charcoal hover:text-tranches-sage transition-colors"
              >
                <Heart className="w-4 h-4" />
                <span>Souhaits</span>
              </Link>
            </nav>
          )}

          <nav>
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <Avatar className="h-9 w-9 cursor-pointer">
                    <AvatarImage src={profile?.avatar_url || undefined} alt="Avatar" />
                    <AvatarFallback className="bg-tranches-sage text-white">
                      {getInitials(user?.email || '??')}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white shadow-lg border border-gray-200">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="w-full flex items-center px-2 py-2 text-gray-700 hover:bg-gray-50">
                      <Settings className="mr-2 h-4 w-4" />
                      Mon profil
                    </Link>
                  </DropdownMenuItem>

                  {/* Gestion des permissions pour les non-readers */}
                  {!hasRole('reader') && (
                    <DropdownMenuItem asChild>
                      <Link to="/permissions" className="w-full flex items-center px-2 py-2 text-gray-700 hover:bg-gray-50">
                        <UserCheck className="mr-2 h-4 w-4" />
                        Gérer les permissions
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {/* Navigation mobile */}
                  <div className="md:hidden">
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/recent" className="w-full flex items-center px-2 py-2 text-gray-700 hover:bg-gray-50">
                        <Clock className="mr-2 h-4 w-4" />
                        Récents
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/blog" className="w-full flex items-center px-2 py-2 text-gray-700 hover:bg-gray-50">
                        <Camera className="mr-2 h-4 w-4" />
                        Blog (Photos/Vidéos)
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/diary" className="w-full flex items-center px-2 py-2 text-gray-700 hover:bg-gray-50">
                        <PenTool className="mr-2 h-4 w-4" />
                        Journal
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/life-story" className="w-full flex items-center px-2 py-2 text-gray-700 hover:bg-gray-50">
                        <Book className="mr-2 h-4 w-4" />
                        Histoire de vie
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/wishes" className="w-full flex items-center px-2 py-2 text-gray-700 hover:bg-gray-50">
                        <Heart className="mr-2 h-4 w-4" />
                        Souhaits
                      </Link>
                    </DropdownMenuItem>
                  </div>

                  {hasRole('admin') && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin/users" className="w-full flex items-center px-2 py-2 text-gray-700 hover:bg-gray-50">
                          <Users className="mr-2 h-4 w-4" />
                          Gestion des utilisateurs
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/invitation-groups" className="w-full flex items-center px-2 py-2 text-gray-700 hover:bg-gray-50">
                          <Users className="mr-2 h-4 w-4" />
                          Groupes d'invitation
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/posts" className="w-full flex items-center px-2 py-2 text-gray-700 hover:bg-gray-50">
                          <FileText className="mr-2 h-4 w-4" />
                          Articles de blog
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/albums" className="w-full flex items-center px-2 py-2 text-gray-700 hover:bg-gray-50">
                          <Image className="mr-2 h-4 w-4" />
                          Blog photos
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/wish-albums" className="w-full flex items-center px-2 py-2 text-gray-700 hover:bg-gray-50">
                          <Heart className="mr-2 h-4 w-4" />
                          Souhaits
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/diary" className="w-full flex items-center px-2 py-2 text-gray-700 hover:bg-gray-50">
                          <BookOpen className="mr-2 h-4 w-4" />
                          Journal
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/life-stories" className="w-full flex items-center px-2 py-2 text-gray-700 hover:bg-gray-50">
                          <Book className="mr-2 h-4 w-4" />
                          Histoires de vie
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer px-2 py-2 text-gray-700 hover:bg-gray-50"
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
    </>
  );
};

export default Header;
