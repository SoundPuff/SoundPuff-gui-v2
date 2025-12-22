import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider } from './contexts/AuthContext';
import { PlayerProvider } from './contexts/PlayerContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { GuestRoute } from './components/GuestRoute';
import { Layout } from './components/Layout';
import { GuestLandingPage } from './components/GuestLandingPage';
import { AuthPage } from './components/AuthPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { LibraryPage } from './pages/LibraryPage';
import { ProfilePage } from './pages/ProfilePage';
import { PlaylistPage } from './pages/PlaylistPage';
import { CreatePlaylistPage } from './pages/CreatePlaylistPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PlayerProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={
                <GuestRoute>
                  <GuestLandingPage />
                </GuestRoute>
              } />
              <Route path="/auth" element={
                <GuestRoute>
                  <AuthPage />
                </GuestRoute>
              } />
              <Route path="/reset-password" element={
                <GuestRoute>
                  <ResetPasswordPage />
                </GuestRoute>
              } />

              {/* Protected routes */}
              <Route
                path="/app/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="home" element={<HomePage />} />
                        <Route path="search" element={<SearchPage />} />
                        <Route path="library" element={<LibraryPage />} />
                        <Route path="profile" element={<ProfilePage />} />
                        <Route path="user/:username" element={<ProfilePage />} />
                        <Route path="playlist/:playlistId" element={<PlaylistPage />} />
                        <Route path="create-playlist" element={<CreatePlaylistPage />} />
                        <Route path="edit-playlist/:playlistId" element={<CreatePlaylistPage />} />
                        <Route index element={<Navigate to="home" replace />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Redirect authenticated users to app */}
              <Route path="*" element={<Navigate to="/app/home" replace />} />
            </Routes>
          </BrowserRouter>
        </PlayerProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
