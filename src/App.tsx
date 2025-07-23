
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Activities from "./pages/Activities";
import ActivityPage from "./pages/activities/ActivityPage";
import DictationGamePage from "./pages/activities/DictationGamePage";
import OppositesGame from "./pages/activities/OppositesGame";
import SudokuGame from "./pages/activities/SudokuGame";
import CrosswordGame from "./pages/activities/CrosswordGame";
import TranslationGame from "./pages/activities/TranslationGame";
import Quiz70sGame from "./pages/activities/Quiz70sGame";
import Admin from "./pages/Admin";
import AdminActivities from "./pages/admin/AdminActivities";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSubTags from "./pages/admin/AdminSubTags";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/activities" element={<ProtectedRoute><Activities /></ProtectedRoute>} />
            <Route path="/activities/:type" element={<ProtectedRoute><ActivityPage /></ProtectedRoute>} />
            <Route path="/activities/dictation/:id" element={<ProtectedRoute><DictationGamePage /></ProtectedRoute>} />
            <Route path="/activities/opposites" element={<ProtectedRoute><OppositesGame /></ProtectedRoute>} />
            <Route path="/activities/sudoku" element={<ProtectedRoute><SudokuGame /></ProtectedRoute>} />
            <Route path="/activities/crossword" element={<ProtectedRoute><CrosswordGame /></ProtectedRoute>} />
            <Route path="/activities/translation" element={<ProtectedRoute><TranslationGame /></ProtectedRoute>} />
            <Route path="/activities/quiz70s" element={<ProtectedRoute><Quiz70sGame /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="/admin/activities/:type" element={<AdminRoute><AdminActivities /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/sub-tags" element={<AdminRoute><AdminSubTags /></AdminRoute>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
