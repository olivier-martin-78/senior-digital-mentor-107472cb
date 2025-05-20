
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PlusCircle, Search, CalendarIcon } from 'lucide-react';
import { Profile, WishPost, WishAlbum } from '@/types/supabase';

interface WishPostWithAuthor extends WishPost {
  profiles: Profile;
}

const Wishes = () => {
  const { user, hasRole } = useAuth();
  const [wishes, setWishes] = useState<WishPostWithAuthor[]>([]);
  const [albums, setAlbums] = useState<WishAlbum[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Fetch albums and wishes
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        // Fetch albums - get only albums that the user has access to
        const { data: albumsData, error: albumsError } = await supabase
          .from('wish_albums')
          .select(`*, profiles:author_id(*)`)
          .order('name', { ascending: true });

        if (!albumsError && albumsData) {
          setAlbums(albumsData as WishAlbum[]);
        } else if (albumsError) {
          console.error('Erreur lors du chargement des albums de souhaits:', albumsError);
        }
      } catch (error) {
        console.error('Error fetching wish albums:', error);
      }
    };

    fetchAlbums();
  }, [user?.id]);

  // Fetch wishes with filters
  useEffect(() => {
    const fetchWishes = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('wish_posts')
          .select(`
            *,
            profiles:author_id(*)
          `)
          .order('created_at', { ascending: false });

        if (selectedAlbum) {
          query = query.eq('album_id', selectedAlbum);
        }

        if (searchQuery.trim()) {
          query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        setWishes(data as WishPostWithAuthor[]);
      } catch (error) {
        console.error('Error fetching wishes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishes();
  }, [user, selectedAlbum, searchQuery, albums]);

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif text-tranches-charcoal">Souhaits</h1>
          <Button asChild className="bg-tranches-sage hover:bg-tranches-sage/90">
            <Link to="/wish-form">
              <PlusCircle className="mr-2 h-5 w-5" />
              Nouveau souhait
            </Link>
          </Button>
        </div>

        {/* Search and filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative w-full md:w-1/2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un souhait..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedAlbum || 'all'} onValueChange={(value) => setSelectedAlbum(value === 'all' ? null : value)}>
              <SelectTrigger className="w-full md:w-1/4">
                <SelectValue placeholder="Tous les albums de souhaits" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les albums de souhaits</SelectItem>
                {albums.map(album => (
                  <SelectItem key={album.id} value={album.id}>{album.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
          </div>
        ) : wishes.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-serif text-tranches-charcoal mb-4">Aucun souhait</h2>
            <p className="text-gray-600">
              {searchQuery || selectedAlbum
                ? "Aucun souhait ne correspond à vos critères de recherche."
                : "Les souhaits apparaîtront ici une fois publiés."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishes.filter(wish => wish.published || (user && wish.author_id === user.id)).map(wish => (
              <Card key={wish.id} className={`overflow-hidden ${!wish.published ? 'border-orange-300' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      <Link to={`/wishes/${wish.id}`} className="hover:text-tranches-sage transition-colors">
                        {wish.title}
                      </Link>
                    </CardTitle>
                    {wish.request_type && (
                      <Badge variant="outline" className="capitalize">
                        {wish.request_type === 'other' && wish.custom_request_type ? wish.custom_request_type : wish.request_type}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    {wish.first_name || wish.profiles?.display_name || 'Utilisateur'} • {formatDate(wish.created_at)}
                    {!wish.published && ' • Brouillon'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-gray-600">
                    {wish.content.substring(0, 150)}...
                  </p>
                  
                  {wish.date && (
                    <div className="flex items-center mt-3 text-sm text-gray-500">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {new Date(wish.date).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/wishes/${wish.id}`}>Voir le détail</Link>
                  </Button>
                  {(hasRole('admin') || hasRole('editor')) && (
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/wishes/edit/${wish.id}`}>Éditer</Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {(hasRole('admin')) && (
          <div className="mt-12 p-6 border rounded-lg bg-gray-50">
            <h2 className="text-xl font-medium mb-4">Administration des albums de souhaits</h2>
            <p className="mb-4 text-sm text-gray-600">
              En tant qu'administrateur, vous pouvez gérer les albums de souhaits et définir quels utilisateurs peuvent accéder à chaque album.
            </p>
            <Button asChild variant="outline">
              <Link to="/admin/wish-albums">
                Gérer les albums de souhaits
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishes;
