
import React from 'react';
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
import SupabaseConnectionTest from '@/components/SupabaseConnectionTest';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <ScrollAnimation />
      <Header />
      {/* Composant de test temporaire - à supprimer après diagnostic */}
      <div className="py-8 bg-gray-50">
        <SupabaseConnectionTest />
      </div>
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
