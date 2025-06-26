
import { BookOpen } from 'lucide-react';

export const GameLoading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-pulse" />
        <p className="text-lg text-gray-600">Chargement du jeu...</p>
      </div>
    </div>
  );
};
