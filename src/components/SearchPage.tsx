import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Song, Playlist, User } from '../types/index'; 
import { Button } from './ui/button';
import { PlaylistCard } from './PlaylistCard';
import { searchService } from '../services/searchService'; 

interface SearchPageProps {
  currentUserId: string;
  currentUserFollowing: string[]; //new prop
  
  onPlaylistClick: (playlistId: string) => void;
  onUserClick: (userId: string) => void;
  onLike: (playlistId: string) => void;
  onFollow: (userId: string, username: string) => void; 
}

export function SearchPage({
  currentUserId,
  currentUserFollowing, // Prop'u aldık
  onPlaylistClick,
  onUserClick,
  onLike,
  onFollow,
}: SearchPageProps) {
  // ... (State tanımları ve useEffect aynı kalıyor) ...
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    songs: Song[];
    playlists: Playlist[];
    users: User[];
  }>({ songs: [], playlists: [], users: [] });

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults({ songs: [], playlists: [], users: [] });
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const allData = await searchService.searchAll(searchQuery);
        setResults({
          songs: allData.songs,
          playlists: allData.playlists,
          users: allData.users
        });
      } catch (error) {
        console.error("Arama sırasında hata oluştu:", error);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <div className="flex-1 bg-gradient-to-b from-gray-900 to-black text-white p-8 overflow-y-auto pb-32">
        {/* ... (Search input ve Header kısımları aynı) ... */}
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

        {/* Loading Göstergesi */}
        {isLoading && (
          <div className="text-center text-green-500 mb-4 animate-pulse">
            Searching SoundPuff...
          </div>
        )}

        <Tabs defaultValue="all" className="w-full">
          {/* ... (TabsList aynı) ... */}
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="songs">Songs</TabsTrigger>
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          {/* === ALL TAB === */}
          <TabsContent value="all" className="mt-6 space-y-8">
            
            {/* ... (Songs ve Playlists Section aynı) ... */}
            {results.songs.length > 0 && (
                // ... Songs map ...
                <div>
                <h2 className="mb-4">Songs</h2>
                <div className="bg-gray-900 rounded-lg divide-y divide-gray-800">
                  {results.songs.slice(0, 5).map((song) => (
                    <div key={song.id} className="p-4 hover:bg-gray-800 transition-colors flex items-center gap-4 group">
                      <img src={song.coverArt} alt={song.title} className="w-12 h-12 rounded object-cover" />
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
            
            {results.playlists.length > 0 && (
                // ... Playlists map ...
                <div>
                <h2 className="mb-4">Playlists</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {results.playlists.slice(0, 4).map((playlist) => {
                    const placeholderUser: User = {
                      id: playlist.userId,
                      username: "Unknown User",
                      avatar: "https://github.com/shadcn.png",
                      email: "",
                      bio: "",
                      followers: [],
                      following: [],
                      createdAt: ""
                    };

                    return (
                      <PlaylistCard
                        key={playlist.id}
                        playlist={playlist}
                        user={placeholderUser} 
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

            {/* USERS SECTION (GÜNCELLENDİ) */}
            {results.users.length > 0 && (
              <div>
                <h2 className="mb-4">Users</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.users.slice(0, 6).map((user) => {
                    
                    // 🌟 GÜNCELLEME: Artık gerçek following listesinden kontrol ediyoruz
                    const isFollowing = currentUserFollowing.includes(user.id);
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
                          </div>
                        </div>
                        {!isCurrentUser && (
                          <Button
                          onClick={() => onFollow(user.id, user.username)} 
    
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
             {/* ... (No results found) ... */}
             {!isLoading && searchQuery && results.songs.length === 0 && results.playlists.length === 0 && results.users.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No results found for "{searchQuery}"
              </div>
            )}
          </TabsContent>

          {/* ... (Diğer tablar aynı mantıkla güncellenebilir veya olduğu gibi kalabilir) ... */}
           {/* === SONGS TAB === */}
           <TabsContent value="songs" className="mt-6">
            {results.songs.length > 0 ? (
              <div className="bg-gray-900 rounded-lg divide-y divide-gray-800">
                {results.songs.map((song) => (
                  <div key={song.id} className="p-4 hover:bg-gray-800 transition-colors flex items-center gap-4">
                    <img src={song.coverArt} alt={song.title} className="w-12 h-12 rounded object-cover" />
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
                {searchQuery ? `No songs found` : 'Start typing to search'}
              </div>
            )}
          </TabsContent>

          {/* === PLAYLISTS TAB === */}
          <TabsContent value="playlists" className="mt-6">
             {results.playlists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {results.playlists.map((playlist) => (
                     <PlaylistCard
                        key={playlist.id}
                        playlist={playlist}
                        user={{
                          id: playlist.userId,
                          username: "User",
                          avatar: "https://github.com/shadcn.png",
                          email: "", bio: "", followers: [], following: [], createdAt: ""
                        }} 
                        onPlaylistClick={onPlaylistClick}
                        onUserClick={onUserClick}
                        currentUserId={currentUserId}
                        onLike={onLike}
                      />
                  ))}
                </div>
             ) : (
                <div className="text-center py-12 text-gray-400">
                   {searchQuery ? `No playlists found` : 'Start typing to search'}
                </div>
             )}
          </TabsContent>

          {/* === USERS TAB === */}
          <TabsContent value="users" className="mt-6">
             {/* Burası 'all' tabındaki Users kısmının aynısı olabilir */}
             {results.users.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {results.users.map((user) => {
                    const isFollowing = currentUserFollowing.includes(user.id);
                    return (
                        <div key={user.id} className="bg-gray-900 rounded-lg p-4">
                        {/* User Card Tasarımı (Yukarıdakinin aynısı) */}
                        <div className="flex items-center gap-4">
                            <img src={user.avatar} className="w-12 h-12 rounded-full"/>
                            <div className="text-white">{user.username}</div>
                        </div>
                        {user.id !== currentUserId && (
                          <Button
                          onClick={() => onFollow(user.id, user.username)} 
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
                   {searchQuery ? `No users found` : 'Start typing to search'}
                </div>
             )}
          </TabsContent>

        </Tabs>
        </div>
    </div>
  );
}