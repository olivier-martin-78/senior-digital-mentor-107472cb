
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HeaderWrapper from '@/components/HeaderWrapper';
import PublicApp from '@/components/PublicApp';

const queryClient = new QueryClient();

// Lazy load PrivateApp to avoid loading Supabase code for public routes
const PrivateApp = lazy(() => import('@/components/PrivateApp'));

// Component to handle route-based app selection
const AppRouter: React.FC = () => {
  const location = useLocation();
  // Ensure /subscription is treated as a public route
  const isPublicRoute = ['/', '/auth', '/reset-password', '/subscription'].includes(location.pathname);

  return (
    <>
      <HeaderWrapper />
      {isPublicRoute ? (
        <PublicApp />
      ) : (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Chargement...</div>}>
          <PrivateApp />
        </Suspense>
      )}
    </>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
