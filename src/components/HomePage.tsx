import { Playlist, User } from '../types';
import { PlaylistCard } from './PlaylistCard';

interface HomePageProps {
  playlists: Playlist[];
  users: User[];
  currentUserId: string;
  onPlaylistClick: (playlistId: string) => void;
  onUserClick: (userId: string) => void;
  onLike: (playlistId: string) => void;
}

export function HomePage({
  playlists,
  users,
  currentUserId,
  onPlaylistClick,
  onUserClick,
  onLike,
}: HomePageProps) {
  const currentUser = users.find((u) => u.id === currentUserId);
  
  // Filter playlists from users that current user follows
  const feedPlaylists = playlists
    .filter((playlist) => currentUser?.following.includes(playlist.userId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="flex-1 bg-gradient-to-b from-gray-900 to-black text-white p-8 overflow-y-auto pb-32">
      <div className="max-w-7xl mx-auto">
        <h1 className="mb-2">Your Feed</h1>
        <p className="text-gray-400 mb-8">Latest playlists from people you follow</p>

        {feedPlaylists.length === 0 ? (
          <div className="bg-gray-900 rounded-lg p-12 text-center">
            <p className="text-gray-400 mb-4">
              Your feed is empty. Follow some users to see their playlists here!
            </p>
            <button
              onClick={() => onUserClick('')}
              className="text-green-500 hover:underline"
            >
              Discover users
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {feedPlaylists.map((playlist) => {
              const user = users.find((u) => u.id === playlist.userId);
              if (!user) return null;
              return (
                <PlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  user={user}
                  onPlaylistClick={onPlaylistClick}
                  onUserClick={onUserClick}
                  currentUserId={currentUserId}
                  onLike={onLike}
                />
              );
            })}
          </div>
        )}

        <div className="mt-12">
          <h2 className="mb-6">Discover Playlists</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {playlists.slice(0, 8).map((playlist) => {
              const user = users.find((u) => u.id === playlist.userId);
              if (!user) return null;
              return (
                <PlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  user={user}
                  onPlaylistClick={onPlaylistClick}
                  onUserClick={onUserClick}
                  currentUserId={currentUserId}
                  onLike={onLike}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
