import { useState } from 'react';
import { Search, Music2, User as UserIcon } from 'lucide-react';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Song, Playlist, User } from '../types';
import { Button } from './ui/button';
import { PlaylistCard } from './PlaylistCard';

interface SearchPageProps {
  songs: Song[];
  playlists: Playlist[];
  users: User[];
  currentUserId: string;
  onPlaylistClick: (playlistId: string) => void;
  onUserClick: (userId: string) => void;
  onLike: (playlistId: string) => void;
  onFollow: (userId: string) => void;
}

export function SearchPage({
  songs,
  playlists,
  users,
  currentUserId,
  onPlaylistClick,
  onUserClick,
  onLike,
  onFollow,
}: SearchPageProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSongs = songs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.album.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPlaylists = playlists.filter(
    (playlist) =>
      playlist.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      playlist.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.bio.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentUser = users.find((u) => u.id === currentUserId);

  return (
    <div className="flex-1 bg-gradient-to-b from-gray-900 to-black text-white p-8 overflow-y-auto pb-32">
      <div className="max-w-7xl mx-auto">
        <h1 className="mb-8">Search</h1>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search for songs, playlists, or users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-gray-900 border-gray-800 text-white h-12"
          />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="songs">Songs</TabsTrigger>
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 space-y-8">
            {filteredSongs.length > 0 && (
              <div>
                <h2 className="mb-4">Songs</h2>
                <div className="bg-gray-900 rounded-lg divide-y divide-gray-800">
                  {filteredSongs.slice(0, 5).map((song) => (
                    <div key={song.id} className="p-4 hover:bg-gray-800 transition-colors flex items-center gap-4">
                      <img src={song.coverArt} alt={song.album} className="w-12 h-12 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="text-white truncate">{song.title}</div>
                        <div className="text-sm text-gray-400 truncate">{song.artist}</div>
                      </div>
                      <div className="text-gray-400 text-sm">
                        {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredPlaylists.length > 0 && (
              <div>
                <h2 className="mb-4">Playlists</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredPlaylists.slice(0, 4).map((playlist) => {
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
            )}

            {filteredUsers.length > 0 && (
              <div>
                <h2 className="mb-4">Users</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredUsers.slice(0, 6).map((user) => {
                    const isFollowing = currentUser?.following.includes(user.id);
                    const isCurrentUser = user.id === currentUserId;
                    return (
                      <div key={user.id} className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors">
                        <div className="flex items-center gap-4">
                          <img
                            src={user.avatar}
                            alt={user.username}
                            className="w-16 h-16 rounded-full object-cover cursor-pointer"
                            onClick={() => onUserClick(user.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div
                              className="text-white truncate cursor-pointer hover:underline"
                              onClick={() => onUserClick(user.id)}
                            >
                              {user.username}
                            </div>
                            <div className="text-sm text-gray-400 truncate">{user.bio}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {user.followers.length} followers
                            </div>
                          </div>
                        </div>
                        {!isCurrentUser && (
                          <Button
                            onClick={() => onFollow(user.id)}
                            variant={isFollowing ? 'outline' : 'default'}
                            className={`w-full mt-3 ${
                              isFollowing
                                ? 'border-gray-700 text-white hover:bg-gray-800'
                                : 'bg-green-500 hover:bg-green-600 text-black'
                            }`}
                          >
                            {isFollowing ? 'Unfollow' : 'Follow'}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {searchQuery && filteredSongs.length === 0 && filteredPlaylists.length === 0 && filteredUsers.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No results found for "{searchQuery}"
              </div>
            )}
          </TabsContent>

          <TabsContent value="songs" className="mt-6">
            {filteredSongs.length > 0 ? (
              <div className="bg-gray-900 rounded-lg divide-y divide-gray-800">
                {filteredSongs.map((song) => (
                  <div key={song.id} className="p-4 hover:bg-gray-800 transition-colors flex items-center gap-4">
                    <img src={song.coverArt} alt={song.album} className="w-12 h-12 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white truncate">{song.title}</div>
                      <div className="text-sm text-gray-400 truncate">{song.artist}</div>
                    </div>
                    <div className="text-gray-400 text-sm">
                      {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                {searchQuery ? `No songs found for "${searchQuery}"` : 'Start typing to search for songs'}
              </div>
            )}
          </TabsContent>

          <TabsContent value="playlists" className="mt-6">
            {filteredPlaylists.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPlaylists.map((playlist) => {
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
            ) : (
              <div className="text-center py-12 text-gray-400">
                {searchQuery ? `No playlists found for "${searchQuery}"` : 'Start typing to search for playlists'}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            {filteredUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((user) => {
                  const isFollowing = currentUser?.following.includes(user.id);
                  const isCurrentUser = user.id === currentUserId;
                  return (
                    <div key={user.id} className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-4">
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="w-16 h-16 rounded-full object-cover cursor-pointer"
                          onClick={() => onUserClick(user.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-white truncate cursor-pointer hover:underline"
                            onClick={() => onUserClick(user.id)}
                          >
                            {user.username}
                          </div>
                          <div className="text-sm text-gray-400 truncate">{user.bio}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {user.followers.length} followers
                          </div>
                        </div>
                      </div>
                      {!isCurrentUser && (
                        <Button
                          onClick={() => onFollow(user.id)}
                          variant={isFollowing ? 'outline' : 'default'}
                          className={`w-full mt-3 ${
                            isFollowing
                              ? 'border-gray-700 text-white hover:bg-gray-800'
                              : 'bg-green-500 hover:bg-green-600 text-black'
                          }`}
                        >
                          {isFollowing ? 'Unfollow' : 'Follow'}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                {searchQuery ? `No users found for "${searchQuery}"` : 'Start typing to search for users'}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
