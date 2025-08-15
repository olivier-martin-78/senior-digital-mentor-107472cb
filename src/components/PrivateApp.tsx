
import React, { useEffect } from 'react';
import HeaderWrapper from '@/components/HeaderWrapper';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import ActivityCreatorRoute from '@/components/ActivityCreatorRoute';
import Index from '@/pages/Index';
import Profile from '@/pages/Profile';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminPosts from '@/pages/admin/AdminPosts';
import AdminAlbums from '@/pages/admin/AdminAlbums';
import AdminWishAlbums from '@/pages/admin/AdminWishAlbums';
import AdminDiary from '@/pages/admin/AdminDiary';
import AdminLifeStories from '@/pages/admin/AdminLifeStories';
import AdminActivities from '@/pages/admin/AdminActivities';
import HomepageCarousel from '@/pages/admin/HomepageCarousel';
import Subscription from '@/pages/Subscription';
import PublicSubscription from '@/pages/PublicSubscription';
import Recent from '@/pages/Recent';
import Blog from '@/pages/Blog';
import BlogPost from '@/pages/BlogPost';
import BlogEditor from '@/pages/BlogEditor';
import Diary from '@/pages/Diary';
import DiaryEntry from '@/pages/DiaryEntry';
import DiaryNew from '@/pages/DiaryNew';
import DiaryEdit from '@/pages/DiaryEdit';
import LifeStory from '@/pages/LifeStory';
import Wishes from '@/pages/Wishes';
import WishPost from '@/pages/WishPost';
import WishNew from '@/pages/WishNew';
import WishEdit from '@/pages/WishEdit';
import Activities from '@/pages/activities/ActivitiesOverview';
import ActivityPage from '@/pages/activities/ActivityPage';
import Scheduler from '@/pages/ProfessionalScheduler';
import InterventionReport from '@/pages/InterventionReport';
import InvitationGroups from '@/pages/admin/AdminInvitationGroups';
import MyInvitationGroups from '@/pages/MyInvitationGroups';
import PermissionsDiagnostic from '@/pages/admin/AdminPermissionsDiagnostic';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import OppositesGame from '@/pages/activities/OppositesGame';
import SudokuGame from '@/pages/activities/SudokuGame';
import CrosswordGame from '@/pages/activities/CrosswordGame';
import TranslationGame from '@/pages/activities/TranslationGame';
import DecoderGame from '@/pages/activities/DecoderGame';
import DictationGamePage from '@/pages/activities/DictationGamePage';
import ReverseDictionaryGamePage from '@/pages/activities/ReverseDictionaryGamePage';
import { SpotDifferencesGamePage } from '@/pages/activities/SpotDifferencesGame';
import Quiz70sGame from '@/pages/activities/Quiz70sGame';
import IllusionistGame from '@/pages/activities/IllusionistGame';
import MusicQuizGame from '@/pages/MusicQuizGame';
import MemoryGame from '@/pages/MemoryGame';
import TimelineGame from '@/pages/TimelineGame';
import ProfessionalModule from '@/pages/ProfessionalModule';
import Caregivers from '@/pages/Caregivers';
import { MiniSiteBuilder } from '@/pages/MiniSiteBuilder';
import { MiniSitePreview } from '@/pages/MiniSitePreview';
import { PublicMiniSite } from '@/pages/PublicMiniSite';
import Unauthorized from '@/pages/Unauthorized';
import { AppRole } from '@/types/supabase';
import { Toaster } from '@/components/ui/toaster';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';

const PrivateApp: React.FC = () => {
  const { user, isLoading } = useOptionalAuth();

  // Timeout de sécurité pour éviter les états de chargement infinis
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('⚠️ Timeout de chargement de l\'authentification atteint');
      }
    }, 10000); // 10 secondes

    return () => clearTimeout(timeout);
  }, [isLoading]);

  // Show loading while checking auth
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  return (
    <AuthProvider>
      <Toaster />
      <HeaderWrapper />
      <div className="min-h-screen">
        <Routes>
          {/* Mini-site builder route - TOP PRIORITY */}
          <Route 
            path="/mini-site/builder" 
            element={
              (() => {
                console.log('🔥 [PRIVATE_APP_DEBUG] Route /mini-site/builder matchée');
                return <MiniSiteBuilder />;
              })()
            } 
          />
          
          {/* Page module professionnel - accessible à tous */}
          <Route path="/module-pro" element={<ProfessionalModule />} />
          
          {/* Public subscription route for non-authenticated users */}
          {!user && <Route path="/subscription" element={<PublicSubscription />} />}
          
          {/* Semi-protected routes - require authentication but not full access */}
          <Route element={<ProtectedRoute requiresFullAccess={false} />}>
            <Route path="/account/subscription" element={<Subscription />} />
            <Route path="/subscription" element={<Subscription />} />
          </Route>

          {/* Page d'accueil pour les utilisateurs connectés */}
          <Route path="/" element={<Index />} />

          {/* Fully protected routes - require authentication and account access */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/recent" element={<Recent />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/new" element={<BlogEditor />} />
            <Route path="/blog/edit/:id" element={<BlogEditor />} />
            <Route path="/blog/:id" element={<BlogPost />} />
            <Route path="/diary" element={<Diary />} />
            <Route path="/diary/new" element={<DiaryNew />} />
            <Route path="/diary/edit/:id" element={<DiaryEdit />} />
            <Route path="/diary/:id" element={<DiaryEntry />} />
            <Route path="/life-story" element={<LifeStory />} />
            <Route path="/wishes" element={<Wishes />} />
            <Route path="/wishes/new" element={<WishNew />} />
            <Route path="/wishes/edit/:id" element={<WishEdit />} />
            <Route path="/wishes/:id" element={<WishPost />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/activities/activities" element={<Activities />} />
            <Route path="/activities/:type" element={<ActivityPage />} />
            <Route path="/scheduler" element={<Scheduler />} />
            <Route path="/intervention-report" element={<InterventionReport />} />
            <Route path="/my-invitation-groups" element={<MyInvitationGroups />} />
            <Route path="/activities/opposites" element={<OppositesGame />} />
            <Route path="/activities/sudoku" element={<SudokuGame />} />
            <Route path="/activities/crossword" element={<CrosswordGame />} />
            <Route path="/activities/translation" element={<TranslationGame />} />
            <Route path="/activities/decoder" element={<DecoderGame />} />
            <Route path="/activities/dictation/:id" element={<DictationGamePage />} />
            <Route path="/activities/reverse-dictionary/:id" element={<ReverseDictionaryGamePage />} />
            <Route path="/activities/spot-differences/:id" element={<SpotDifferencesGamePage />} />
            <Route path="/activities/quiz70s" element={<Quiz70sGame />} />
            <Route path="/activities/games/illusionist" element={<IllusionistGame />} />
            <Route path="/activities/music-quiz/play" element={<MusicQuizGame />} />
            <Route path="/activities/memory-game/play" element={<MemoryGame />} />
            <Route path="/activities/timeline/play" element={<TimelineGame />} />
            <Route path="/caregivers" element={<Caregivers />} />
          </Route>

          {/* Routes publiques pour les mini-sites - accessibles même quand connecté */}
          <Route path="/mini-site/preview" element={<MiniSitePreview />} />
          <Route 
            path="/mini-site/:slug" 
            element={
              (() => {
                console.log('🔥 [PRIVATE_APP_DEBUG] Route /mini-site/:slug matchée dans PrivateApp');
                return <PublicMiniSite />;
              })()
            } 
          />

          {/* Activity creator routes - require activity creation permissions */}
          <Route element={<ActivityCreatorRoute />}>
            <Route path="/create-activities" element={<AdminActivities />} />
            <Route path="/create-activities/:type" element={<AdminActivities />} />
          </Route>

          {/* Professional scheduler routes */}
          <Route element={<ProtectedRoute requiredRoles={['professionnel' as AppRole]} />}>
            <Route path="/professional-scheduler" element={<Scheduler />} />
          </Route>

          {/* Admin routes - require admin role */}
          <Route element={<ProtectedRoute requiredRoles={['admin' as AppRole]} />}>
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/posts" element={<AdminPosts />} />
            <Route path="/admin/albums" element={<AdminAlbums />} />
            <Route path="/admin/wish-albums" element={<AdminWishAlbums />} />
            <Route path="/admin/diary" element={<AdminDiary />} />
            <Route path="/admin/life-stories" element={<AdminLifeStories />} />
            <Route path="/admin/activities" element={<AdminActivities />} />
            <Route path="/admin/activities/:type" element={<AdminActivities />} />
            <Route path="/admin/homepage-carousel" element={<HomepageCarousel />} />
            <Route path="/admin/invitation-groups" element={<InvitationGroups />} />
            <Route path="/admin/permissions-diagnostic" element={<PermissionsDiagnostic />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>

          {/* Error routes */}
          <Route path="/unauthorized" element={<Unauthorized />} />
        </Routes>
      </div>
    </AuthProvider>
  );
};

export default PrivateApp;
