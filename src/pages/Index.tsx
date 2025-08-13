
import React from 'react';
import HeroSection from '@/components/HeroSection';
import Footer from '@/components/Footer';
import ProblemSolutionSection from '@/components/homepage/ProblemSolutionSection';
import FeaturesSection from '@/components/homepage/FeaturesSection';
import ActivitiesSection from '@/components/homepage/ActivitiesSection';
import TestimonialsSection from '@/components/homepage/TestimonialsSection';
import FAQSection from '@/components/homepage/FAQSection';
import CTASection from '@/components/homepage/CTASection';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <ProblemSolutionSection />
      <FeaturesSection />
      <ActivitiesSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
