import { Heart, Play, Music2 } from 'lucide-react';
import { Playlist, User } from '../types';
import { Button } from './ui/button';

interface PlaylistCardProps {
  playlist: Playlist;
  user: User;
  onPlaylistClick: (playlistId: string) => void;
  onUserClick: (userId: string) => void;
  currentUserId: string;
  onLike: (playlistId: string) => void;
}

export function PlaylistCard({
  playlist,
  user,
  onPlaylistClick,
  onUserClick,
  currentUserId,
  onLike,
}: PlaylistCardProps) {
  const isLiked = playlist.likes.includes(currentUserId);

  return (
    <div className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors group">
      <div className="relative mb-4">
        <div className="aspect-square rounded-lg overflow-hidden bg-gray-800">
          {playlist.coverArt ? (
            <img
              src={playlist.coverArt}
              alt={playlist.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music2 className="w-16 h-16 text-gray-600" />
            </div>
          )}
        </div>
        <Button
          size="icon"
          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-green-500 hover:bg-green-600 rounded-full w-12 h-12 shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            onPlaylistClick(playlist.id);
          }}
        >
          <Play className="w-5 h-5 text-black fill-black ml-0.5" />
        </Button>
      </div>

      <div onClick={() => onPlaylistClick(playlist.id)} className="cursor-pointer">
        <h3 className="text-white mb-1 truncate">{playlist.title}</h3>
        <p className="text-gray-400 text-sm line-clamp-2 mb-2">{playlist.description}</p>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUserClick(user.id);
          }}
          className="flex items-center gap-2 hover:underline"
        >
          <img src={user.avatar} alt={user.username} className="w-6 h-6 rounded-full object-cover" />
          <span className="text-sm text-gray-400">{user.username}</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLike(playlist.id);
          }}
          className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-green-500 text-green-500' : ''}`} />
          <span className="text-sm">{playlist.likes.length}</span>
        </button>
      </div>
    </div>
  );
}
