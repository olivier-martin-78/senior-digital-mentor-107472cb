
import React from 'react';
import HeroSection from '@/components/HeroSection';
import PublicFooter from '@/components/PublicFooter';
import ProblemSolutionSection from '@/components/homepage/ProblemSolutionSection';
import FeaturesSection from '@/components/homepage/FeaturesSection';
import ActivitiesSection from '@/components/homepage/ActivitiesSection';
import TestimonialsSection from '@/components/homepage/TestimonialsSection';
import ProfessionalSection from '@/components/homepage/ProfessionalSection';
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
      <ProfessionalSection />
      <FAQSection />
      <CTASection />
      <PublicFooter />   
    </div>
  );
};

export default Index;
