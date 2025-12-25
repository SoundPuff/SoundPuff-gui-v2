import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Playlist } from '../types';
import { PlaylistCard } from '../components/PlaylistCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { playlistService } from '../services/playlistService';
import { useAuth } from '../contexts/AuthContext';

export function LibraryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [myPlaylists, setMyPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatePlaylistHovered, setIsCreatePlaylistHovered] = useState(false);
  const [isCreateFirstPlaylistHovered, setIsCreateFirstPlaylistHovered] = useState(false);

  useEffect(() => {
    const fetchMyPlaylists = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const playlists = await playlistService.getPlaylists(0, 100);
        setMyPlaylists(playlists.filter((p) => p.userId === user.id));
      } catch (error) {
        console.error('Failed to fetch playlists:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMyPlaylists();
  }, [user?.id]);

  const handlePlaylistClick = (playlistId: string) => {
    navigate(`/app/playlist/${playlistId}`);
  };

  const handleUserClick = (userId: string) => {
    if (!userId) {
      navigate('/app/search');
      return;
    }
    navigate(`/app/user/${userId}`);
  };

  const handleLike = async (playlistId: string) => {
    if (!user?.id) return;

    const playlistIdNum = Number(playlistId);
    const playlist = myPlaylists.find(p => p.id === playlistIdNum);
    if (!playlist) return;

    try {
      if (playlist.is_liked) {
        await playlistService.unlikePlaylist(playlistIdNum);
        setMyPlaylists(prev =>
          prev.map(p =>
            p.id === playlistIdNum
              ? {
                  ...p,
                  is_liked: false,
                  likes_count: Math.max(0, p.likes_count - 1),
                }
              : p
          )
        );
      } else {
        await playlistService.likePlaylist(playlistIdNum);
        setMyPlaylists(prev =>
          prev.map(p =>
            p.id === playlistIdNum
              ? {
                  ...p,
                  is_liked: true,
                  likes_count: p.likes_count + 1,
                }
              : p
          )
        );
      }
    } catch (error) {
      console.error("Failed to like/unlike playlist:", error);
    }
  };


  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex-1 text-white p-8 overflow-y-auto pb-32"
      style={{
        background: `
          radial-gradient(circle at 0% 0%, rgba(231, 140, 137, 0.15), transparent 30%),
          radial-gradient(circle at 100% 0%, rgba(231, 140, 137, 0.15), transparent 30%),
          radial-gradient(circle at 0% 100%, rgba(231, 140, 137, 0.15), transparent 30%),
          radial-gradient(circle at 100% 100%, rgba(231, 140, 137, 0.15), transparent 30%),
          black
        `,
      }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="h-8 bg-gray-800 rounded w-48 animate-pulse" />
            <div className="h-10 bg-gray-800 rounded w-40 animate-pulse" />
          </div>
          <LoadingSkeleton type="playlist" count={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 text-white p-8 overflow-y-auto pb-32"
    style={{
        background: `
          radial-gradient(circle at 0% 0%, rgba(231, 140, 137, 0.15), transparent 30%),
          radial-gradient(circle at 100% 0%, rgba(231, 140, 137, 0.15), transparent 30%),
          radial-gradient(circle at 0% 100%, rgba(231, 140, 137, 0.15), transparent 30%),
          radial-gradient(circle at 100% 100%, rgba(231, 140, 137, 0.15), transparent 30%),
          black
        `,
      }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-white mb-4 text-4xl font-bold"
              style={{ 
                color: '#d95a96', 
                WebkitTextStroke: '0.5px #5b0425'
              }}>
            My Playlists
          </h1>
          <Button
            onClick={() => navigate('/app/create-playlist')}
            size="lg"
            onMouseEnter={() => setIsCreatePlaylistHovered(true)}
            onMouseLeave={() => setIsCreatePlaylistHovered(false)}
            style={{
              backgroundColor: isCreatePlaylistHovered ? '#D95A96' : '#DB77A6',
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Playlist
          </Button>
        </div>

        {myPlaylists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {myPlaylists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                currentUserId={user.id}
                onLike={handleLike}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 rounded-lg p-12 text-center">
            <p className="text-gray-400 mb-4">
              You haven't created any playlists yet
            </p>
            <Button
              onClick={() => navigate('/app/create-playlist')}
              size="lg"
              onMouseEnter={() => setIsCreateFirstPlaylistHovered(true)}
              onMouseLeave={() => setIsCreateFirstPlaylistHovered(false)}
              style={{
                backgroundColor: isCreateFirstPlaylistHovered ? '#D95A96' : '#DB77A6',
              }}
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Playlist
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

