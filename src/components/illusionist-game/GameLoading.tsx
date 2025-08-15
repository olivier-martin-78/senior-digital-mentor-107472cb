import { Eye } from 'lucide-react';

export const GameLoading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
      <div className="text-center">
        <Eye className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
        <p className="text-lg text-muted-foreground">Chargement du jeu...</p>
      </div>
    </div>
  );
};