
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import HeroSection from '@/components/HeroSection';
import WhySection from '@/components/WhySection';
import HowItWorksSection from '@/components/HowItWorksSection';
import ExamplesSection from '@/components/ExamplesSection';
import JoinSection from '@/components/JoinSection';
import ManifestSection from '@/components/ManifestSection';
import Footer from '@/components/Footer';
import ScrollAnimation from '@/components/ScrollAnimation';
import Header from '@/components/Header';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/contexts/AuthContext';
import { FileText } from 'lucide-react';

const Index = () => {
  const { hasRole } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <ScrollAnimation />
      <Header />
      
      {/* Section pour les professionnels */}
      {(hasRole('professionnel') || hasRole('admin')) && (
        <section className="bg-tranches-sage/10 py-4">
          <div className="container mx-auto px-4">
            <div className="flex justify-center">
              <Button asChild className="bg-tranches-sage text-white hover:bg-tranches-sage/90">
                <Link to="/intervention-report" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Créer un compte-rendu d'intervention
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}
      
      <HeroSection />
      <WhySection />
      <HowItWorksSection />
      <ExamplesSection />
      <JoinSection />
      <ManifestSection />
      <Footer />
      <Toaster />
    </div>
  );
};

export default Index;
