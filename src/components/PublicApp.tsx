
import React from 'react';
import HeaderWrapper from '@/components/HeaderWrapper';
import { Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import FitnessHome from '@/pages/FitnessHome';
import Auth from '@/pages/Auth';
import ResetPassword from '@/pages/ResetPassword';
import AuthConfirm from '@/pages/AuthConfirm';
import ResendConfirmation from '@/pages/ResendConfirmation';
import PublicSubscription from '@/pages/PublicSubscription';
import ProfessionalModule from '@/pages/ProfessionalModule';
import { PublicMiniSite } from '@/pages/PublicMiniSite';
import { PublicReviewForm } from '@/pages/PublicReviewForm';
import { MiniSitePreview } from '@/pages/MiniSitePreview';
import FitnessArticle from '@/pages/FitnessArticle';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const PublicApp: React.FC = () => {
  return (
    <>
      <HeaderWrapper />
      <Routes>
        {/* Mini-site routes - accessible without authentication */}
        <Route path="/mini-site/builder" element={<Auth />} />
        <Route path="/mini-site/preview" element={<MiniSitePreview />} />
        <Route path="/mini-site/:slug" element={<PublicMiniSite />} />
        
        <Route path="/" element={<FitnessHome />} />
        <Route path="/fitness" element={<FitnessHome />} />
        <Route path="/fitness/article/:id" element={
          <ErrorBoundary>
            <FitnessArticle />
          </ErrorBoundary>
        } />
        <Route path="/home" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/confirm" element={<AuthConfirm />} />
        <Route path="/resend-confirmation" element={<ResendConfirmation />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/subscription" element={<PublicSubscription />} />
        <Route path="/module-pro" element={<ProfessionalModule />} />
        <Route path="/activities/games" element={<Auth />} />
        <Route path="/avis/:token" element={<PublicReviewForm />} />
      </Routes>
    </>
  );
};

export default PublicApp;
