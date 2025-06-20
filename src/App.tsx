import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient } from 'react-query';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPosts from './pages/admin/AdminPosts';
import AdminAlbums from './pages/admin/AdminAlbums';
import AdminWishAlbums from './pages/admin/AdminWishAlbums';
import AdminDiary from './pages/admin/AdminDiary';
import AdminLifeStories from './pages/admin/AdminLifeStories';
import AdminActivities from './pages/admin/AdminActivities';
import Subscription from './pages/Subscription';
import Recent from './pages/Recent';
import Blog from './pages/Blog';
import Diary from './pages/Diary';
import LifeStory from './pages/LifeStory';
import Wishes from './pages/Wishes';
import Activities from './pages/Activities';
import Scheduler from './pages/Scheduler';
import InvitationGroups from './pages/InvitationGroups';
import MyInvitationGroups from './pages/MyInvitationGroups';
import PermissionsDiagnostic from './pages/admin/PermissionsDiagnostic';
import { Toaster } from '@/components/ui/toaster';
import OppositesGame from './pages/activities/OppositesGame';

function App() {
  return (
    <QueryClient>
      <AuthProvider>
        <BrowserRouter>
          <Toaster />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/posts" element={<AdminPosts />} />
            <Route path="/admin/albums" element={<AdminAlbums />} />
            <Route path="/admin/wish-albums" element={<AdminWishAlbums />} />
            <Route path="/admin/diary" element={<AdminDiary />} />
            <Route path="/admin/life-stories" element={<AdminLifeStories />} />
            <Route path="/admin/activities" element={<AdminActivities />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/recent" element={<Recent />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/diary" element={<Diary />} />
            <Route path="/life-story" element={<LifeStory />} />
            <Route path="/wishes" element={<Wishes />} />
            <Route path="/activities/:type" element={<Activities />} />
             <Route path="/scheduler" element={<Scheduler />} />
            <Route path="/invitation-groups" element={<InvitationGroups />} />
            <Route path="/admin/permissions-diagnostic" element={<PermissionsDiagnostic />} />
            <Route path="/my-invitation-groups" element={<MyInvitationGroups />} />
            <Route path="/activities/opposites" element={<OppositesGame />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClient>
  );
}

export default App;
