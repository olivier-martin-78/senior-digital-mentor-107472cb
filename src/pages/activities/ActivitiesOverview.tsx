
import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Brain, Gamepad2, Dumbbell } from 'lucide-react';
import { useActivities } from '@/hooks/useActivities';

const ActivitiesOverview = () => {
  const { activities: meditationActivities } = useActivities('meditation');
  const { activities: gamesActivities } = useActivities('games');
  const { activities: exercisesActivities } = useActivities('exercises');

  const sections = [
    {
      title: 'Relaxation',
      type: 'meditation',
      icon: Brain,
      description: 'Activités de méditation et de relaxation pour apaiser l\'esprit',
      activities: meditationActivities,
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Jeux',
      type: 'games',
      icon: Gamepad2,
      description: 'Jeux ludiques et divertissants pour stimuler l\'esprit',
      activities: gamesActivities,
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'Gym douce',
      type: 'exercises',
      icon: Dumbbell,
      description: 'Exercices doux pour maintenir la forme et la mobilité',
      activities: exercisesActivities,
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      iconColor: 'text-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-tranches-dustyblue mr-2" />
            <h1 className="text-3xl font-bold text-gray-900">Activités</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Découvrez nos différentes catégories d'activités conçues pour votre bien-être et votre épanouissement
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.type} to={`/activities/${section.type}`}>
                <Card className={`h-full transition-all duration-200 ${section.color} cursor-pointer`}>
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <Icon className={`w-12 h-12 ${section.iconColor}`} />
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-gray-600 mb-4">
                      {section.description}
                    </p>
                    <div className="text-sm text-gray-500">
                      {section.activities.length} activité{section.activities.length > 1 ? 's' : ''} disponible{section.activities.length > 1 ? 's' : ''}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Cliquez sur une catégorie pour explorer les activités disponibles
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActivitiesOverview;
