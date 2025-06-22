
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import WishForm from './WishForm';

const WishNew = () => {
  const navigate = useNavigate();
  
  // Vérification sécurisée de l'authentification
  let user = null;
  let isLoading = true;
  
  try {
    const authContext = useAuth();
    user = authContext.user;
    isLoading = authContext.isLoading;
  } catch (error) {
    // Si useAuth échoue, cela signifie que nous ne sommes pas dans un AuthProvider
    console.log('WishNew - Pas dans un AuthProvider, redirection vers /auth');
    isLoading = false;
  }

  console.log('WishNew - État auth:', { user: !!user, isLoading });

  // Redirection si pas d'authentification
  useEffect(() => {
    if (!isLoading && !user) {
      console.log('WishNew - Redirection vers /auth (utilisateur non connecté)');
      navigate('/auth', { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Show loading while authentication is being checked
  if (isLoading) {
    console.log('WishNew - Chargement de l\'authentification');
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Si pas d'utilisateur, ne rien rendre (la redirection va s'effectuer)
  if (!user) {
    return null;
  }

  console.log('WishNew - Rendu du formulaire');
  return <WishForm />;
};

export default WishNew;
