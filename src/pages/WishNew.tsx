
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import WishForm from './WishForm';
import { Navigate } from 'react-router-dom';

const WishNew = () => {
  const { user, isLoading } = useAuth();

  console.log('WishNew - État auth:', { user: !!user, isLoading });

  // Show loading while authentication is being checked
  if (isLoading) {
    console.log('WishNew - Chargement de l\'authentification');
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Redirect to auth if user is not authenticated
  if (!user) {
    console.log('WishNew - Redirection vers /auth (utilisateur non connecté)');
    return <Navigate to="/auth" replace />;
  }

  console.log('WishNew - Rendu du formulaire');
  return <WishForm />;
};

export default WishNew;
