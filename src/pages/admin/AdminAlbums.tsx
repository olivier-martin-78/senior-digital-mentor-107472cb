
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import AlbumPermissions from '@/components/admin/AlbumPermissions';

const AdminAlbums = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  // Redirection si l'utilisateur n'est pas administrateur
  React.useEffect(() => {
    if (!hasRole('admin')) {
      navigate('/unauthorized');
    }
  }, [hasRole, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-serif text-tranches-charcoal mb-8">Gérer les albums</h1>
        <AlbumPermissions />
      </div>
    </div>
  );
};

export default AdminAlbums;
