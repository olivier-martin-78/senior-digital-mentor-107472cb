import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { WishPost, WishAlbum } from '@/types/supabase';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, Plus } from 'lucide-react';
import InviteUserDialog from '@/components/InviteUserDialog';
import DateRangeFilter from '@/components/DateRangeFilter';
import { useAuth } from '@/contexts/AuthContext';

const Wishes = () => {
  const { hasRole } = useAuth();
  const [wishes, setWishes] = useState<WishPost[]>([]);
  const [albums, setAlbums] = useState<WishAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    Promise.all([fetchWishes(), fetchAlbums()]);
  }, [searchTerm, selectedAlbum, startDate, endDate]);

  const fetchWishes = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('wish_posts')
        .select(`
          *,
          profiles(display_name, email),
          album:wish_albums(name)
        `)
        .order('created_at', { ascending: false });

      // Les admins et éditeurs voient tous les souhaits, sinon seulement les publiés
      if (!hasRole('admin') && !hasRole('editor')) {
        query = query.eq('published', true);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }

      if (selectedAlbum && selectedAlbum !== 'all') {
        query = query.eq('album_id', selectedAlbum);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        const endDateTime = endDate + 'T23:59:59';
        query = query.lte('created_at', endDateTime);
      }

      const { data, error } = await query;

      if (error) throw error;
      setWishes(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des souhaits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbums = async () => {
    try {
      const { data, error } = await supabase
        .from('wish_albums')
        .select(`
          *,
          profiles(id, display_name, email, avatar_url, created_at)
        `)
        .order('name');

      if (error) throw error;
      setAlbums(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des albums:', error);
    }
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-serif text-tranches-charcoal">Souhaits</h1>
          <div className="flex gap-2">
            <InviteUserDialog />
            <Button asChild>
              <Link to="/wish-form" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nouveau souhait
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher dans les souhaits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedAlbum} onValueChange={setSelectedAlbum}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Tous les albums" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les albums</SelectItem>
              {albums.map((album) => (
                <SelectItem key={album.id} value={album.id}>
                  {album.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onClear={handleClearFilters}
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="grid gap-6 mt-6">
            {wishes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500 mb-4">Aucun souhait trouvé pour cette période.</p>
                  <Button asChild>
                    <Link to="/wish-form">Créer le premier souhait</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              wishes.map((wish) => (
                <Card key={wish.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl text-tranches-charcoal">
                        <Link to={`/wishes/${wish.id}`} className="hover:text-tranches-sage">
                          {wish.title}
                        </Link>
                      </CardTitle>
                      <div className="flex gap-2">
                        {wish.album && (
                          <span className="bg-tranches-sage text-white px-2 py-1 rounded-full text-xs">
                            {wish.album.name}
                          </span>
                        )}
                        {!wish.published && (hasRole('admin') || hasRole('editor')) && (
                          <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs">
                            Brouillon
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {wish.content}
                    </p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>
                        {wish.first_name && `Par ${wish.first_name}`}
                        {wish.profiles?.display_name && ` (${wish.profiles.display_name})`}
                      </span>
                      <span>{formatDate(wish.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishes;
