
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthConfirm from "./pages/AuthConfirm";
import NotFound from "./pages/NotFound";
import Recent from "./pages/Recent";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogEditor from "./pages/BlogEditor";
import Diary from "./pages/Diary";
import DiaryEntry from "./pages/DiaryEntry";
import DiaryNew from "./pages/DiaryNew";
import DiaryEdit from "./pages/DiaryEdit";
import LifeStory from "./pages/LifeStory";
import Wishes from "./pages/Wishes";
import WishPost from "./pages/WishPost";
import WishNew from "./pages/WishNew";
import WishEdit from "./pages/WishEdit";
import WishForm from "./pages/WishForm";
import WishEditForm from "./pages/WishEditForm";
import Profile from "./pages/Profile";
import Subscription from "./pages/Subscription";
import ResetPassword from "./pages/ResetPassword";
import Unauthorized from "./pages/Unauthorized";
import ProfessionalScheduler from "./pages/ProfessionalScheduler";
import InterventionReport from "./pages/InterventionReport";
import MyInvitationGroups from "./pages/MyInvitationGroups";

// Activities pages
import ActivitiesOverview from "./pages/activities/ActivitiesOverview";
import ActivityPage from "./pages/activities/ActivityPage";

// Admin pages
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPosts from "./pages/admin/AdminPosts";
import AdminAlbums from "./pages/admin/AdminAlbums";
import AdminWishAlbums from "./pages/admin/AdminWishAlbums";
import AdminDiary from "./pages/admin/AdminDiary";
import AdminLifeStories from "./pages/admin/AdminLifeStories";
import AdminLifeStoryEdit from "./pages/admin/AdminLifeStoryEdit";
import AdminActivities from "./pages/admin/AdminActivities";
import AdminPermissionsDiagnostic from "./pages/admin/AdminPermissionsDiagnostic";
import AdminInvitationGroups from "./pages/admin/AdminInvitationGroups";

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
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/confirm" element={<AuthConfirm />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/recent" element={<Recent />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:id" element={<BlogPost />} />
              <Route path="/blog/new" element={<BlogEditor />} />
              <Route path="/blog/edit/:id" element={<BlogEditor />} />
              <Route path="/diary" element={<Diary />} />
              <Route path="/diary/:id" element={<DiaryEntry />} />
              <Route path="/diary/new" element={<DiaryNew />} />
              <Route path="/diary/edit/:id" element={<DiaryEdit />} />
              <Route path="/life-story" element={<LifeStory />} />
              <Route path="/wishes" element={<Wishes />} />
              <Route path="/wishes/:id" element={<WishPost />} />
              <Route path="/wishes/new" element={<WishNew />} />
              <Route path="/wishes/edit/:id" element={<WishEdit />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/scheduler" element={<ProfessionalScheduler />} />
              <Route path="/intervention-report" element={<InterventionReport />} />
              <Route path="/my-invitation-groups" element={<MyInvitationGroups />} />
              
              {/* Activities Routes */}
              <Route path="/activities/activities" element={<ActivitiesOverview />} />
              <Route path="/activities/:activityType" element={<ActivityPage />} />
              
              {/* Admin Routes */}
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/posts" element={<AdminPosts />} />
              <Route path="/admin/albums" element={<AdminAlbums />} />
              <Route path="/admin/wish-albums" element={<AdminWishAlbums />} />
              <Route path="/admin/diary" element={<AdminDiary />} />
              <Route path="/admin/life-stories" element={<AdminLifeStories />} />
              <Route path="/admin/life-stories/edit/:id" element={<AdminLifeStoryEdit />} />
              <Route path="/admin/activities" element={<AdminActivities />} />
              <Route path="/admin/permissions-diagnostic" element={<AdminPermissionsDiagnostic />} />
              <Route path="/admin/invitation-groups" element={<AdminInvitationGroups />} />
            </Route>
            
            <Route path="/wish-form" element={<WishForm />} />
            <Route path="/wish-edit-form/:id" element={<WishEditForm />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
