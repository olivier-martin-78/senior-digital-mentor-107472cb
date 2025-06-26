import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from '@/pages/Index';
import ActivitiesOverview from '@/pages/activities/ActivitiesOverview';
import ActivityPage from '@/pages/activities/ActivityPage';
import InterventionReport from '@/pages/InterventionReport';
import Login from '@/pages/Login';
import Profile from '@/pages/Profile';
import Admin from '@/pages/Admin';
import ErrorPage from '@/pages/ErrorPage';
import Contact from '@/pages/Contact';
import LegalMentions from '@/pages/LegalMentions';
import Confidentiality from '@/pages/Confidentiality';
import Accessibility from '@/pages/Accessibility';
import CGU from '@/pages/CGU';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/hooks/use-toast';
import { SidebarProvider } from '@/components/ui/sidebar';
import OppositesGame from '@/pages/activities/OppositesGame';
import SudokuGame from '@/pages/activities/SudokuGame';
import CrosswordGame from '@/pages/activities/CrosswordGame';
import TranslationGame from '@/pages/activities/TranslationGame';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/intervention-report" element={<InterventionReport />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/legal-mentions" element={<LegalMentions />} />
          <Route path="/confidentiality" element={<Confidentiality />} />
          <Route path="/accessibility" element={<Accessibility />} />
          <Route path="/cgu" element={<CGU />} />
          
          {/* Activités routes */}
          <Route path="/activities" element={<ActivitiesOverview />} />
          <Route path="/activities/:type" element={<ActivityPage />} />
          <Route path="/activities/opposites" element={<OppositesGame />} />
          <Route path="/activities/sudoku" element={<SudokuGame />} />
          <Route path="/activities/crossword" element={<CrosswordGame />} />
          <Route path="/activities/translation" element={<TranslationGame />} />
          
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
