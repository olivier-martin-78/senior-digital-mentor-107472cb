
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WishPost } from '@/types/supabase';
import { Edit, Trash2, Calendar, User, Clock, Check, X, RotateCcw, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useContentReadStatus } from '@/hooks/useContentReadStatus';
import RecentItemImage from '@/components/RecentItemImage';

interface WishCardProps {
  wish: WishPost;
}

const WishCard: React.FC<WishCardProps> = ({ wish }) => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isRead, readAt, markAsRead } = useContentReadStatus('wish', wish.id);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const canEdit = user && (wish.author_id === user.id || hasRole('admin'));
  const canChangeStatus = user && (wish.author_id === user.id || hasRole('admin'));

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

  const handleStatusChange = async (e: React.MouseEvent, newStatus: 'pending' | 'fulfilled' | 'cancelled') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user || !canChangeStatus || isUpdatingStatus) return;

    try {
      setIsUpdatingStatus(true);
      
      const { error } = await supabase
        .from('wish_posts')
        .update({ status: newStatus })
        .eq('id', wish.id);

      if (error) {
        throw error;
      }

      const statusLabels = {
        pending: 'en attente',
        fulfilled: 'réalisé',
        cancelled: 'annulé'
      };

      toast({
        title: 'Statut mis à jour',
        description: `Le souhait est maintenant ${statusLabels[newStatus]}.`,
      });

      // Recharger la page pour mettre à jour la liste
      window.location.reload();
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
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
    
    const statusConfig = {
      pending: { label: 'En attente', variant: 'outline' as const, color: 'text-gray-600' },
      fulfilled: { label: 'Réalisé ✓', variant: 'default' as const, color: 'text-green-600' },
      cancelled: { label: 'Annulé', variant: 'destructive' as const, color: 'text-red-600' }
    };
    
    const currentStatus = wish.status || 'pending';
    const config = statusConfig[currentStatus as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getCardClass = () => {
    const baseClass = "hover:shadow-md transition-shadow cursor-pointer h-full";
    const currentStatus = wish.status || 'pending';
    
    switch (currentStatus) {
      case 'fulfilled':
        return `${baseClass} border-green-300 bg-green-50/50`;
      case 'cancelled':
        return `${baseClass} border-red-300 bg-red-50/50`;
      default:
        return baseClass;
    }
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
      <Card className={getCardClass()}>
        {wish.cover_image && (
          <RecentItemImage
            type="wish"
            id={wish.id}
            title={wish.title}
            coverImage={wish.cover_image}
            className="w-full aspect-video overflow-hidden rounded-t-lg"
          />
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
              {(canEdit || canChangeStatus) && (
                <div className="flex flex-wrap gap-1">
                   {canChangeStatus && (
                    <>
                      {(wish.status || 'pending') !== 'fulfilled' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleStatusChange(e, 'fulfilled')}
                          disabled={isUpdatingStatus}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Marquer comme réalisé"
                        >
                          {isUpdatingStatus ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-4 w-4" />}
                        </Button>
                      )}
                      {(wish.status || 'pending') !== 'cancelled' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleStatusChange(e, 'cancelled')}
                          disabled={isUpdatingStatus}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Marquer comme annulé"
                        >
                          {isUpdatingStatus ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-4 w-4" />}
                        </Button>
                      )}
                      {(wish.status || 'pending') !== 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleStatusChange(e, 'pending')}
                          disabled={isUpdatingStatus}
                          className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                          title="Remettre en attente"
                        >
                          {isUpdatingStatus ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                        </Button>
                      )}
                    </>
                  )}
                  {canEdit && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEdit}
                        className="h-8 w-8 p-0"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
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
          
          <div className="flex flex-col gap-1 text-xs text-gray-400">
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
            {wish.status === 'fulfilled' && wish.status_changed_at && (
              <div className="flex items-center gap-1 text-green-600">
                <Check className="h-3 w-3" />
                <span>Réalisé le {formatDate(wish.status_changed_at)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default WishCard;
