
import React from 'react';
import { useHomepageSlides } from '@/hooks/useHomepageSlides';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import Autoplay from 'embla-carousel-autoplay';

const HeroSection = () => {
  const { data: slides, isLoading } = useHomepageSlides();

  const scrollToActivities = () => {
    const activitiesSection = document.getElementById('activities-section');
    if (activitiesSection) {
      activitiesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleButtonClick = (buttonLink?: string) => {
    if (!buttonLink) return;
    
    if (buttonLink.startsWith('#')) {
      const element = document.getElementById(buttonLink.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.open(buttonLink, '_blank');
    }
  };

  if (isLoading || !slides || slides.length === 0) {
    // Fallback to original static content while loading or if no slides
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <div className="h-screen">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
            style={{ 
              backgroundImage: "url('/lovable-uploads/268baaf6-cc72-4fd0-b786-6c48d7ee83bc11.png')",
            }}
          >
            <div className="absolute inset-0 bg-black/20"></div>
          </div>
          
          <div className="relative h-full flex flex-col items-center justify-center text-center px-4 pt-20">
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
            
            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
              <button 
                onClick={scrollToActivities}
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Scroll to content"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <Carousel 
        className="h-screen"
        plugins={[
          Autoplay({
            delay: 3000,
            stopOnInteraction: true,
          }),
        ]}
      >
        <CarouselContent className="h-screen">
          {slides.map((slide) => (
            <CarouselItem key={slide.id} className="h-screen">
              <div className="relative h-full w-full">
                {slide.media_type === 'image' ? (
                  <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
                    style={{ 
                      backgroundImage: `url('${slide.media_url}')`,
                    }}
                  >
                    <div className="absolute inset-0 bg-black/20"></div>
                  </div>
                ) : (
                  <>
                    <video 
                      src={slide.media_url}
                      className="absolute inset-0 w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                    <div className="absolute inset-0 bg-black/20"></div>
                  </>
                )}
                
                <div className="relative h-full flex flex-col items-center justify-center text-center px-4 pt-20">
                  <div className="max-w-3xl">
                    <p className="text-xl md:text-2xl text-white mb-8">
                      {slide.title}
                    </p>
                    {slide.button_text && (
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button 
                          onClick={() => handleButtonClick(slide.button_link)}
                          className="bg-white text-tranches-charcoal hover:bg-tranches-cream text-lg px-8"
                        >
                          {slide.button_text}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Scroll indicator */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                    <button 
                      onClick={scrollToActivities}
                      className="text-white/80 hover:text-white transition-colors"
                      aria-label="Scroll to content"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {slides.length > 1 && (
          <>
            <CarouselPrevious className="left-4 bg-white/10 border-white/20 text-white hover:bg-white/20" />
            <CarouselNext className="right-4 bg-white/10 border-white/20 text-white hover:bg-white/20" />
          </>
        )}
      </Carousel>
    </div>
  );
};

export default HeroSection;
