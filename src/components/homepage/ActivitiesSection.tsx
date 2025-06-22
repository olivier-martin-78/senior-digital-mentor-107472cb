
import React from 'react';
import { BookOpen, MessageCircle, Camera, Star, Brain, Activity } from 'lucide-react';

const ActivitiesSection = () => {
  return (
    <section className="py-20 bg-tranches-beige">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-serif text-center text-tranches-charcoal mb-16">
          Découvrez toutes les activités CaprIA
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <BookOpen className="w-8 h-8 text-tranches-dustyblue mb-4" />
            <h3 className="text-xl font-serif text-tranches-charcoal mb-3">Journal intime</h3>
            <p className="text-tranches-charcoal/70 mb-4">Exprimez vos pensées en toute confidentialité. Gardez une trace de vos émotions et souvenirs précieux.</p>
            <p className="text-sm text-tranches-dustyblue font-medium">🎯 Favorise la clarté émotionnelle</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <MessageCircle className="w-8 h-8 text-tranches-dustyblue mb-4" />
            <h3 className="text-xl font-serif text-tranches-charcoal mb-3">Récit de vie</h3>
            <p className="text-tranches-charcoal/70 mb-4">Racontez votre histoire en 48 questions guidées. Créez un héritage pour vos proches.</p>
            <p className="text-sm text-tranches-dustyblue font-medium">📖 Imprimable ou publiable</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Camera className="w-8 h-8 text-tranches-dustyblue mb-4" />
            <h3 className="text-xl font-serif text-tranches-charcoal mb-3">Albums photo</h3>
            <p className="text-tranches-charcoal/70 mb-4">Transformez vos anciens albums en récits numériques vivants à partager avec vos proches.</p>
            <p className="text-sm text-tranches-dustyblue font-medium">📱 Numérisation simplifiée</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Star className="w-8 h-8 text-tranches-dustyblue mb-4" />
            <h3 className="text-xl font-serif text-tranches-charcoal mb-3">Souhaits</h3>
            <p className="text-tranches-charcoal/70 mb-4">Partagez vos envies et projets avec vos proches. Laissez-les vous aider à les réaliser.</p>
            <p className="text-sm text-tranches-dustyblue font-medium">💝 Renforce les liens familiaux</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Brain className="w-8 h-8 text-tranches-dustyblue mb-4" />
            <h3 className="text-xl font-serif text-tranches-charcoal mb-3">Jeux cognitifs</h3>
            <p className="text-tranches-charcoal/70 mb-4">Mots croisés, Sudoku, jeux de mémoire adaptés à votre rythme pour stimuler votre esprit.</p>
            <p className="text-sm text-tranches-dustyblue font-medium">🧩 Progression personnalisée</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Activity className="w-8 h-8 text-tranches-dustyblue mb-4" />
            <h3 className="text-xl font-serif text-tranches-charcoal mb-3">Gym douce</h3>
            <p className="text-tranches-charcoal/70 mb-4">Exercices physiques adaptés, yoga doux, 10 minutes par jour depuis chez vous.</p>
            <p className="text-sm text-tranches-dustyblue font-medium">🏠 Depuis votre salon</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ActivitiesSection;
