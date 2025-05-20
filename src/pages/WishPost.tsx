
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, CalendarIcon, MapPin, Clock, Edit, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WishPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  album_id: string | null;
  cover_image: string | null;
  first_name: string | null;
  email: string | null;
  age: string | null;
  location: string | null;
  request_type: string | null;
  custom_request_type: string | null;
  importance: string | null;
  date: string | null;
  needs: string | null;
  offering: string | null;
  attachment_url: string | null;
  profiles: {
    display_name: string | null;
    email: string;
  };
  album?: {
    name: string;
  } | null;
}

const WishPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  
  const [wish, setWish] = useState<WishPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishPost = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
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
          throw error;
        }
        
        if (!data) {
          navigate('/wishes');
          return;
        }
        
        // Check if user has access to non-published wish
        if (!data.published && (!user || (user.id !== data.author_id && !hasRole('admin') && !hasRole('editor')))) {
          toast({
            title: "Accès refusé",
            description: "Vous n'avez pas accès à ce souhait.",
            variant: "destructive"
          });
          navigate('/wishes');
          return;
        }
        
        setWish(data as WishPost);
      } catch (error) {
        console.error('Error fetching wish post:', error);
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
    return null;
  }

  const requestTypeText = wish.request_type === 'other' && wish.custom_request_type 
    ? wish.custom_request_type 
    : {
        'personal': 'Un souhait personnel',
        'experience': 'Une expérience à vivre',
        'service': 'Un service à recevoir',
        'other': 'Autre type de demande'
      }[wish.request_type as string] || wish.request_type;

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
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <h1 className="text-3xl font-serif text-tranches-charcoal">{wish.title}</h1>
              
              {(user?.id === wish.author_id || hasRole('admin') || hasRole('editor')) && (
                <Button asChild variant="outline">
                  <Link to={`/wishes/edit/${wish.id}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Éditer
                  </Link>
                </Button>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {new Date(wish.created_at).toLocaleDateString('fr-FR')}
              </div>
              
              {wish.date && (
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Date souhaitée: {new Date(wish.date).toLocaleDateString('fr-FR')}
                </div>
              )}
              
              {wish.location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {wish.location}
                </div>
              )}
              
              {wish.album && (
                <Badge variant="outline">{wish.album.name}</Badge>
              )}
              
              {wish.request_type && (
                <Badge variant="secondary">{requestTypeText}</Badge>
              )}
              
              {!wish.published && (
                <Badge variant="destructive">Brouillon</Badge>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              Émis par: <span className="font-medium">{wish.first_name || wish.profiles.display_name || wish.profiles.email}</span>
              {wish.age && ` • ${wish.age} ans`}
            </div>
          </div>
          
          {/* Content */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-medium mb-2">Description du souhait</h2>
              <div className="prose prose-gray max-w-none">
                {wish.content.split('\n').map((paragraph, index) => (
                  paragraph ? <p key={index}>{paragraph}</p> : <br key={index} />
                ))}
              </div>
            </div>
            
            {wish.importance && (
              <div>
                <h2 className="text-xl font-medium mb-2">Pourquoi c'est important</h2>
                <div className="prose prose-gray max-w-none">
                  {wish.importance.split('\n').map((paragraph, index) => (
                    paragraph ? <p key={index}>{paragraph}</p> : <br key={index} />
                  ))}
                </div>
              </div>
            )}
            
            {wish.needs && (
              <div>
                <h2 className="text-xl font-medium mb-2">Besoins concrets</h2>
                <div className="prose prose-gray max-w-none">
                  {wish.needs.split('\n').map((paragraph, index) => (
                    paragraph ? <p key={index}>{paragraph}</p> : <br key={index} />
                  ))}
                </div>
              </div>
            )}
            
            {wish.offering && (
              <div>
                <h2 className="text-xl font-medium mb-2">Ce que je peux offrir en retour</h2>
                <div className="prose prose-gray max-w-none">
                  {wish.offering.split('\n').map((paragraph, index) => (
                    paragraph ? <p key={index}>{paragraph}</p> : <br key={index} />
                  ))}
                </div>
              </div>
            )}
            
            {wish.attachment_url && (
              <div>
                <h2 className="text-xl font-medium mb-2">Documents ou liens</h2>
                <a 
                  href={wish.attachment_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-tranches-sage hover:underline"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Accéder au document ou lien partagé
                </a>
              </div>
            )}
          </div>
          
          {/* Contact */}
          {wish.email && (
            <div className="mt-8 pt-6 border-t">
              <h2 className="text-xl font-medium mb-4">Contact</h2>
              <Button asChild className="bg-tranches-sage hover:bg-tranches-sage/90">
                <a href={`mailto:${wish.email}`}>
                  Contacter l'auteur du souhait
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishPost;
