
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WishPost } from '@/types/supabase';
import { Edit, Trash2, Calendar, User, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useContentReadStatus } from '@/hooks/useContentReadStatus';

interface WishCardProps {
  wish: WishPost;
}

const WishCard: React.FC<WishCardProps> = ({ wish }) => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isRead, readAt, markAsRead } = useContentReadStatus('wish', wish.id);
  const [isDeleting, setIsDeleting] = useState(false);

  const canEdit = user && (wish.author_id === user.id || hasRole('admin'));

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user || !canEdit) return;

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce souhait ?')) {
      return;
    }

    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('wish_posts')
        .delete()
        .eq('id', wish.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Souhait supprimé',
        description: 'Le souhait a été supprimé avec succès.',
      });

      // Recharger la page pour mettre à jour la liste
      window.location.reload();
    } catch (error: any) {
      console.error('Erreur lors de la suppression du souhait:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le souhait. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/wishes/edit/${wish.id}`);
  };

  // Marquer comme lu quand l'utilisateur clique sur la carte (seulement pour les autres auteurs)
  const handleClick = () => {
    if (user && wish.author_id !== user.id && !isRead) {
      markAsRead();
    }
  };

  const getStatusBadge = () => {
    if (!wish.published) {
      return <Badge variant="secondary">Brouillon</Badge>;
    }
    return null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Link to={`/wishes/${wish.id}`} onClick={handleClick}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        {wish.cover_image && (
          <div className="aspect-video overflow-hidden rounded-t-lg">
            <img
              src={wish.cover_image}
              alt={wish.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-medium text-gray-900 line-clamp-2">
                {wish.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                <User className="h-4 w-4" />
                <span>Pour {wish.first_name}</span>
              </div>
              {user && wish.author_id !== user.id && isRead && readAt && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Lu le {new Date(readAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {getStatusBadge()}
              {canEdit && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {wish.content && (
            <p className="text-sm text-gray-600 line-clamp-3 mb-3">
              {wish.content}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(wish.created_at)}</span>
            </div>
            {wish.updated_at !== wish.created_at && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Modifié le {formatDate(wish.updated_at)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default WishCard;
