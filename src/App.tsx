
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import Index from './pages/Index';
import Auth from './pages/Auth';
import AuthConfirm from './pages/AuthConfirm';
import ResetPassword from './pages/ResetPassword';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';
import Recent from './pages/Recent';
import Diary from './pages/Diary';
import DiaryNew from './pages/DiaryNew';
import DiaryEntry from './pages/DiaryEntry';
import DiaryEdit from './pages/DiaryEdit';
import Blog from './pages/Blog';
import BlogEditor from './pages/BlogEditor';
import BlogPost from './pages/BlogPost';
import LifeStory from './pages/LifeStory';
import Wishes from './pages/Wishes';
import WishNew from './pages/WishNew';
import WishPost from './pages/WishPost';
import WishEdit from './pages/WishEdit';
import WishForm from './pages/WishForm';
import Profile from './pages/Profile';
import Subscription from './pages/Subscription';
import NotFound from './pages/NotFound';
import PublicSubscription from './pages/PublicSubscription';
import ProfessionalScheduler from './pages/ProfessionalScheduler';
import ProfessionalModule from './pages/ProfessionalModule';
import InterventionReport from './pages/InterventionReport';
import AILanding from './pages/AILanding';
import CaprIA from './pages/CaprIA';
import MyInvitationGroups from './pages/MyInvitationGroups';
import BlogLanding from './pages/BlogLanding';
import Caregivers from './pages/Caregivers';
import HeaderWrapper from './components/HeaderWrapper';

// Import admin components
import AdminUsers from './pages/admin/AdminUsers';
import AdminPosts from './pages/admin/AdminPosts';
import AdminActivities from './pages/admin/AdminActivities';
import AdminAlbums from './pages/admin/AdminAlbums';
import AdminWishAlbums from './pages/admin/AdminWishAlbums';
import AdminDiary from './pages/admin/AdminDiary';
import AdminLifeStories from './pages/admin/AdminLifeStories';
import AdminInvitationGroups from './pages/admin/AdminInvitationGroups';
import AdminPermissionsDiagnostic from './pages/admin/AdminPermissionsDiagnostic';

// Import activities components
import ActivitiesOverview from './pages/activities/ActivitiesOverview';
import ActivityPage from './pages/activities/ActivityPage';
import CrosswordGame from './pages/activities/CrosswordGame';
import SudokuGame from './pages/activities/SudokuGame';
import OppositesGame from './pages/activities/OppositesGame';
import TranslationGame from './pages/activities/TranslationGame';
import Quiz70sGame from './pages/activities/Quiz70sGame';

const queryClient = new QueryClient();

function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <HeaderWrapper />
            <div className="flex-1">
              <Routes>
                {/* Routes publiques */}
                <Route path="/" element={<Index />} />
                <Route path="/public-subscription" element={<PublicSubscription />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth-confirm" element={<AuthConfirm />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/blog-landing" element={<BlogLanding />} />
                <Route path="/ai-landing" element={<AILanding />} />
                
                {/* Route subscription - accessible aux utilisateurs authentifiés même avec accès expiré */}
                <Route element={<ProtectedRoute requiresFullAccess={false} />}>
                  <Route path="/subscription" element={<Subscription />} />
                </Route>

                {/* Routes protégées */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/recent" element={<Recent />} />
                  <Route path="/diary" element={<Diary />} />
                  <Route path="/diary/new" element={<DiaryNew />} />
                  <Route path="/diary/:id" element={<DiaryEntry />} />
                  <Route path="/diary/edit/:id" element={<DiaryEdit />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/new" element={<BlogEditor />} />
                  <Route path="/blog/:id" element={<BlogPost />} />
                  <Route path="/blog/edit/:id" element={<BlogEditor />} />
                  <Route path="/life-story" element={<LifeStory />} />
                  <Route path="/wishes" element={<Wishes />} />
                  <Route path="/wishes/new" element={<WishNew />} />
                  <Route path="/wishes/:id" element={<WishPost />} />
                  <Route path="/wishes/edit/:id" element={<WishEdit />} />
                  <Route path="/wishes/form/:id" element={<WishForm />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/my-invitation-groups" element={<MyInvitationGroups />} />
                  
                  {/* Routes d'activités */}
                  <Route path="/activities" element={<ActivitiesOverview />} />
                  <Route path="/activities/:type" element={<ActivityPage />} />
                  <Route path="/activities/crossword" element={<CrosswordGame />} />
                  <Route path="/activities/sudoku" element={<SudokuGame />} />
                  <Route path="/activities/opposites" element={<OppositesGame />} />
                  <Route path="/activities/translation" element={<TranslationGame />} />
                  <Route path="/activities/quiz70s" element={<Quiz70sGame />} />
                  
                  {/* Routes professionnelles */}
                  <Route path="/professional-scheduler" element={<ProfessionalScheduler />} />
                  <Route path="/professional-module" element={<ProfessionalModule />} />
                  <Route path="/module-pro" element={<ProfessionalModule />} />
                  <Route path="/intervention-report" element={<InterventionReport />} />
                  
                  {/* Route aidants */}
                  <Route path="/caregivers" element={<Caregivers />} />
                  
                  <Route path="/capria" element={<CaprIA />} />
                </Route>
                
                {/* Routes admin - nécessitent le rôle admin */}
                <Route element={<ProtectedRoute requiredRoles={['admin']} />}>
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/posts" element={<AdminPosts />} />
                  <Route path="/admin/activities" element={<AdminActivities />} />
                  <Route path="/admin/albums" element={<AdminAlbums />} />
                  <Route path="/admin/wish-albums" element={<AdminWishAlbums />} />
                  <Route path="/admin/diary" element={<AdminDiary />} />
                  <Route path="/admin/life-stories" element={<AdminLifeStories />} />
                  <Route path="/admin/invitation-groups" element={<AdminInvitationGroups />} />
                  <Route path="/admin/permissions-diagnostic" element={<AdminPermissionsDiagnostic />} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </div>
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;
