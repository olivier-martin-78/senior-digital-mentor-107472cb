
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

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, isLoading } = useOptionalAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Public mini-site route - accessible without authentication */}
        <Route path="/mini-site/:slug" element={<PublicMiniSite />} />
        {/* All other routes go through auth-based routing */}
        <Route path="/*" element={user ? <PrivateApp /> : <PublicApp />} />
      </Routes>
      <SecurityMonitor />
    </>
  );
};

const App = () => (
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

export default App;
