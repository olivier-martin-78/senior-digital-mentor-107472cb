
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';

const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-serif text-tranches-charcoal mb-4">Accès refusé</h1>
        <p className="text-lg text-gray-600 mb-8 text-center">
          Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
        </p>
        <div className="flex gap-4">
          <Button asChild>
            <Link to="/">Retour à l'accueil</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/blog">Aller au blog</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
