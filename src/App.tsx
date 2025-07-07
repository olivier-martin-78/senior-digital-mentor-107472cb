import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { QueryClientProvider, QueryClient } from 'react-query';
import Index from './pages/Index';
import Auth from './pages/Auth';
import AuthConfirm from './pages/AuthConfirm';
import ResetPassword from './pages/ResetPassword';
import Unauthorized from './pages/Unauthorized';
import PrivateApp from './pages/PrivateApp';
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
import AdminUsers from './pages/AdminUsers';
import AdminPosts from './pages/AdminPosts';
import AdminAlbums from './pages/AdminAlbums';
import AdminWishAlbums from './pages/AdminWishAlbums';
import AdminDiary from './pages/AdminDiary';
import AdminLifeStories from './pages/AdminLifeStories';
import AdminLifeStoryEdit from './pages/AdminLifeStoryEdit';
import ActivitiesOverview from './pages/ActivitiesOverview';
import ActivityPage from './pages/ActivityPage';
import CrosswordGame from './pages/CrosswordGame';
import SudokuGame from './pages/SudokuGame';
import OppositesGame from './pages/OppositesGame';
import TranslationGame from './pages/TranslationGame';
import AdminActivities from './pages/AdminActivities';
import PublicSubscription from './pages/PublicSubscription';
import ProfessionalScheduler from './pages/ProfessionalScheduler';
import ProfessionalModule from './pages/ProfessionalModule';
import InterventionReport from './pages/InterventionReport';
import AILanding from './pages/AILanding';
import CaprIA from './pages/CaprIA';
import AdminInvitationGroups from './pages/AdminInvitationGroups';
import MyInvitationGroups from './pages/MyInvitationGroups';
import AdminPermissionsDiagnostic from './pages/AdminPermissionsDiagnostic';
import BlogLanding from './pages/BlogLanding';
import Caregivers from './pages/Caregivers';

const queryClient = new QueryClient();

function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
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

            {/* Routes protégées */}
            <Route element={<ProtectedRoute />}>
              <Route element={<PrivateApp />}>
                <Route path="/recent" element={<Recent />} />
                <Route path="/diary" element={<Diary />} />
                <Route path="/diary/new" element={<DiaryNew />} />
                <Route path="/diary/:id" element={<DiaryEntry />} />
                <Route path="/diary/:id/edit" element={<DiaryEdit />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/new" element={<BlogEditor />} />
                <Route path="/blog/:id" element={<BlogPost />} />
                <Route path="/blog/:id/edit" element={<BlogEditor />} />
                <Route path="/life-story" element={<LifeStory />} />
                <Route path="/wishes" element={<Wishes />} />
                <Route path="/wishes/new" element={<WishNew />} />
                <Route path="/wishes/:id" element={<WishPost />} />
                <Route path="/wishes/:id/edit" element={<WishEdit />} />
                <Route path="/wishes/form/:id" element={<WishForm />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/my-invitation-groups" element={<MyInvitationGroups />} />
                
                {/* Routes des activités */}
                <Route path="/activities" element={<ActivitiesOverview />} />
                <Route path="/activities/:id" element={<ActivityPage />} />
                <Route path="/activities/crossword/:id" element={<CrosswordGame />} />
                <Route path="/activities/sudoku/:id" element={<SudokuGame />} />
                <Route path="/activities/opposites/:id" element={<OppositesGame />} />
                <Route path="/activities/translation/:id" element={<TranslationGame />} />
                
                {/* Routes professionnelles */}
                <Route path="/professional-scheduler" element={<ProfessionalScheduler />} />
                <Route path="/professional-module" element={<ProfessionalModule />} />
                <Route path="/intervention-report" element={<InterventionReport />} />
                
                {/* Route aidants */}
                <Route path="/caregivers" element={<Caregivers />} />
                
                {/* Routes admin */}
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/posts" element={<AdminPosts />} />
                <Route path="/admin/albums" element={<AdminAlbums />} />
                <Route path="/admin/wish-albums" element={<AdminWishAlbums />} />
                <Route path="/admin/diary" element={<AdminDiary />} />
                <Route path="/admin/life-stories" element={<AdminLifeStories />} />
                <Route path="/admin/life-stories/:id/edit" element={<AdminLifeStoryEdit />} />
                <Route path="/admin/activities" element={<AdminActivities />} />
                <Route path="/admin/invitation-groups" element={<AdminInvitationGroups />} />
                <Route path="/admin/permissions-diagnostic" element={<AdminPermissionsDiagnostic />} />
                
                <Route path="/capria" element={<CaprIA />} />
              </Route>
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;
