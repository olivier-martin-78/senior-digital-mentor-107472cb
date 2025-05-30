
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Auth from '@/pages/Auth';
import Index from '@/pages/Index';
import Profile from '@/pages/Profile';
import Blog from '@/pages/Blog';
import BlogPost from '@/pages/BlogPost';
import AdminPosts from '@/pages/admin/AdminPosts';
import AdminAlbums from '@/pages/admin/AdminAlbums';
import AdminWishAlbums from '@/pages/admin/AdminWishAlbums';
import AdminDiary from '@/pages/admin/AdminDiary';
import AdminLifeStories from '@/pages/admin/AdminLifeStories';
import AdminLifeStoryEdit from '@/pages/admin/AdminLifeStoryEdit';
import Wishes from '@/pages/Wishes';
import WishPost from '@/pages/WishPost';
import Diary from '@/pages/Diary';
import DiaryEntry from '@/pages/DiaryEntry';
import LifeStory from '@/pages/LifeStory';
import Recent from '@/pages/Recent';
import Unauthorized from '@/pages/Unauthorized';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminInvitationGroups from '@/pages/admin/AdminInvitationGroups';
import { AppRole } from '@/types/supabase';

const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole?: AppRole }) => {
  const { session, hasRole } = useAuth();

  useEffect(() => {
    console.log('Session in ProtectedRoute:', session);
  }, [session]);

  if (!session) {
    return <Navigate to="/auth" />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/recent" element={<ProtectedRoute><Recent /></ProtectedRoute>} />

        <Route path="/blog" element={<ProtectedRoute><Blog /></ProtectedRoute>} />
        <Route path="/blog/:id" element={<ProtectedRoute><BlogPost /></ProtectedRoute>} />

        <Route path="/wishes" element={<ProtectedRoute><Wishes /></ProtectedRoute>} />
        <Route path="/wishes/:id" element={<ProtectedRoute><WishPost /></ProtectedRoute>} />

        <Route path="/diary" element={<ProtectedRoute><Diary /></ProtectedRoute>} />
        <Route path="/diary/:id" element={<ProtectedRoute><DiaryEntry /></ProtectedRoute>} />

        <Route path="/life-story" element={<ProtectedRoute><LifeStory /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/posts" element={<ProtectedRoute requiredRole="admin"><AdminPosts /></ProtectedRoute>} />
        <Route path="/admin/albums" element={<ProtectedRoute requiredRole="admin"><AdminAlbums /></ProtectedRoute>} />
        <Route path="/admin/wish-albums" element={<ProtectedRoute requiredRole="admin"><AdminWishAlbums /></ProtectedRoute>} />
        <Route path="/admin/diary" element={<ProtectedRoute requiredRole="admin"><AdminDiary /></ProtectedRoute>} />
        <Route path="/admin/life-stories" element={<ProtectedRoute requiredRole="admin"><AdminLifeStories /></ProtectedRoute>} />
        <Route path="/admin/life-stories/:id" element={<ProtectedRoute requiredRole="admin"><AdminLifeStoryEdit /></ProtectedRoute>} />
        <Route path="/admin/invitation-groups" element={<ProtectedRoute requiredRole="admin"><AdminInvitationGroups /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
