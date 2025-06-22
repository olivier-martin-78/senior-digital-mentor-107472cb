
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import WishCard from '@/components/WishCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Calendar } from 'lucide-react';
import { useWishAlbums } from '@/hooks/wish/useWishAlbums';
import { useWishPosts } from '@/hooks/wish/useWishPosts';
import WishAlbumSelector from '@/components/WishAlbumSelector';
import DateRangeFilter from '@/components/DateRangeFilter';
import InviteUserDialog from '@/components/InviteUserDialog';
import { useGroupPermissions } from '@/hooks/useGroupPermissions';

const Wishes = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { isInvitedUser } = useGroupPermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const { albums, loading: albumsLoading } = useWishAlbums();
  const { posts, loading: postsLoading } = useWishPosts(searchTerm, selectedAlbum || '', startDate, endDate);

  console.log('📖 Wishes - Vérification utilisateur invité:', {
    isInvitedUser
  });

  if (!session) {
    navigate('/auth');
    return null;
  }

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedAlbum(null);
  };

  const handleAlbumsUpdate = () => {
    // This would trigger a refetch of albums if needed
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-serif text-tranches-charcoal">Souhaits</h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {!isInvitedUser && (
              <div className="w-full sm:w-auto">
                <InviteUserDialog />
              </div>
            )}
            <Button 
              onClick={() => navigate('/wishes/new')}
              className="bg-tranches-dustyblue hover:bg-tranches-dustyblue/90 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau souhait
            </Button>
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher des souhaits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <WishAlbumSelector
              wishAlbums={albums}
              selectedAlbumId={selectedAlbum || ''}
              onAlbumChange={setSelectedAlbum}
              onAlbumsUpdate={handleAlbumsUpdate}
            />
          </div>
          
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onClear={handleClearFilters}
          />
        </div>

        {/* Grille des souhaits */}
        {postsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-white rounded-lg p-6 space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <WishCard key={post.id} wish={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun souhait trouvé</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedAlbum || startDate || endDate
                ? 'Aucun souhait ne correspond à vos critères de recherche.'
                : 'Commencez par créer votre premier souhait.'}
            </p>
            {!isInvitedUser && !searchTerm && !selectedAlbum && !startDate && !endDate && (
              <Button 
                onClick={() => navigate('/wishes/new')}
                className="bg-tranches-dustyblue hover:bg-tranches-dustyblue/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer mon premier souhait
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishes;
