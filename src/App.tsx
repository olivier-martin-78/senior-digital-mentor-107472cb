
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppRole } from "@/types/supabase";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogEditor from "./pages/BlogEditor";
import Profile from "./pages/Profile";
import Unauthorized from "./pages/Unauthorized";
import AdminPosts from "./pages/admin/AdminPosts";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAlbums from "./pages/admin/AdminAlbums";
import AdminWishAlbums from "./pages/admin/AdminWishAlbums";
import AdminLifeStories from "./pages/admin/AdminLifeStories";
import AdminLifeStoryEdit from "./pages/admin/AdminLifeStoryEdit";
import AdminDiary from "./pages/admin/AdminDiary";
import Diary from "./pages/Diary";
import DiaryNew from "./pages/DiaryNew";
import DiaryEntry from "./pages/DiaryEntry";
import DiaryEdit from "./pages/DiaryEdit";
import LifeStory from "./pages/LifeStory";
import WishForm from "./pages/WishForm";
import WishEditForm from "./pages/WishEditForm";
import Wishes from "./pages/Wishes";
import WishPost from "./pages/WishPost";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/wish-form" element={<WishForm />} />
            <Route path="/wishes" element={<Wishes />} />
            <Route path="/wishes/:id" element={<WishPost />} />
            <Route path="/wishes/edit/:id" element={<WishEditForm />} />

            {/* Routes protégées qui nécessitent une authentification */}
            <Route element={<ProtectedRoute />}>
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:id" element={<BlogPost />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/diary" element={<Diary />} />
              <Route path="/diary/new" element={<DiaryNew />} />
              <Route path="/diary/:id" element={<DiaryEntry />} />
              <Route path="/diary/edit/:id" element={<DiaryEdit />} />
              <Route path="/life-story" element={<LifeStory />} />
            </Route>

            {/* Routes pour les éditeurs et admins */}
            <Route element={<ProtectedRoute requiredRoles={['editor', 'admin'] as AppRole[]} />}>
              <Route path="/blog/new" element={<BlogEditor />} />
              <Route path="/blog/edit/:id" element={<BlogEditor />} />
              <Route path="/admin/posts" element={<AdminPosts />} />
            </Route>

            {/* Routes uniquement pour les admins */}
            <Route element={<ProtectedRoute requiredRoles={['admin'] as AppRole[]} />}>
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/albums" element={<AdminAlbums />} />
              <Route path="/admin/wish-albums" element={<AdminWishAlbums />} />
              <Route path="/admin/life-stories" element={<AdminLifeStories />} />
              <Route path="/admin/life-stories/:id" element={<AdminLifeStoryEdit />} />
              <Route path="/admin/diary" element={<AdminDiary />} />
            </Route>

            {/* Route 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
