import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, LogIn, UserPlus } from 'lucide-react';
import { Button } from './ui/button';
import { PlaylistCard } from './PlaylistCard';
import { LoadingSkeleton } from './LoadingSkeleton';
import { Playlist, User } from '../types';
import { mockPlaylists, mockUsers } from '../data/mockData';
import { playlistService } from '../services/playlistService';
import logoPng from '../data/soundpuff_logo.png';

export function GuestLandingPage() {
  const navigate = useNavigate();
  const [publicPlaylists, setPublicPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSignUpHovered, setIsSignUpHovered] = useState(false);
  const [isLogInHovered, setIsLogInHovered] = useState(false);

  useEffect(() => {
    const loadPublicPlaylists = async () => {
      try {
        setLoading(true);
        const playlists = await playlistService.getPlaylists(0, 10);
        setPublicPlaylists(playlists);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load playlists');
      } finally {
        setLoading(false);
      }
    };

    loadPublicPlaylists();
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{
        background: `
          radial-gradient(circle at 0% 0%, rgba(231, 140, 137, 0.15), transparent 30%),
          radial-gradient(circle at 100% 0%, rgba(231, 140, 137, 0.15), transparent 30%),
          radial-gradient(circle at 0% 100%, rgba(231, 140, 137, 0.15), transparent 30%),
          radial-gradient(circle at 100% 100%, rgba(231, 140, 137, 0.15), transparent 30%),
          black
        `,
      }}
    >
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-10 mt-20">
            <img src={logoPng} alt="SoundPuff Logo" width="600"/>
          </div>
          <h2 className="text-white mb-4 text-4xl font-bold"
              style={{ 
                color: '#d95a96', 
                WebkitTextStroke: '0.5px #5b0425'
              }}>
            Share Your Music & Connect With Others
          </h2>
          <h4 className="text-white mb-4 text-4xl font-bold max-w-2xl mt-20 mb-20 mx-auto"
              style={{ 
                    WebkitTextStroke: '0.5px #d95a96'
                  }}>
            Create and share playlists, discover new music, and connect with music lovers
            around the world. Join SoundPuff today to start your musical journey.
          </h4>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => navigate('/auth')}
              size="lg"
              onMouseEnter={() => setIsSignUpHovered(true)}
              onMouseLeave={() => setIsSignUpHovered(false)}
              style={{
                backgroundColor: isSignUpHovered ? '#23759e' : '#33ace3',
              }}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Sign Up Free
            </Button>
            <Button
              onClick={() => navigate('/auth')}
              size="lg"
              onMouseEnter={() => setIsLogInHovered(true)}
              onMouseLeave={() => setIsLogInHovered(false)}
              style={{
                backgroundColor: isLogInHovered ? '#33ace3' : 'transparent',
                color: isLogInHovered ? 'black' : '#33ace3',
                borderColor: '#23759e',
                borderWidth: '1px'
              }}
            >
              <LogIn className="w-5 h-5 mr-2" />
              Log In
            </Button>
          </div>
        </div>

        {/* Public Playlists Section */}
        <div className="mt-16">
          <h3 className="text-white mb-6"
            style={{ 
                  WebkitTextStroke: '0.5px #d95a96'
                }}>
          Trending Public Playlists</h3>
          
          {loading && (
            <div className="py-12">
              <LoadingSkeleton type="playlist" count={4} />
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
                
                return (
                  <div key={playlist.id} className="opacity-75 hover:opacity-100 transition-opacity">
                    <PlaylistCard
                      playlist={playlist}
                      currentUserId={null}
                      onLike={() => {}}
                      isGuestMode={true}
                    />
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
            <h3 className="text-white mb-2"
            style={{ 
                color: '#d95a96', 
                WebkitTextStroke: '0.5px #5b0425'
              }}>Create Playlists</h3>
            <h4 className="text-white"
            style={{ 
                    WebkitTextStroke: '0.5px #d95a96'
                  }}>
              Curate your perfect playlists and share them with the world
            </h4>
          </div>
          <div className="text-center p-6 bg-gray-800/50 rounded-lg">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-white mb-2"
            style={{ 
                color: '#d95a96', 
                WebkitTextStroke: '0.5px #5b0425'
              }}>Connect & Follow</h3>
            <h4 className="text-white"
            style={{ 
                    WebkitTextStroke: '0.5px #d95a96'
                  }}>
              Follow users with similar taste and discover new music
            </h4>
          </div>
          <div className="text-center p-6 bg-gray-800/50 rounded-lg">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-white mb-2"
            style={{ 
                color: '#d95a96', 
                WebkitTextStroke: '0.5px #5b0425'
              }}>Social Features</h3>
            <h4 className="text-white"
            style={{ 
                    WebkitTextStroke: '0.5px #d95a96'
                  }}>
              Like, comment, and engage with playlists from the community
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
}
