
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import AlbumPermissions from '@/components/admin/AlbumPermissions';

const AdminAlbums = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  console.log('🎬 AdminAlbums - Composant monté');

  // Redirection si l'utilisateur n'est pas administrateur
  React.useEffect(() => {
    console.log('🔐 AdminAlbums - Vérification permissions:', {
      hasAdminRole: hasRole('admin'),
      timestamp: new Date().toISOString()
    });

    if (!hasRole('admin')) {
      console.log('❌ AdminAlbums - Accès refusé, redirection vers /unauthorized');
      navigate('/unauthorized');
    } else {
      console.log('✅ AdminAlbums - Permissions validées, accès autorisé');
    }
  }, [hasRole, navigate]);

  console.log('🖼️ AdminAlbums - Rendu composant');

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-serif text-tranches-charcoal mb-8">Gérer les albums</h1>
        {console.log('📦 AdminAlbums - Rendu AlbumPermissions')}
        <AlbumPermissions />
      </div>
    </div>
  );
};

export default AdminAlbums;
