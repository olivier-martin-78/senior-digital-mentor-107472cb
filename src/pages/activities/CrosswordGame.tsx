
import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import { ArrowLeft } from 'lucide-react';
import CrosswordBoard from '@/components/activities/CrosswordBoard';

const CrosswordGame = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Link 
          to="/activities/games" 
          className="inline-flex items-center text-tranches-dustyblue hover:text-tranches-dustyblue/80 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux jeux
        </Link>
        <CrosswordBoard />
      </div>
    </div>
  );
};

export default CrosswordGame;
