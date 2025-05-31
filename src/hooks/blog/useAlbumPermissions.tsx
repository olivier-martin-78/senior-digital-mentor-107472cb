
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BlogAlbum } from '@/types/supabase';
import { useToast } from '@/hooks/use-toast';

export const useAlbumPermissions = (allAlbums: BlogAlbum[]) => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [accessibleAlbums, setAccessibleAlbums] = useState<BlogAlbum[]>([]);

  useEffect(() => {
    const getAccessibleAlbums = async () => {
      if (!user) {
        console.log('AlbumPermissions - Pas d\'utilisateur connecté');
        setAccessibleAlbums([]);
        return;
      }

      try {
        console.log('AlbumPermissions - Utilisation des nouvelles politiques consolidées');
        
        // Avec les nouvelles politiques RLS consolidées, nous pouvons grandement simplifier
        // La politique "blog_albums_select_consolidated" gère automatiquement :
        // - Admin voit tout
        // - Propriétaire voit ses albums
        // - Utilisateurs avec permissions voient les albums autorisés
        
        // Les albums dans allAlbums sont déjà filtrés par les politiques RLS
        // donc nous pouvons les utiliser directement
        console.log('AlbumPermissions - Albums déjà filtrés par RLS:', allAlbums.length);
        setAccessibleAlbums(allAlbums);
        
      } catch (error: any) {
        console.error('AlbumPermissions - Erreur:', error);
        // En cas d'erreur, utiliser une liste vide
        setAccessibleAlbums([]);
        
        toast({
          title: "Erreur",
          description: "Impossible de charger les albums accessibles.",
          variant: "destructive"
        });
      }
    };

    getAccessibleAlbums();
  }, [allAlbums, user, hasRole, toast]);

  return { accessibleAlbums, setAccessibleAlbums };
};
