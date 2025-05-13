
import React from 'react';
import HeroSection from '@/components/HeroSection';
import WhySection from '@/components/WhySection';
import HowItWorksSection from '@/components/HowItWorksSection';
import ExamplesSection from '@/components/ExamplesSection';
import JoinSection from '@/components/JoinSection';
import ManifestSection from '@/components/ManifestSection';
import Footer from '@/components/Footer';
import ScrollAnimation from '@/components/ScrollAnimation';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <ScrollAnimation />
      <HeroSection />
      <WhySection />
      <HowItWorksSection />
      <ExamplesSection />
      <JoinSection />
      <ManifestSection />
      <Footer />
    </div>
  );
};

export default Index;
