import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, CalendarIcon, MapPin, Clock, Edit, ExternalLink, User, Mail, Calendar, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WishPost as WishPostType } from '@/types/supabase';
import { sanitizeInput, isValidUrl } from '@/utils/securityUtils';
import { getThumbnailUrlSync, ALBUM_THUMBNAILS_BUCKET } from '@/utils/thumbnailtUtils';
import GroupNotificationButton from '@/components/GroupNotificationButton';

const WishPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  
  const [wish, setWish] = useState<WishPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishLoading, setPublishLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(16/9);

  console.log('🔍 WishPost - Debug state:', {
    id,
    loading,
    wish: wish ? { id: wish.id, title: wish.title } : null,
    user: user ? user.id : null
  });

  useEffect(() => {
    const fetchWishPost = async () => {
      if (!id) {
        console.log('❌ WishPost - No ID provided');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log('🔍 WishPost - Fetching wish:', id);
        
        const { data, error } = await supabase
          .from('wish_posts')
          .select(`
            *,
            profiles:author_id(*),
            album:album_id(name)
          `)
          .eq('id', id)
          .single();
          
        if (error) {
          console.error('❌ WishPost - Error fetching wish:', error);
          throw error;
        }
        
        if (!data) {
          console.log('❌ WishPost - No wish found');
          navigate('/wishes');
          return;
        }
        
        console.log('✅ WishPost - Wish found:', data.id);
        setWish(data as WishPostType);
      } catch (error) {
        console.error('💥 WishPost - Critical error:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger le souhait.",
          variant: "destructive"
        });
        navigate('/wishes');
      } finally {
        setLoading(false);
      }
    };

    fetchWishPost();
  }, [id, navigate, user, hasRole, toast]);

  const handlePublishToggle = async () => {
    if (!wish) return;
    
    try {
      setPublishLoading(true);
      const newPublishedStatus = !wish.published;
      
      const { error } = await supabase
        .from('wish_posts')
        .update({ published: newPublishedStatus })
        .eq('id', wish.id);
        
      if (error) throw error;
      
      // Update local state
      setWish({
        ...wish,
        published: newPublishedStatus
      });
      
      toast({
        title: newPublishedStatus ? "Souhait publié !" : "Souhait mis en brouillon",
        description: newPublishedStatus 
          ? "Le souhait est maintenant visible pour tous les utilisateurs."
          : "Le souhait est maintenant en mode brouillon, seuls vous et les administrateurs peuvent le voir.",
      });
    } catch (error) {
      console.error('Error toggling wish publication status:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de modifier le statut de publication du souhait.",
      });
    } finally {
      setPublishLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!wish || !window.confirm('Êtes-vous sûr de vouloir supprimer ce souhait ? Cette action est irréversible.')) {
      return;
    }
    
    try {
      setDeleteLoading(true);
      
      const { error } = await supabase
        .from('wish_posts')
        .delete()
        .eq('id', wish.id);
        
      if (error) throw error;
      
      toast({
        title: "Souhait supprimé",
        description: "Le souhait a été supprimé avec succès.",
      });
      
      navigate('/wishes');
    } catch (error) {
      console.error('Error deleting wish:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer le souhait.",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleNotificationSent = () => {
    if (wish) {
      setWish({
        ...wish,
        email_notification_sent: true,
        email_notification_requested: true
      });
    }
  };

  // Fonction pour sécuriser l'affichage du contenu
  const renderSecureContent = (content: string | null) => {
    if (!content) return <p className="text-gray-500 italic">Non renseigné</p>;
    
    const sanitizedContent = sanitizeInput(content);
    return sanitizedContent.split('\n').map((paragraph, index) => (
      paragraph ? <p key={index}>{paragraph}</p> : <br key={index} />
    ));
  };

  // Fonction pour sécuriser l'affichage des liens
  const renderSecureLink = (url: string | null) => {
    if (!url) {
      return (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-500 italic">Aucun document ou lien fourni</p>
        </div>
      );
    }

    const sanitizedUrl = sanitizeInput(url);
    if (!isValidUrl(sanitizedUrl)) {
      return (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-red-500 italic">Lien invalide ou non sécurisé</p>
        </div>
      );
    }

    return (
      <a 
        href={sanitizedUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center text-tranches-sage hover:underline bg-gray-50 rounded-lg p-4"
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        Accéder au document ou lien partagé
      </a>
    );
  };

  // Fonction pour afficher la localisation de manière structurée
  const renderLocation = () => {
    if (!wish?.location) {
      return <p className="text-gray-900">Non renseignée</p>;
    }

    const sanitizedLocation = sanitizeInput(wish.location);
    const locationParts = sanitizedLocation.split(', ');
    
    if (locationParts.length === 2) {
      // Si on a deux parties, on suppose que c'est "code postal, ville"
      return (
        <div className="text-gray-900">
          <span className="font-medium">{locationParts[1]}</span>
          <span className="text-gray-600 ml-2">({locationParts[0]})</span>
        </div>
      );
    } else {
      // Sinon on affiche tel quel
      return <p className="text-gray-900">{sanitizedLocation}</p>;
    }
  };

  // Fonction pour déterminer le ratio de l'image
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    const ratio = img.naturalWidth / img.naturalHeight;
    setImageAspectRatio(ratio);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!wish) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <h2 className="text-2xl font-serif text-tranches-charcoal mb-4">Souhait non trouvé</h2>
            <Button asChild>
              <Link to="/wishes">Retour aux souhaits</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const requestTypeText = wish.request_type === 'other' && wish.custom_request_type 
    ? sanitizeInput(wish.custom_request_type || '')
    : {
        'personal': 'Un souhait personnel',
        'experience': 'Une expérience à vivre',
        'service': 'Un service à recevoir',
        'aide': 'Aide',
        'materiel': 'Matériel',
        'autre': 'Autre',
        'other': 'Autre type de demande'
      }[wish.request_type as string] || wish.request_type;
  
  // CORRECTION: Seuls l'auteur et les admins peuvent voir les boutons de gestion
  const isAuthor = user?.id === wish.author_id;
  const isAdmin = hasRole('admin'); // Seulement 'admin', pas 'editor'
  
  console.log('WishPost - Debug permissions:', {
    userId: user?.id,
    wishAuthorId: wish.author_id,
    isAuthor,
    isAdmin,
    userRoles: user ? [hasRole('admin') ? 'admin' : '', hasRole('editor') ? 'editor' : '', hasRole('reader') ? 'reader' : ''].filter(Boolean) : []
  });
  
  const canManagePublication = isAuthor || isAdmin;
  const canEdit = isAuthor || isAdmin;
  const canDelete = isAuthor || isAdmin; // CORRECTION: L'auteur peut maintenant supprimer son souhait

  console.log('WishPost - Final permissions:', {
    canManagePublication,
    canEdit,
    canDelete
  });

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/wishes')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux souhaits
        </Button>
        
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          {/* Header avec vignette */}
          <div className="mb-8">
            {/* Vignette du souhait */}
            {wish.cover_image && (
              <div className="mb-6 max-w-2xl mx-auto">
                <AspectRatio ratio={imageAspectRatio}>
                  <img
                    src={getThumbnailUrlSync(wish.cover_image, ALBUM_THUMBNAILS_BUCKET)}
                    alt={`Vignette de ${sanitizeInput(wish.title)}`}
                    className="w-full h-full object-contain rounded-lg shadow-md bg-gray-50"
                    onLoad={handleImageLoad}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </AspectRatio>
              </div>
            )}
            
            <div className="flex flex-col gap-4 mb-4">
              <h1 className="text-2xl sm:text-3xl font-serif text-tranches-charcoal">
                {sanitizeInput(wish.title)}
              </h1>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto">
                {canManagePublication && (
                  <Button
                    variant={wish.published ? "outline" : "default"}
                    className={`w-full sm:w-auto ${!wish.published ? "bg-tranches-sage hover:bg-tranches-sage/90" : ""}`}
                    onClick={handlePublishToggle}
                    disabled={publishLoading}
                  >
                    {publishLoading ? "En cours..." : wish.published ? "Mettre en brouillon" : "Publier"}
                  </Button>
                )}
                {canEdit && (
                  <Button asChild variant="outline" className="w-full sm:w-auto">
                    <Link to={`/wishes/edit/${wish.id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Éditer
                    </Link>
                  </Button>
                )}
                {canDelete && (
                  <Button 
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {deleteLoading ? "Suppression..." : "Supprimer"}
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {format(new Date(wish.created_at), 'EEEE d MMMM yyyy', { locale: fr })}
              </div>
              
              {/* Affichage du nom de l'auteur */}
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                Auteur : {wish.profiles?.display_name || 'Utilisateur anonyme'}
              </div>
              
              {wish.album && (
                <Badge variant="outline">{sanitizeInput(wish.album.name)}</Badge>
              )}
              
              {!wish.published && (
                <Badge variant="destructive">Brouillon</Badge>
              )}
            </div>
          </div>
          
          {/* Informations personnelles */}
          <div className="space-y-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-medium mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Informations personnelles
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Prénom</label>
                  <p className="text-gray-900">{sanitizeInput(wish.first_name || 'Non renseigné')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Lieu où doit se dérouler le souhait
                  </label>
                  {renderLocation()}
                </div>
              </div>
            </div>

            {/* Type de demande */}
            <div>
              <h2 className="text-xl font-medium mb-2">Type de demande</h2>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{requestTypeText}</Badge>
              </div>
            </div>

            {/* Date souhaitée */}
            {wish.date && (
              <div>
                <h2 className="text-xl font-medium mb-2 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Date souhaitée
                </h2>
                <p className="text-gray-700">
                  {format(new Date(wish.date), 'EEEE d MMMM yyyy', { locale: fr })}
                </p>
              </div>
            )}

            {/* Description du souhait */}
            <div>
              <h2 className="text-xl font-medium mb-2">Description du souhait</h2>
              <div className="prose prose-gray max-w-none bg-gray-50 rounded-lg p-4">
                {renderSecureContent(wish.content)}
              </div>
            </div>
            
            {/* Pourquoi c'est important */}
            <div>
              <h2 className="text-xl font-medium mb-2">Pourquoi c'est important</h2>
              <div className="prose prose-gray max-w-none bg-gray-50 rounded-lg p-4">
                {renderSecureContent(wish.importance)}
              </div>
            </div>
            
            {/* Besoins concrets */}
            <div>
              <h2 className="text-xl font-medium mb-2">Besoins concrets</h2>
              <div className="prose prose-gray max-w-none bg-gray-50 rounded-lg p-4">
                {renderSecureContent(wish.needs)}
              </div>
            </div>
            
            {/* Ce que je peux offrir en retour */}
            <div>
              <h2 className="text-xl font-medium mb-2">Ce que je peux offrir en retour</h2>
              <div className="prose prose-gray max-w-none bg-gray-50 rounded-lg p-4">
                {renderSecureContent(wish.offering)}
              </div>
            </div>
            
            {/* Documents ou liens */}
            <div>
              <h2 className="text-xl font-medium mb-2">Documents ou liens</h2>
              {renderSecureLink(wish.attachment_url)}
            </div>
          </div>
          
          {/* Contact - utilisé seulement le prénom, plus d'email */}
          <div className="mt-8 pt-6 border-t">
            <h2 className="text-xl font-medium mb-4 flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Contact
            </h2>
            <p className="text-gray-700">
              Pour contacter {sanitizeInput(wish.first_name || 'l\'auteur')}, 
              veuillez utiliser les canaux de communication habituels de la plateforme.
            </p>
          </div>
        </div>

        {/* Notification pour les auteurs */}
        {isAuthor && wish.published && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Notifier votre groupe de ce souhait
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Envoyez un email aux membres de votre groupe
                </p>
              </div>
              <GroupNotificationButton
                contentType="wish"
                contentId={wish.id}
                title={wish.title}
                isNotificationSent={wish.email_notification_sent}
                onNotificationSent={handleNotificationSent}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishPost;
