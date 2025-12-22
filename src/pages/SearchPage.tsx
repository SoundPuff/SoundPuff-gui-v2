import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Play, Pause } from "lucide-react";
import { Input } from "../components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Song, Playlist, User } from "../types/index";
import { Button } from "../components/ui/button";
import { PlaylistCard } from "../components/PlaylistCard";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { searchService } from "../services/searchService";
import { userService } from "../services/userService";
import { playlistService } from "../services/playlistService";
import { useAuth } from "../contexts/AuthContext";
import { usePlayer } from "../contexts/PlayerContext";

export function SearchPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  
  const { currentSong, isPlaying, playSong } = usePlayer();

  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [rawResults, setRawResults] = useState<{
    songs: Song[];
    playlists: Playlist[];
    users: User[];
  }>({ songs: [], playlists: [], users: [] });

  const hydratedPlaylists = useMemo(() => {
    if (!user || !rawResults.playlists) return rawResults.playlists;

    return rawResults.playlists.map((playlist) => {
      const playlistIdStr = playlist.id.toString();
      const userLikedList = user.likedPlaylists || []; 
      
      const isLiked = userLikedList.includes(playlistIdStr);

      let updatedLikes = [...(playlist.likes || [])];

      if (isLiked && user.id && !updatedLikes.includes(user.id)) {
        updatedLikes.push(user.id);
      } 
      else if (!isLiked && user.id && updatedLikes.includes(user.id)) {
        updatedLikes = updatedLikes.filter(id => id !== user.id);
      }

      let updatedCount = playlist.likes_count || 0;
      if (isLiked && updatedCount === 0) {
        updatedCount = 1;
      }

      return {
        ...playlist,
        likes: updatedLikes,
        likes_count: updatedCount
      };
    });
  }, [rawResults.playlists, user]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const playlists = await playlistService.getPlaylists(0, 20);
      
      const allSongs = playlists.flatMap(p => p.songs || []);
      const shuffledSongs = allSongs.sort(() => 0.5 - Math.random()).slice(0, 10);

      const uniqueUsersMap = new Map();
      playlists.forEach(p => {
        if (p.owner && !uniqueUsersMap.has(p.owner.id)) {
           uniqueUsersMap.set(p.owner.id, {
             id: p.owner.id,
             username: p.owner.username,
             avatar: p.owner.avatar_url || "https://github.com/shadcn.png",
             bio: p.owner.bio || "",
             followers: [], 
             following: [],
             created_at: p.owner.created_at
           });
        }
      });
      const initialUsers = Array.from(uniqueUsersMap.values()).slice(0, 10);

      setRawResults({
        songs: shuffledSongs,
        playlists: playlists,
        users: initialUsers as User[]
      });

    } catch (error) {
      console.error("Initial fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      fetchInitialData();
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const allData = await searchService.searchAll(searchQuery);
        setRawResults({
          songs: allData.songs,
          playlists: allData.playlists,
          users: allData.users,
        });
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handlePlaylistClick = (playlistId: string) => {
    navigate(`/app/playlist/${playlistId}`);
  };

  const handleUserClick = (username: string) => {
    if (!username) {
      navigate("/app/search");
      return;
    }
    navigate(`/app/user/${username}`);
  };

  const handleLike = async (playlistId: string) => {
    if (!user?.id) return;

    const playlistIdStr = playlistId.toString();
    const isLiked = user.likedPlaylists?.includes(playlistIdStr) ?? false;
    const playlistIdNum = parseInt(playlistId);

    const updatedLikedPlaylists = isLiked
        ? user.likedPlaylists.filter(id => id !== playlistIdStr)
        : [...(user.likedPlaylists || []), playlistIdStr];

    updateUser({
        ...user,
        likedPlaylists: updatedLikedPlaylists
    });

    try {
      if (isLiked) {
        await playlistService.unlikePlaylist(playlistIdNum);
      } else {
        await playlistService.likePlaylist(playlistIdNum);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail;
      if (errorMessage === "Already liked this playlist" || error.response?.status === 400) {
        console.log("State zaten senkronize.");
      } else {
        console.error("Like hatası, geri alınıyor:", error);
        updateUser({ ...user, likedPlaylists: user.likedPlaylists }); 
      }
    }
  };

  const handleFollow = async (userId: string, username: string) => {
    if (!user) return; 
    const isCurrentlyFollowing = user.following?.includes(userId) || false;
    const optimisticFollowingList = isCurrentlyFollowing
      ? (user.following || []).filter((id) => id !== userId)
      : [...(user.following || []), userId];

    updateUser({ ...user, following: optimisticFollowingList });

    try {
      if (isCurrentlyFollowing) {
        await userService.unfollowUser(username);
      } else {
        await userService.followUser(username);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail;
      const status = error.response?.status;
      if (errorMessage === "Already following this user" || status === 400) {
        console.log("State already in sync.");
      } else {
        updateUser({ ...user, following: user.following });
      }
    }
  };

  // --- RENDER HELPER FUNCTION (HomePage Trending Songs yapısının birebir aynısı) ---
  const renderSongList = (songs: Song[]) => {
    return (
      // Ana Container: HomePage ile aynı stiller (bg-gray-900/30, border, divide-y)
      <div className="bg-gray-900/30 rounded-2xl border border-gray-800/50 divide-y divide-gray-800/50">
        {songs.map((song, index) => {
          const isCurrentSong = currentSong?.id === song.id;

          return (
            <div
              key={song.id}
              onClick={() => playSong(song)}
              // Satır Container: HomePage ile birebir aynı grid yapısı
              className="group p-4 grid grid-cols-[auto_1fr_1fr_auto] gap-4 items-center hover:bg-gray-800/30 transition-all cursor-pointer"
            >
              {/* 1. Sütun: Sıra Numarası / Play Butonu (Aynısı) */}
              <div className="w-8 flex items-center justify-center">
                {isCurrentSong && isPlaying ? (
                  <Pause className="w-4 h-4 text-pink fill-pink" />
                ) : isCurrentSong ? (
                  <Play className="w-4 h-4 text-pink fill-pink" />
                ) : (
                  <>
                    <span className="text-gray-500 font-medium group-hover:hidden">
                      {index + 1}
                    </span>
                    <Play className="w-4 h-4 hidden group-hover:block text-white fill-white" />
                  </>
                )}
              </div>

              {/* 2. Sütun: Resim, Başlık ve Sanatçı (Aynısı) */}
              <div className="flex items-center gap-4 min-w-0">
                <img
                  src={song.coverArt}
                  alt={song.title}
                  className="w-12 h-12 rounded object-cover shadow-lg"
                />
                <div className="min-w-0">
                  <p className={`font-semibold truncate transition-colors ${isCurrentSong ? 'text-pink' : 'text-white group-hover:text-green-400'}`}>
                    {song.title}
                  </p>
                  {/* Sanatçı adı burada her zaman görünür */}
                  <p className="text-sm text-gray-400 truncate">
                    {song.artist}
                  </p>
                </div>
              </div>

              {/* 3. Sütun: Masaüstü Ekstra Bilgi (HomePage'de Playlist Adı idi) */}
              {/* Search sonucunda playlist bilgisi olmadığı için, görsel dengeyi korumak adına burada tekrar Sanatçı adını gösteriyoruz (sadece masaüstünde) */}
              <div className="hidden md:block text-sm text-gray-400 truncate hover:text-white hover:underline z-10">
                {song.artist}
              </div>

              {/* 4. Sütun: Süre (Aynısı) */}
              <div className="text-sm text-gray-400 tabular-nums text-right pr-2">
                {Math.floor(song.duration / 60)}:
                {(song.duration % 60).toString().padStart(2, "0")}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!user) return null;

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
        <h1 className="text-white mb-4 text-4xl font-bold"
            style={{ 
              color: '#d95a96', 
              WebkitTextStroke: '0.5px #5b0425'
            }}>
          Search
        </h1>
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

        {isLoading && (
          <div className="flex justify-center mb-4">
            <LoadingSpinner size="sm" message="Searching SoundPuff..." />
          </div>
        )}

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="songs">Songs</TabsTrigger>
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 space-y-8">
            {/* SONGS */}
            {rawResults.songs.length > 0 && (
              <div>
                <h2 className="mb-4">Songs</h2>
                {/* YENİ GÖRÜNÜM İÇİN HELPER FONKSİYONU ÇAĞIRIYORUZ */}
                {renderSongList(rawResults.songs.slice(0, 5))}
              </div>
            )}

            {/* PLAYLISTS */}
            {hydratedPlaylists.length > 0 && (
              <div>
                <h2 className="mb-4">Playlists</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {hydratedPlaylists.slice(0, 4).map((playlist) => {
                    return (
                      <PlaylistCard
                        key={playlist.id}
                        playlist={playlist}
                        currentUserId={user.id}
                        onLike={handleLike}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* USERS - ALL TAB */}
            {rawResults.users.length > 0 && (
              <div>
                <h2 className="mb-4">Users</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rawResults.users.slice(0, 6).map((searchUser) => {
                    const isFollowing = user.following?.includes(searchUser.id);
                    const isCurrentUser = searchUser.id === user.id;

                    return (
                      <div
                        key={searchUser.id}
                        className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={searchUser.avatar}
                            alt={searchUser.username}
                            className="w-16 h-16 rounded-full object-cover cursor-pointer"
                            onClick={() => handleUserClick(searchUser.username)}
                          />
                          <div className="flex-1 min-w-0">
                            <div
                              className="text-white truncate cursor-pointer hover:underline"
                              onClick={() => handleUserClick(searchUser.username)}
                            >
                              {searchUser.username}
                            </div>
                            <div className="text-sm text-gray-400 truncate">
                              {searchUser.bio}
                            </div>
                          </div>
                        </div>
                        {!isCurrentUser && (
                          <Button
                            onClick={() =>
                              handleFollow(searchUser.id, searchUser.username)
                            }
                            variant={isFollowing ? "outline" : "default"}
                            className={`w-full mt-3 ${
                              isFollowing
                                ? "border-gray-700 text-white hover:bg-gray-800"
                                : "bg-pink hover:bg-green-600 text-black"
                            }`}
                          >
                            {isFollowing ? "Unfollow" : "Follow"}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {!isLoading &&
              searchQuery &&
              rawResults.songs.length === 0 &&
              hydratedPlaylists.length === 0 &&
              rawResults.users.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  No results found for "{searchQuery}"
                </div>
              )}
          </TabsContent>

          <TabsContent value="playlists" className="mt-6">
            {hydratedPlaylists.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {hydratedPlaylists.map((playlist) => (
                  <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    currentUserId={user.id}
                    onLike={handleLike}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                {searchQuery ? `No playlists found` : "Start typing to search"}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="songs" className="mt-6">
             {rawResults.songs.length > 0 ? (
               // YENİ GÖRÜNÜM (Tüm liste)
               renderSongList(rawResults.songs)
            ) : null}
          </TabsContent>
          
          {/* USERS TAB */}
          <TabsContent value="users" className="mt-6">
             {rawResults.users.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rawResults.users.map((searchUser) => {
                    const isFollowing = user.following?.includes(searchUser.id);
                    const isCurrentUser = searchUser.id === user.id;
                    return (
                      <div key={searchUser.id} className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors">
                        <div className="flex items-center gap-4">
                          <img src={searchUser.avatar} alt={searchUser.username} className="w-16 h-16 rounded-full object-cover cursor-pointer" 
                            onClick={() => handleUserClick(searchUser.username)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-white truncate cursor-pointer hover:underline" 
                                onClick={() => handleUserClick(searchUser.username)}
                            >
                                {searchUser.username}
                            </div>
                            <div className="text-sm text-gray-400 truncate">{searchUser.bio}</div>
                          </div>
                        </div>
                        {!isCurrentUser && (
                          <Button
                            onClick={() => handleFollow(searchUser.id, searchUser.username)}
                            variant={isFollowing ? "outline" : "default"}
                            className={`w-full mt-3 ${isFollowing ? "border-gray-700 text-white hover:bg-gray-800" : "bg-pink hover:bg-green-600 text-black"}`}
                          >
                            {isFollowing ? "Unfollow" : "Follow"}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
             ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}