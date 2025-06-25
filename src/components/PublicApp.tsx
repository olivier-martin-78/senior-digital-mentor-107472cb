
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import ResetPassword from '@/pages/ResetPassword';
import PublicSubscription from '@/pages/PublicSubscription';

const PublicApp: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/subscription" element={<PublicSubscription />} />
    </Routes>
  );
};

export default PublicApp;
