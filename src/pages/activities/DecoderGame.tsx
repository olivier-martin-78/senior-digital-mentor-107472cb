import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, KeySquare } from 'lucide-react';
import { DecoderGamePlayer } from '@/components/activities/DecoderGamePlayer';

const DecoderGame: React.FC = () => {
  useEffect(() => {
    document.title = 'Mot à décoder | Jeux cognitifs';
    const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      const l = document.createElement('link');
      l.rel = 'canonical';
      l.href = window.location.href;
      document.head.appendChild(l);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      <header className="container mx-auto px-4 pt-6">
        <Link to="/activities/games" className="inline-flex items-center gap-2 text-muted-foreground hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Retour aux jeux
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <KeySquare className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Mot à décoder</h1>
        </div>
        <p className="text-muted-foreground mt-1">Décoder un mot chiffré à l’aide du pavé T9. Indice thématique et aide progressive.</p>
      </header>

      <main className="container mx-auto px-4 py-8">
        <DecoderGamePlayer />
      </main>
    </div>
  );
};

export default DecoderGame;
