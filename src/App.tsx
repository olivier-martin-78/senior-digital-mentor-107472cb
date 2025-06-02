
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import { ThemeProvider } from "next-themes";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthConfirm from "./pages/AuthConfirm";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import PermissionsManagement from "./pages/PermissionsManagement";
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
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import AILanding from "./pages/AILanding";

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

import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ImpersonationProvider>
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
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="/permissions" element={
                    <ProtectedRoute>
                      <PermissionsManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/recent" element={
                    <ProtectedRoute>
                      <Recent />
                    </ProtectedRoute>
                  } />
                  <Route path="/blog" element={
                    <ProtectedRoute>
                      <Blog />
                    </ProtectedRoute>
                  } />
                  <Route path="/blog/:id" element={
                    <ProtectedRoute>
                      <BlogPost />
                    </ProtectedRoute>
                  } />
                  <Route path="/blog/new" element={
                    <ProtectedRoute allowedRoles={['admin', 'editor']}>
                      <BlogEditor />
                    </ProtectedRoute>
                  } />
                  <Route path="/blog/edit/:id" element={
                    <ProtectedRoute allowedRoles={['admin', 'editor']}>
                      <BlogEditor />
                    </ProtectedRoute>
                  } />
                  <Route path="/diary" element={
                    <ProtectedRoute>
                      <Diary />
                    </ProtectedRoute>
                  } />
                  <Route path="/diary/new" element={
                    <ProtectedRoute>
                      <DiaryNew />
                    </ProtectedRoute>
                  } />
                  <Route path="/diary/edit/:id" element={
                    <ProtectedRoute>
                      <DiaryEdit />
                    </ProtectedRoute>
                  } />
                  <Route path="/diary/:id" element={
                    <ProtectedRoute>
                      <DiaryEntry />
                    </ProtectedRoute>
                  } />
                  <Route path="/life-story" element={
                    <ProtectedRoute>
                      <LifeStory />
                    </ProtectedRoute>
                  } />
                  <Route path="/wishes" element={
                    <ProtectedRoute>
                      <Wishes />
                    </ProtectedRoute>
                  } />
                  <Route path="/wishes/new" element={
                    <ProtectedRoute>
                      <WishNew />
                    </ProtectedRoute>
                  } />
                  <Route path="/wishes/edit/:id" element={
                    <ProtectedRoute>
                      <WishEdit />
                    </ProtectedRoute>
                  } />
                  <Route path="/wishes/form/:id" element={
                    <ProtectedRoute>
                      <WishEditForm />
                    </ProtectedRoute>
                  } />
                  <Route path="/wish-form" element={<WishForm />} />
                  <Route path="/wish/:id" element={<WishPost />} />

                  {/* Admin routes */}
                  <Route path="/admin/users" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminUsers />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/posts" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminPosts />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/albums" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminAlbums />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/wish-albums" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminWishAlbums />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/diary" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDiary />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/life-stories" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminLifeStories />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/life-stories/edit/:id" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminLifeStoryEdit />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/invitation-groups" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminInvitationGroups />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/permissions-diagnostic" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminPermissionsDiagnostic />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AuthProvider>
            </ImpersonationProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
