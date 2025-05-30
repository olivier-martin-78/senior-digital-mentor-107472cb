
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
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
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
              <Route path="/wishes/new" element={<ProtectedRoute><WishForm /></ProtectedRoute>} />
              <Route path="/wishes/new-form" element={<ProtectedRoute><WishNew /></ProtectedRoute>} />
              <Route path="/wishes/edit/:id" element={<ProtectedRoute><WishEdit /></ProtectedRoute>} />
              <Route path="/wishes/edit-form/:id" element={<ProtectedRoute><WishEditForm /></ProtectedRoute>} />
              <Route path="/recent" element={<ProtectedRoute><Recent /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/posts" element={<ProtectedRoute><AdminPosts /></ProtectedRoute>} />
              <Route path="/admin/albums" element={<ProtectedRoute><AdminAlbums /></ProtectedRoute>} />
              <Route path="/admin/wish-albums" element={<ProtectedRoute><AdminWishAlbums /></ProtectedRoute>} />
              <Route path="/admin/diary" element={<ProtectedRoute><AdminDiary /></ProtectedRoute>} />
              <Route path="/admin/life-stories" element={<ProtectedRoute><AdminLifeStories /></ProtectedRoute>} />
              <Route path="/admin/life-stories/:userId" element={<ProtectedRoute><AdminLifeStoryEdit /></ProtectedRoute>} />
              <Route path="/admin/invitation-groups" element={<ProtectedRoute><AdminInvitationGroups /></ProtectedRoute>} />
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
