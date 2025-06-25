
import React from 'react';

const HeroSection = () => {
  const scrollToActivities = () => {
    const activitiesSection = document.getElementById('activities-section');
    if (activitiesSection) {
      activitiesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
        style={{ 
          backgroundImage: "url('/lovable-uploads/268baaf6-cc72-4fd0-b786-6c48d7ee83bc11.png')",
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
      </div>
      
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4 pt-16">
        <div className="max-w-3xl">
          <p className="text-xl md:text-2xl text-white mb-8">
            Offrez-leur le digital, ils vous offriront leurs plus belles histoires.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={scrollToActivities}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-white text-tranches-charcoal hover:bg-tranches-cream text-lg px-8"
            >
              Partager mes souvenirs<br/>et mes photos sur un blog
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
