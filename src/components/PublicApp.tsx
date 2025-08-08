
import React from 'react';
import HeaderWrapper from '@/components/HeaderWrapper';
import { Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import ResetPassword from '@/pages/ResetPassword';
import AuthConfirm from '@/pages/AuthConfirm';
import ResendConfirmation from '@/pages/ResendConfirmation';
import PublicSubscription from '@/pages/PublicSubscription';
import ProfessionalModule from '@/pages/ProfessionalModule';
import { PublicMiniSite } from '@/pages/PublicMiniSite';

const PublicApp: React.FC = () => {
  return (
    <>
      <HeaderWrapper />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/confirm" element={<AuthConfirm />} />
        <Route path="/resend-confirmation" element={<ResendConfirmation />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/subscription" element={<PublicSubscription />} />
        <Route path="/module-pro" element={<ProfessionalModule />} />
        <Route path="/mini-site/:slug" element={<PublicMiniSite />} />
      </Routes>
    </>
  );
};

export default PublicApp;
