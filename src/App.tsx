
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import PrivateApp from "./components/PrivateApp";
import PublicApp from "./components/PublicApp";
import { useOptionalAuth } from "@/hooks/useOptionalAuth";
import { SecurityMonitor } from "@/components/security/SecurityMonitor";
import { PublicMiniSite } from "@/pages/PublicMiniSite";

import { MiniSitePreview } from "@/pages/MiniSitePreview";

const queryClient = new QueryClient();

const AppContent = () => {
  // LOGS DE DEBUG TRÈS BASIQUES POUR INVESTIGUER LE PROBLÈME MOBILE
  console.log('🔥 [APP_DEBUG] AppContent démarré - timestamp:', Date.now());
  console.log('🔥 [APP_DEBUG] URL actuelle:', window.location.href);
  console.log('🔥 [APP_DEBUG] User agent:', navigator.userAgent);
  
  const { user, isLoading } = useOptionalAuth();
  
  console.log('🔥 [APP_DEBUG] Hook auth result:', { user: !!user, isLoading });

  if (isLoading) {
    console.log('🔥 [APP_DEBUG] Affichage écran de chargement');
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  console.log('🔥 [APP_DEBUG] Rendu des routes - user:', !!user);
  
  return (
    <>
      <Routes>
        {/* Simplified routing - let PrivateApp and PublicApp handle specific routes */}
        <Route 
          path="/*" 
          element={
            (() => {
              console.log('🔥 [APP_DEBUG] Routing vers', user ? 'PrivateApp' : 'PublicApp', 'pour path:', window.location.pathname);
              return user ? <PrivateApp /> : <PublicApp />;
            })()
          } 
        />
      </Routes>
      <SecurityMonitor />
    </>
  );
};

const App = () => {
  console.log('🔥 [APP_DEBUG] App principal démarré');
  console.log('🔥 [APP_DEBUG] Document ready state:', document.readyState);
  console.log('🔥 [APP_DEBUG] Window loaded:', document.readyState === 'complete');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
