import React from 'react';
import { Playlist, User } from '../types';
import { PlaylistCard } from './PlaylistCard';
import { Plus } from 'lucide-react';
import { Button } from './ui/button';

interface LibraryPageProps {
  playlists: Playlist[];
  users: User[];
  currentUserId: string;
  onPlaylistClick: (playlistId: string) => void;
  onUserClick: (userId: string) => void;
  onLike: (playlistId: string) => void;
  onCreatePlaylist: () => void;
}

export function LibraryPage({
  playlists,
  users,
  currentUserId,
  onPlaylistClick,
  onUserClick,
  onLike,
  onCreatePlaylist,
}: LibraryPageProps) {
  const myPlaylists = playlists.filter((p) => p.userId === currentUserId);
  const currentUser = users.find((u) => u.id === currentUserId);

  return (
    <div className="flex-1 bg-gradient-to-b from-gray-900 to-black text-white p-8 overflow-y-auto pb-32">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1>My Playlists</h1>
          <Button onClick={onCreatePlaylist} className="bg-green-500 hover:bg-green-600 text-black">
            <Plus className="w-4 h-4 mr-2" />
            Create Playlist
          </Button>
        </div>

        {myPlaylists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {myPlaylists.map((playlist) => {
              if (!currentUser) return null;
              return (
                <PlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  user={currentUser}
                  onPlaylistClick={onPlaylistClick}
                  onUserClick={onUserClick}
                  currentUserId={currentUserId}
                  onLike={onLike}
                />
              );
            })}
          </div>
        ) : (
          <div className="bg-gray-900 rounded-lg p-12 text-center">
            <p className="text-gray-400 mb-4">You haven't created any playlists yet</p>
            <Button onClick={onCreatePlaylist} className="bg-green-500 hover:bg-green-600 text-black">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Playlist
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
