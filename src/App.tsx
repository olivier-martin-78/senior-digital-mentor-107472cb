
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/components/ui/toast';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';
import PrivateApp from '@/components/PrivateApp';
import PublicApp from '@/components/PublicApp';
import HeaderWrapper from '@/components/HeaderWrapper';

function AppContent() {
  const { user, isLoading } = useOptionalAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderWrapper />
      {user ? <PrivateApp /> : <PublicApp />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <SidebarProvider>
          <div className="min-h-screen bg-gray-50 w-full">
            <AppContent />
            <Toaster />
          </div>
        </SidebarProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
