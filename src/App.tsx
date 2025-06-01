import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthConfirm from "./pages/AuthConfirm";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
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
import WishForm from "./pages/WishForm";
import WishNew from "./pages/WishNew";
import WishEdit from "./pages/WishEdit";
import WishEditForm from "./pages/WishEditForm";
import Recent from "./pages/Recent";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPosts from "./pages/admin/AdminPosts";
import AdminAlbums from "./pages/admin/AdminAlbums";
import AdminWishAlbums from "./pages/admin/AdminWishAlbums";
import AdminDiary from "./pages/admin/AdminDiary";
import AdminLifeStories from "./pages/admin/AdminLifeStories";
import AdminLifeStoryEdit from "./pages/admin/AdminLifeStoryEdit";
import AdminInvitationGroups from "./pages/admin/AdminInvitationGroups";
import AdminPermissionsDiagnostic from "./pages/admin/AdminPermissionsDiagnostic";
import BlogLanding from "./pages/BlogLanding";
import AILanding from "./pages/AILanding";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ImpersonationProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/confirm" element={<AuthConfirm />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<Profile />} />
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
                <Route path="/wishes/new" element={<WishForm />} />
                <Route path="/wishes/new-form" element={<WishNew />} />
                <Route path="/wishes/edit/:id" element={<WishEdit />} />
                <Route path="/wishes/edit-form/:id" element={<WishEditForm />} />
                <Route path="/recent" element={<Recent />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/posts" element={<AdminPosts />} />
                <Route path="/admin/albums" element={<AdminAlbums />} />
                <Route path="/admin/wish-albums" element={<AdminWishAlbums />} />
                <Route path="/admin/diary" element={<AdminDiary />} />
                <Route path="/admin/life-stories" element={<AdminLifeStories />} />
                <Route path="/admin/life-stories/:userId" element={<AdminLifeStoryEdit />} />
                <Route path="/admin/invitation-groups" element={<AdminInvitationGroups />} />
                <Route path="/admin/permissions-diagnostic" element={<AdminPermissionsDiagnostic />} />
              </Route>
              <Route path="/blog-landing" element={<BlogLanding />} />
              <Route path="/ai-landing" element={<AILanding />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ImpersonationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
