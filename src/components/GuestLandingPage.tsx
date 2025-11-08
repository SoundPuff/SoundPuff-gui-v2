import { useState, useEffect } from 'react';
import { Music, LogIn, UserPlus } from 'lucide-react';
import { Button } from './ui/button';
import { PlaylistCard } from './PlaylistCard';
import { Playlist, User } from '../types';
import { mockPlaylists, mockUsers } from '../data/mockData';

interface GuestLandingPageProps {
  onShowAuth: () => void;
}

export function GuestLandingPage({ onShowAuth }: GuestLandingPageProps) {
  const [publicPlaylists, setPublicPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // FR15: Load public playlists for guest users
    // TODO: Replace with actual API call - playlistAPI.getPublicPlaylists(10)
    const loadPublicPlaylists = async () => {
      try {
        setLoading(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        // Use mock data - take first 10 playlists
        setPublicPlaylists(mockPlaylists.slice(0, 10));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load playlists');
      } finally {
        setLoading(false);
      }
    };

    loadPublicPlaylists();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-green-900">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Music className="w-16 h-16 text-green-500" />
            <h1 className="text-green-500">SoundPuff</h1>
          </div>
          <h2 className="text-white mb-4">
            Share Your Music, Connect With Others
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Create and share playlists, discover new music, and connect with music lovers
            around the world. Join SoundPuff today and start your musical journey.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={onShowAuth}
              size="lg"
              className="bg-green-500 hover:bg-green-600"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Sign Up Free
            </Button>
            <Button
              onClick={onShowAuth}
              size="lg"
              variant="outline"
              className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Log In
            </Button>
          </div>
        </div>

        {/* Public Playlists Section */}
        <div className="mt-16">
          <h3 className="text-white mb-6">Trending Public Playlists</h3>
          
          {loading && (
            <div className="text-center text-gray-400 py-12">
              <div className="animate-pulse">Loading playlists...</div>
            </div>
          )}

          {error && (
            <div className="text-center text-red-400 py-12">
              {error}
            </div>
          )}

          {!loading && !error && publicPlaylists.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              No public playlists available yet.
            </div>
          )}

          {!loading && !error && publicPlaylists.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {publicPlaylists.map((playlist) => {
                const playlistUser = mockUsers.find(u => u.id === playlist.userId);
                if (!playlistUser) return null;
                
                return (
                  <div key={playlist.id} className="opacity-75 hover:opacity-100 transition-opacity">
                    <PlaylistCard
                      playlist={playlist}
                      user={playlistUser}
                      currentUserId={null}
                      onPlaylistClick={() => {}}
                      onUserClick={() => {}}
                      onLike={() => {}}
                      isGuestMode={true}
                    />
                    <div className="mt-2 text-center">
                      <Button
                        onClick={onShowAuth}
                        size="sm"
                        variant="ghost"
                        className="text-green-400 hover:text-green-300"
                      >
                        Sign up to interact
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-gray-800/50 rounded-lg">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Music className="w-6 h-6 text-green-500" />
            </div>
            <h4 className="text-white mb-2">Create Playlists</h4>
            <p className="text-gray-400">
              Curate your perfect playlists and share them with the world
            </p>
          </div>
          <div className="text-center p-6 bg-gray-800/50 rounded-lg">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-6 h-6 text-green-500" />
            </div>
            <h4 className="text-white mb-2">Connect & Follow</h4>
            <p className="text-gray-400">
              Follow users with similar taste and discover new music
            </p>
          </div>
          <div className="text-center p-6 bg-gray-800/50 rounded-lg">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-6 h-6 text-green-500" />
            </div>
            <h4 className="text-white mb-2">Social Features</h4>
            <p className="text-gray-400">
              Like, comment, and engage with playlists from the community
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
