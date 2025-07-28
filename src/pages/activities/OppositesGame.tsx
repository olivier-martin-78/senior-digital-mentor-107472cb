
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import OppositesGameBoard from '@/components/activities/OppositesGameBoard';

const OppositesGame = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <Link 
          to="/activities/games" 
          className="inline-flex items-center text-tranches-dustyblue hover:text-tranches-dustyblue/80 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux jeux
        </Link>
        <OppositesGameBoard />
      </div>
    </div>
  );
};

export default OppositesGame;
