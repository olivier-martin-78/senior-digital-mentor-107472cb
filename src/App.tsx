
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
                <Route path="/permissions" element={<ProtectedRoute />}>
                  <Route index element={<PermissionsManagement />} />
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
                <Route path="/blog/new" element={<ProtectedRoute requiredRoles={['admin', 'editor']} />}>
                  <Route index element={<BlogEditor />} />
                </Route>
                <Route path="/blog/edit/:id" element={<ProtectedRoute requiredRoles={['admin', 'editor']} />}>
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
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
