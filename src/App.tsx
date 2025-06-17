
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
            <Route path="/recent" element={<ProtectedRoute><Recent /></ProtectedRoute>} />
            <Route path="/blog" element={<ProtectedRoute><Blog /></ProtectedRoute>} />
            <Route path="/blog/:id" element={<ProtectedRoute><BlogPost /></ProtectedRoute>} />
            <Route path="/blog/new" element={<ProtectedRoute><BlogEditor /></ProtectedRoute>} />
            <Route path="/blog/edit/:id" element={<ProtectedRoute><BlogEditor /></ProtectedRoute>} />
            <Route path="/diary" element={<ProtectedRoute><Diary /></ProtectedRoute>} />
            <Route path="/diary/:id" element={<ProtectedRoute><DiaryEntry /></ProtectedRoute>} />
            <Route path="/diary/new" element={<ProtectedRoute><DiaryNew /></ProtectedRoute>} />
            <Route path="/diary/edit/:id" element={<ProtectedRoute><DiaryEdit /></ProtectedRoute>} />
            <Route path="/life-story" element={<ProtectedRoute><LifeStory /></ProtectedRoute>} />
            <Route path="/wishes" element={<ProtectedRoute><Wishes /></ProtectedRoute>} />
            <Route path="/wishes/:id" element={<ProtectedRoute><WishPost /></ProtectedRoute>} />
            <Route path="/wishes/new" element={<ProtectedRoute><WishNew /></ProtectedRoute>} />
            <Route path="/wishes/edit/:id" element={<ProtectedRoute><WishEdit /></ProtectedRoute>} />
            <Route path="/wish-form" element={<WishForm />} />
            <Route path="/wish-edit-form/:id" element={<WishEditForm />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/scheduler" element={<ProtectedRoute><ProfessionalScheduler /></ProtectedRoute>} />
            <Route path="/intervention-report/:id" element={<ProtectedRoute><InterventionReport /></ProtectedRoute>} />
            <Route path="/my-invitation-groups" element={<ProtectedRoute><MyInvitationGroups /></ProtectedRoute>} />
            
            {/* Activities Routes */}
            <Route path="/activities/activities" element={<ProtectedRoute><ActivitiesOverview /></ProtectedRoute>} />
            <Route path="/activities/:activityType" element={<ProtectedRoute><ActivityPage /></ProtectedRoute>} />
            
            {/* Admin Routes */}
            <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/posts" element={<ProtectedRoute><AdminPosts /></ProtectedRoute>} />
            <Route path="/admin/albums" element={<ProtectedRoute><AdminAlbums /></ProtectedRoute>} />
            <Route path="/admin/wish-albums" element={<ProtectedRoute><AdminWishAlbums /></ProtectedRoute>} />
            <Route path="/admin/diary" element={<ProtectedRoute><AdminDiary /></ProtectedRoute>} />
            <Route path="/admin/life-stories" element={<ProtectedRoute><AdminLifeStories /></ProtectedRoute>} />
            <Route path="/admin/life-stories/edit/:id" element={<ProtectedRoute><AdminLifeStoryEdit /></ProtectedRoute>} />
            <Route path="/admin/activities" element={<ProtectedRoute><AdminActivities /></ProtectedRoute>} />
            <Route path="/admin/permissions-diagnostic" element={<ProtectedRoute><AdminPermissionsDiagnostic /></ProtectedRoute>} />
            <Route path="/admin/invitation-groups" element={<ProtectedRoute><AdminInvitationGroups /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
