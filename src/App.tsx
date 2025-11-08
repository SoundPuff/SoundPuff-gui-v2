import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { AuthPage } from './components/AuthPage';
import { HomePage } from './components/HomePage';
import { SearchPage } from './components/SearchPage';
import { ProfilePage } from './components/ProfilePage';
import { PlaylistPage } from './components/PlaylistPage';
import { CreatePlaylistPage } from './components/CreatePlaylistPage';
import { LibraryPage } from './components/LibraryPage';
import { MusicPlayer } from './components/MusicPlayer';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatBot } from './components/ChatBot';
import { GuestLandingPage } from './components/GuestLandingPage';
import { mockUsers, mockPlaylists, mockComments, mockSongs } from './data/mockData';
import { User, Playlist, Comment, Song } from './types';

// Main app content component
function AppContent() {
  const { user, isAuthenticated, isGuest, isLoading, updateUser, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [showAuthPage, setShowAuthPage] = useState(false);

  // Mock data state (for development - replace with API calls)
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [playlists, setPlaylists] = useState<Playlist[]>(mockPlaylists);
  const [comments, setComments] = useState<Comment[]>(mockComments);

  const handleLogin = async (username: string, password: string) => {
    // TODO: Replace with actual API call when backend is ready
    // For now, use mock data
    const mockUser = users.find((u) => u.username === username);
    if (mockUser) {
      // Set user in auth context
      updateUser(mockUser);
      setShowAuthPage(false);
    } else {
      throw new Error('User not found');
    }
  };

  const handleSignup = async (username: string, email: string, password: string) => {
    // TODO: Replace with actual API call when backend is ready
    // Create mock user
    const newUser: User = {
      id: `u${users.length + 1}`,
      username,
      email,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
      bio: 'New to SoundPuff!',
      followers: [],
      following: [],
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers([...users, newUser]);
    updateUser(newUser);
    setShowAuthPage(false);
  };

  const handleLogout = async () => {
    await logout();
    setCurrentPage('home');
    setShowAuthPage(false);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setSelectedPlaylistId(null);
    setSelectedUserId(null);
    setEditingPlaylistId(null);
  };

  const handlePlaylistClick = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setCurrentPage('playlist');
  };

  const handleUserClick = (userId: string) => {
    if (!userId) {
      setCurrentPage('search');
      return;
    }
    setSelectedUserId(userId);
    setCurrentPage('user-profile');
  };

  const handleLike = (playlistId: string) => {
    if (!user?.id) return;
    // TODO: Replace with API call - playlistAPI.likePlaylist / unlikePlaylist
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          const isLiked = p.likes.includes(user.id);
          return {
            ...p,
            likes: isLiked
              ? p.likes.filter((id) => id !== user.id)
              : [...p.likes, user.id],
          };
        }
        return p;
      })
    );
  };

  const handleFollow = (userId: string) => {
    if (!user?.id) return;
    // TODO: Replace with API call - userAPI.followUser / unfollowUser
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === user.id) {
          const isFollowing = u.following.includes(userId);
          return {
            ...u,
            following: isFollowing
              ? u.following.filter((id) => id !== userId)
              : [...u.following, userId],
          };
        }
        if (u.id === userId) {
          const isFollowed = u.followers.includes(user.id);
          return {
            ...u,
            followers: isFollowed
              ? u.followers.filter((id) => id !== user.id)
              : [...u.followers, user.id],
          };
        }
        return u;
      })
    );
  };

  const handleComment = (playlistId: string, text: string) => {
    if (!user?.id) return;
    // TODO: Replace with API call - commentAPI.addComment
    const currentUser = users.find((u) => u.id === user.id);
    if (!currentUser) return;

    const newComment: Comment = {
      id: `c${comments.length + 1}`,
      playlistId,
      userId: user.id,
      username: currentUser.username,
      avatar: currentUser.avatar,
      text,
      createdAt: new Date().toISOString(),
    };
    setComments([...comments, newComment]);
  };

  const handleUpdateProfile = (bio: string, avatar: string) => {
    if (!user?.id) return;
    // TODO: Replace with API call - userAPI.updateProfile
    const updatedUser = { ...user, bio, avatar };
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? updatedUser : u))
    );
    updateUser(updatedUser);
  };

  const handleSavePlaylist = (
    title: string,
    description: string,
    selectedSongs: Song[],
    coverArt: string
  ) => {
    if (!user?.id) return;

    if (editingPlaylistId) {
      // TODO: Replace with API call - playlistAPI.updatePlaylist
      setPlaylists((prev) =>
        prev.map((p) =>
          p.id === editingPlaylistId
            ? { ...p, title, description, songs: selectedSongs, coverArt }
            : p
        )
      );
      setEditingPlaylistId(null);
    } else {
      // TODO: Replace with API call - playlistAPI.createPlaylist
      const newPlaylist: Playlist = {
        id: `p${playlists.length + 1}`,
        title,
        description,
        songs: selectedSongs,
        userId: user.id,
        likes: [],
        createdAt: new Date().toISOString().split('T')[0],
        coverArt: coverArt || selectedSongs[0]?.coverArt,
      };
      setPlaylists([...playlists, newPlaylist]);
    }
    setCurrentPage('library');
  };

  const handleDeletePlaylist = () => {
    if (!selectedPlaylistId) return;
    if (confirm('Are you sure you want to delete this playlist?')) {
      // TODO: Replace with API call - playlistAPI.deletePlaylist
      setPlaylists((prev) => prev.filter((p) => p.id !== selectedPlaylistId));
      setCurrentPage('library');
    }
  };

  const handleEditPlaylist = () => {
    if (!selectedPlaylistId) return;
    setEditingPlaylistId(selectedPlaylistId);
    setCurrentPage('edit-playlist');
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Show guest landing page for non-authenticated users
  if (isGuest && !showAuthPage) {
    return <GuestLandingPage onShowAuth={() => setShowAuthPage(true)} />;
  }

  // Show auth page when guest clicks sign up/login
  if (isGuest && showAuthPage) {
    return (
      <AuthPage
        onLogin={handleLogin}
        onSignup={handleSignup}
        onBackToGuest={() => setShowAuthPage(false)}
      />
    );
  }

  // Get current user data
  const currentUser = users.find((u) => u.id === user?.id) || user;
  if (!currentUser) return null;

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            playlists={playlists}
            users={users}
            currentUserId={user!.id}
            onPlaylistClick={handlePlaylistClick}
            onUserClick={handleUserClick}
            onLike={handleLike}
          />
        );
      case 'search':
        return (
          <SearchPage
            songs={mockSongs}
            playlists={playlists}
            users={users}
            currentUserId={user!.id}
            onPlaylistClick={handlePlaylistClick}
            onUserClick={handleUserClick}
            onLike={handleLike}
            onFollow={handleFollow}
          />
        );
      case 'library':
        return (
          <LibraryPage
            playlists={playlists}
            users={users}
            currentUserId={user!.id}
            onPlaylistClick={handlePlaylistClick}
            onUserClick={handleUserClick}
            onLike={handleLike}
            onCreatePlaylist={() => setCurrentPage('create-playlist')}
          />
        );
      case 'profile':
        return (
          <ProfilePage
            user={currentUser}
            playlists={playlists}
            users={users}
            currentUserId={user!.id}
            onPlaylistClick={handlePlaylistClick}
            onUserClick={handleUserClick}
            onLike={handleLike}
            onFollow={handleFollow}
            onUpdateProfile={handleUpdateProfile}
          />
        );
      case 'user-profile':
        const selectedUser = users.find((u) => u.id === selectedUserId);
        if (!selectedUser) return null;
        return (
          <ProfilePage
            user={selectedUser}
            playlists={playlists}
            users={users}
            currentUserId={user!.id}
            onPlaylistClick={handlePlaylistClick}
            onUserClick={handleUserClick}
            onLike={handleLike}
            onFollow={handleFollow}
            onUpdateProfile={handleUpdateProfile}
          />
        );
      case 'playlist':
        const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);
        if (!selectedPlaylist) return null;
        const playlistUser = users.find((u) => u.id === selectedPlaylist.userId);
        if (!playlistUser) return null;
        const playlistComments = comments.filter((c) => c.playlistId === selectedPlaylistId);
        return (
          <PlaylistPage
            playlist={selectedPlaylist}
            user={playlistUser}
            comments={playlistComments}
            currentUserId={user!.id}
            onLike={handleLike}
            onComment={handleComment}
            onUserClick={handleUserClick}
            onPlaySong={setCurrentSong}
            onDeletePlaylist={
              selectedPlaylist.userId === user!.id ? handleDeletePlaylist : undefined
            }
            onEditPlaylist={
              selectedPlaylist.userId === user!.id ? handleEditPlaylist : undefined
            }
          />
        );
      case 'create-playlist':
        return (
          <CreatePlaylistPage
            availableSongs={mockSongs}
            onSave={handleSavePlaylist}
            onCancel={() => setCurrentPage('library')}
          />
        );
      case 'edit-playlist':
        const editingPlaylist = playlists.find((p) => p.id === editingPlaylistId);
        if (!editingPlaylist) return null;
        return (
          <CreatePlaylistPage
            availableSongs={mockSongs}
            onSave={handleSavePlaylist}
            onCancel={() => setCurrentPage('library')}
            editingPlaylist={editingPlaylist}
          />
        );
      default:
        return null;
    }
  };


  
  return (
    <div className="flex h-screen bg-black dark:bg-gray-950">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        currentUser={currentUser}
      />
      {renderPage()}
      <MusicPlayer currentSong={currentSong} />
      {isAuthenticated && <ChatBot />}
    </div>
  );

  
}

// Main App with providers
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
