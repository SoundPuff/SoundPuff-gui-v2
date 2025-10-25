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
import { mockUsers, mockPlaylists, mockComments, mockSongs } from './data/mockData';
import { User, Playlist, Comment, Song } from './types';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);

  // Mock data state
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [playlists, setPlaylists] = useState<Playlist[]>(mockPlaylists);
  const [comments, setComments] = useState<Comment[]>(mockComments);

  const handleLogin = (username: string, password: string) => {
    // Mock login - find user by username
    const user = users.find((u) => u.username === username);
    if (user) {
      setCurrentUserId(user.id);
      setIsAuthenticated(true);
    } else {
      alert('User not found. Try "musiclover99"');
    }
  };

  const handleSignup = (username: string, email: string, password: string) => {
    // Mock signup - create new user
    const newUser: User = {
      id: `u${users.length + 1}`,
      username,
      email,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjEzNjk0ODh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      bio: 'New to SoundPuff!',
      followers: [],
      following: [],
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers([...users, newUser]);
    setCurrentUserId(newUser.id);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUserId(null);
    setCurrentPage('home');
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
      // Navigate to search to discover users
      setCurrentPage('search');
      return;
    }
    setSelectedUserId(userId);
    setCurrentPage('user-profile');
  };

  const handleLike = (playlistId: string) => {
    if (!currentUserId) return;
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          const isLiked = p.likes.includes(currentUserId);
          return {
            ...p,
            likes: isLiked
              ? p.likes.filter((id) => id !== currentUserId)
              : [...p.likes, currentUserId],
          };
        }
        return p;
      })
    );
  };

  const handleFollow = (userId: string) => {
    if (!currentUserId) return;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === currentUserId) {
          const isFollowing = u.following.includes(userId);
          return {
            ...u,
            following: isFollowing
              ? u.following.filter((id) => id !== userId)
              : [...u.following, userId],
          };
        }
        if (u.id === userId) {
          const isFollowed = u.followers.includes(currentUserId);
          return {
            ...u,
            followers: isFollowed
              ? u.followers.filter((id) => id !== currentUserId)
              : [...u.followers, currentUserId],
          };
        }
        return u;
      })
    );
  };

  const handleComment = (playlistId: string, text: string) => {
    if (!currentUserId) return;
    const user = users.find((u) => u.id === currentUserId);
    if (!user) return;

    const newComment: Comment = {
      id: `c${comments.length + 1}`,
      playlistId,
      userId: currentUserId,
      username: user.username,
      avatar: user.avatar,
      text,
      createdAt: new Date().toISOString(),
    };
    setComments([...comments, newComment]);
  };

  const handleUpdateProfile = (bio: string, avatar: string) => {
    if (!currentUserId) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUserId ? { ...u, bio, avatar } : u))
    );
  };

  const handleSavePlaylist = (
    title: string,
    description: string,
    selectedSongs: Song[],
    coverArt: string
  ) => {
    if (!currentUserId) return;

    if (editingPlaylistId) {
      // Edit existing playlist
      setPlaylists((prev) =>
        prev.map((p) =>
          p.id === editingPlaylistId
            ? { ...p, title, description, songs: selectedSongs, coverArt }
            : p
        )
      );
      setEditingPlaylistId(null);
    } else {
      // Create new playlist
      const newPlaylist: Playlist = {
        id: `p${playlists.length + 1}`,
        title,
        description,
        songs: selectedSongs,
        userId: currentUserId,
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
      setPlaylists((prev) => prev.filter((p) => p.id !== selectedPlaylistId));
      setCurrentPage('library');
    }
  };

  const handleEditPlaylist = () => {
    if (!selectedPlaylistId) return;
    setEditingPlaylistId(selectedPlaylistId);
    setCurrentPage('edit-playlist');
  };

  if (!isAuthenticated) {
    return <AuthPage onLogin={handleLogin} onSignup={handleSignup} />;
  }

  const currentUser = users.find((u) => u.id === currentUserId);
  if (!currentUser) return null;

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            playlists={playlists}
            users={users}
            currentUserId={currentUserId!}
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
            currentUserId={currentUserId!}
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
            currentUserId={currentUserId!}
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
            currentUserId={currentUserId!}
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
            currentUserId={currentUserId!}
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
            currentUserId={currentUserId!}
            onLike={handleLike}
            onComment={handleComment}
            onUserClick={handleUserClick}
            onPlaySong={setCurrentSong}
            onDeletePlaylist={
              selectedPlaylist.userId === currentUserId ? handleDeletePlaylist : undefined
            }
            onEditPlaylist={
              selectedPlaylist.userId === currentUserId ? handleEditPlaylist : undefined
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
    <div className="flex h-screen bg-black">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        currentUser={currentUser}
      />
      {renderPage()}
      <MusicPlayer currentSong={currentSong} />
    </div>
  );
}
