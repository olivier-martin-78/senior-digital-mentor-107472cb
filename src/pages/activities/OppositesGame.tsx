
import React from 'react';
import Header from '@/components/Header';
import OppositesGameBoard from '@/components/activities/OppositesGameBoard';

const OppositesGame = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="pt-20">
        <OppositesGameBoard />
      </div>
    </div>
  );
};

export default OppositesGame;
