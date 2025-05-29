
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

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <ScrollAnimation />
      <Header />
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
