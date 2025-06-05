
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { WishAlbum } from '@/types/supabase';
import { useGroupPermissions } from '../useGroupPermissions';

export const useWishAlbums = () => {
  const { user } = useAuth();
  const [albums, setAlbums] = useState<WishAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const { authorizedUserIds, loading: permissionsLoading } = useGroupPermissions();

  useEffect(() => {
    if (!user) {
      setAlbums([]);
      setLoading(false);
      return;
    }

    if (!permissionsLoading && authorizedUserIds.length > 0) {
      fetchAlbums();
    } else if (!permissionsLoading && authorizedUserIds.length === 0) {
      setAlbums([]);
      setLoading(false);
    }
  }, [user, authorizedUserIds, permissionsLoading]);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 useWishAlbums - Récupération avec permissions de groupe');
      console.log('🎯 useWishAlbums - Utilisateurs autorisés:', authorizedUserIds);

      // Récupérer les albums créés par tous les utilisateurs autorisés
      const { data, error } = await supabase
        .from('wish_albums')
        .select(`
          *,
          profiles(id, display_name, email, avatar_url, created_at)
        `)
        .in('author_id', authorizedUserIds)
        .order('name');

      if (error) {
        console.error('❌ useWishAlbums - Erreur récupération albums:', error);
        throw error;
      }

      console.log('📁 useWishAlbums - Albums récupérés:', data?.length || 0);
      setAlbums(data || []);
    } catch (error) {
      console.error('💥 useWishAlbums - Erreur lors du chargement des albums:', error);
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  };

  return { albums, loading };
};
