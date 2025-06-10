
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthConfirm from "./pages/AuthConfirm";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import MyInvitationGroups from "./pages/MyInvitationGroups";
import Blog from "./pages/Blog";
import BlogLanding from "./pages/BlogLanding";
import BlogPost from "./pages/BlogPost";
import BlogEditor from "./pages/BlogEditor";
import Recent from "./pages/Recent";
import Diary from "./pages/Diary";
import DiaryNew from "./pages/DiaryNew";
import DiaryEdit from "./pages/DiaryEdit";
import DiaryEntry from "./pages/DiaryEntry";
import LifeStory from "./pages/LifeStory";
import Wishes from "./pages/Wishes";
import WishNew from "./pages/WishNew";
import WishEdit from "./pages/WishEdit";
import WishEditForm from "./pages/WishEditForm";
import WishForm from "./pages/WishForm";
import WishPost from "./pages/WishPost";
import InterventionReport from "./pages/InterventionReport";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import AILanding from "./pages/AILanding";
import ActivityPage from "./pages/activities/ActivityPage";

// Admin pages
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPosts from "./pages/admin/AdminPosts";
import AdminAlbums from "./pages/admin/AdminAlbums";
import AdminWishAlbums from "./pages/admin/AdminWishAlbums";
import AdminDiary from "./pages/admin/AdminDiary";
import AdminLifeStories from "./pages/admin/AdminLifeStories";
import AdminLifeStoryEdit from "./pages/admin/AdminLifeStoryEdit";
import AdminInvitationGroups from "./pages/admin/AdminInvitationGroups";
import AdminPermissionsDiagnostic from "./pages/admin/AdminPermissionsDiagnostic";
import AdminActivities from "./pages/admin/AdminActivities";

import ProtectedRoute from "./components/ProtectedRoute";
import ProfessionalScheduler from './pages/ProfessionalScheduler';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/confirm" element={<AuthConfirm />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />
                <Route path="/blog-landing" element={<BlogLanding />} />
                <Route path="/ai-landing" element={<AILanding />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                
                {/* Protected routes */}
                <Route path="/profile" element={<ProtectedRoute />}>
                  <Route index element={<Profile />} />
                </Route>
                <Route path="/my-groups" element={<ProtectedRoute />}>
                  <Route index element={<MyInvitationGroups />} />
                </Route>
                <Route path="/recent" element={<ProtectedRoute />}>
                  <Route index element={<Recent />} />
                </Route>
                <Route path="/blog" element={<ProtectedRoute />}>
                  <Route index element={<Blog />} />
                </Route>
                <Route path="/blog/:id" element={<ProtectedRoute />}>
                  <Route index element={<BlogPost />} />
                </Route>
                <Route path="/blog/new" element={<ProtectedRoute />}>
                  <Route index element={<BlogEditor />} />
                </Route>
                <Route path="/blog/edit/:id" element={<ProtectedRoute />}>
                  <Route index element={<BlogEditor />} />
                </Route>
                <Route path="/diary" element={<ProtectedRoute />}>
                  <Route index element={<Diary />} />
                </Route>
                <Route path="/diary/new" element={<ProtectedRoute />}>
                  <Route index element={<DiaryNew />} />
                </Route>
                <Route path="/diary/edit/:id" element={<ProtectedRoute />}>
                  <Route index element={<DiaryEdit />} />
                </Route>
                <Route path="/diary/:id" element={<ProtectedRoute />}>
                  <Route index element={<DiaryEntry />} />
                </Route>
                <Route path="/life-story" element={<ProtectedRoute />}>
                  <Route index element={<LifeStory />} />
                </Route>
                <Route path="/wishes" element={<ProtectedRoute />}>
                  <Route index element={<Wishes />} />
                </Route>
                <Route path="/wishes/new" element={<ProtectedRoute />}>
                  <Route index element={<WishNew />} />
                </Route>
                <Route path="/wishes/edit/:id" element={<ProtectedRoute />}>
                  <Route index element={<WishEdit />} />
                </Route>
                <Route path="/wishes/form/:id" element={<ProtectedRoute />}>
                  <Route index element={<WishEditForm />} />
                </Route>
                <Route path="/wishes/:id" element={<ProtectedRoute />}>
                  <Route index element={<WishPost />} />
                </Route>
                <Route path="/wish-form" element={<WishForm />} />
                
                {/* Routes pour les activités */}
                <Route path="/activities/:type" element={<ProtectedRoute />}>
                  <Route index element={<ActivityPage />} />
                </Route>
                
                {/* Route pour la gestion des activités - accessible à tous les utilisateurs authentifiés */}
                <Route path="/admin/activities/:type" element={<ProtectedRoute />}>
                  <Route index element={<AdminActivities />} />
                </Route>
                
                {/* Route pour le compte-rendu d'intervention */}
                <Route path="/intervention-report" element={<ProtectedRoute requiredRoles={['admin', 'professionnel']} />}>
                  <Route index element={<InterventionReport />} />
                </Route>

                {/* Admin routes */}
                <Route path="/admin/users" element={<ProtectedRoute requiredRoles={['admin']} />}>
                  <Route index element={<AdminUsers />} />
                </Route>
                <Route path="/admin/posts" element={<ProtectedRoute requiredRoles={['admin']} />}>
                  <Route index element={<AdminPosts />} />
                </Route>
                <Route path="/admin/albums" element={<ProtectedRoute requiredRoles={['admin']} />}>
                  <Route index element={<AdminAlbums />} />
                </Route>
                <Route path="/admin/wish-albums" element={<ProtectedRoute requiredRoles={['admin']} />}>
                  <Route index element={<AdminWishAlbums />} />
                </Route>
                <Route path="/admin/diary" element={<ProtectedRoute requiredRoles={['admin']} />}>
                  <Route index element={<AdminDiary />} />
                </Route>
                <Route path="/admin/life-stories" element={<ProtectedRoute requiredRoles={['admin']} />}>
                  <Route index element={<AdminLifeStories />} />
                </Route>
                <Route path="/admin/life-stories/edit/:id" element={<ProtectedRoute requiredRoles={['admin']} />}>
                  <Route index element={<AdminLifeStoryEdit />} />
                </Route>
                <Route path="/admin/invitation-groups" element={<ProtectedRoute requiredRoles={['admin']} />}>
                  <Route index element={<AdminInvitationGroups />} />
                </Route>
                <Route path="/admin/permissions-diagnostic" element={<ProtectedRoute requiredRoles={['admin']} />}>
                  <Route index element={<AdminPermissionsDiagnostic />} />
                </Route>
                
                <Route path="/scheduler" element={<ProtectedRoute requiredRoles={['admin', 'professionnel']} />}>
                  <Route index element={<ProfessionalScheduler />} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
