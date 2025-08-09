
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
        {/* Mini-site routes - accessible without authentication */}
        <Route 
          path="/mini-site/builder" 
          element={
            (() => {
              console.log('🔥 [PUBLIC_APP_DEBUG] Route /mini-site/builder matchée - redirection vers /auth');
              return <Auth />;
            })()
          } 
        />
        <Route 
          path="/mini-site/preview" 
          element={
            (() => {
              console.log('🔥 [PUBLIC_APP_DEBUG] Route /mini-site/preview matchée');
              return <PublicMiniSite />;
            })()
          } 
        />
        <Route 
          path="/mini-site/:slug" 
          element={
            (() => {
              console.log('🔥 [PUBLIC_APP_DEBUG] Route /mini-site/:slug matchée');
              return <PublicMiniSite />;
            })()
          } 
        />
        
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/confirm" element={<AuthConfirm />} />
        <Route path="/resend-confirmation" element={<ResendConfirmation />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/subscription" element={<PublicSubscription />} />
        <Route path="/module-pro" element={<ProfessionalModule />} />
      </Routes>
    </>
  );
};

export default PublicApp;
