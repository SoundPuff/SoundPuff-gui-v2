import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Play, Pause, Heart, Plus } from "lucide-react";
import { createPortal } from "react-dom";
import { AddToPlaylistModal } from "../components/AddToPlaylistModal";
import { useLikedSongs } from "../hooks/useLikedSongs";
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

  // UI-only preview limits and progressive reveal counts
  const PREVIEW_LIMIT = 5;
  const [visibleSongs, setVisibleSongs] = useState(10);
  const [visiblePlaylists, setVisiblePlaylists] = useState(12);
  const [visibleUsers, setVisibleUsers] = useState(12);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [loadingMoreSongs, setLoadingMoreSongs] = useState(false);
  const [loadingMorePlaylists, setLoadingMorePlaylists] = useState(false);
  const [loadingMoreUsers, setLoadingMoreUsers] = useState(false);

  const [rawResults, setRawResults] = useState<{
    songs: Song[];
    playlists: Playlist[];
    users: User[];
  }>({ songs: [], playlists: [], users: [] });

  // NOTE: Do not hydrate playlists with user state here. Use server-provided
  // `is_liked` and `likes_count` from `rawResults.playlists` directly.

  // use shared liked-songs hook
  const { likedSongIds, likingSongId, handleLikeSong } = useLikedSongs();
  const [showAddToPlaylistForSong, setShowAddToPlaylistForSong] = useState<number | null>(null);

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
    if (!user) return;

    const idStr = playlistId.toString();
    const wasLiked = user.likedPlaylists?.includes(idStr) ?? false;

    // capture previous state for potential rollback
    const prevUser = user;
    const prevRaw = rawResults;

    // optimistic user update
    updateUser({
      ...user,
      likedPlaylists: wasLiked
        ? (user.likedPlaylists || []).filter((id) => id !== idStr)
        : [...(user.likedPlaylists || []), idStr],
    });

    // optimistic playlist update (only flip is_liked and adjust likes_count)
    setRawResults((prev) => ({
      ...prev,
      playlists: prev.playlists.map((p) =>
        p.id.toString() === idStr
          ? {
              ...p,
              is_liked: !wasLiked,
              likes_count: (p.likes_count || 0) + (wasLiked ? -1 : 1),
            }
          : p
      ),
    }));

    try {
      if (wasLiked) {
        await playlistService.unlikePlaylist(+playlistId);
      } else {
        await playlistService.likePlaylist(+playlistId);
      }
    } catch (error: any) {
      // rollback to previous state on error
      console.error("Like error, rolling back:", error);
      updateUser(prevUser);
      setRawResults(prevRaw);
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

  // --- FETCH MORE HELPERS ---
  const fetchMoreSongs = async () => {
    // If searching, call searchService with offset
    if (searchQuery.trim()) {
      setLoadingMoreSongs(true);
      try {
        const more = await searchService.searchSongs(searchQuery.trim(), 10, rawResults.songs.length);
        if (more.length > 0) {
          setRawResults((prev) => ({ ...prev, songs: [...prev.songs, ...more] }));
          setVisibleSongs((v) => v + more.length);
        }
      } catch (err) {
        console.error("Failed to fetch more songs:", err);
      } finally {
        setLoadingMoreSongs(false);
      }
      return;
    }

    // No search query: fetch more playlists and extract songs
    setLoadingMoreSongs(true);
    try {
      const nextPlaylists = await playlistService.getPlaylists(rawResults.playlists.length, 20);
      const moreSongs = nextPlaylists.flatMap((p) => p.songs || []);
      setRawResults((prev) => ({
        songs: [...prev.songs, ...moreSongs],
        playlists: [...prev.playlists, ...nextPlaylists],
        users: prev.users,
      }));
      setVisibleSongs((v) => v + moreSongs.length);
    } catch (err) {
      console.error("Failed to fetch more playlists for songs:", err);
    } finally {
      setLoadingMoreSongs(false);
    }
  };

  const fetchMorePlaylists = async () => {
    setLoadingMorePlaylists(true);
    try {
      if (searchQuery.trim()) {
        const more = await searchService.searchPlaylists(searchQuery.trim(), 12, rawResults.playlists.length);
        if (more.length > 0) {
          setRawResults((prev) => ({ ...prev, playlists: [...prev.playlists, ...more] }));
          setVisiblePlaylists((v) => v + more.length);
        }
      } else {
        const more = await playlistService.getPlaylists(rawResults.playlists.length, 12);
        if (more.length > 0) {
          setRawResults((prev) => ({ ...prev, playlists: [...prev.playlists, ...more] }));
          setVisiblePlaylists((v) => v + more.length);
        }
      }
    } catch (err) {
      console.error("Failed to fetch more playlists:", err);
    } finally {
      setLoadingMorePlaylists(false);
    }
  };

  const fetchMoreUsers = async () => {
    setLoadingMoreUsers(true);
    try {
      if (searchQuery.trim()) {
        const more = await searchService.searchUsers(searchQuery.trim(), 12, rawResults.users.length);
        if (more.length > 0) {
          setRawResults((prev) => ({ ...prev, users: [...prev.users, ...more] }));
          setVisibleUsers((v) => v + more.length);
        }
      } else {
        // No user search: pull more playlists and extract unique owners
        const morePlaylists = await playlistService.getPlaylists(rawResults.playlists.length, 20);
        const ownersMap = new Map(rawResults.users.map((u) => [u.id, u]));
        morePlaylists.forEach((p) => {
          if (p.owner && !ownersMap.has(p.owner.id)) {
            ownersMap.set(p.owner.id, {
              id: p.owner.id,
              username: p.owner.username,
              email: "",
              avatar: p.owner.avatar_url || "https://github.com/shadcn.png",
              bio: p.owner.bio || "",
              followers: [],
              following: [],
              likedPlaylists: [],
              createdAt: p.owner.created_at,
            });
          }
        });
  setRawResults((prev) => ({ ...prev, users: Array.from(ownersMap.values()), playlists: [...prev.playlists, ...morePlaylists] }));
  setVisibleUsers((v) => v + Array.from(ownersMap.values()).length - rawResults.users.length);
      }
    } catch (err) {
      console.error("Failed to fetch more users:", err);
    } finally {
      setLoadingMoreUsers(false);
    }
  };

  // --- RENDER HELPER FUNCTION (HomePage Trending Songs yapısının birebir aynısı) ---
  // ...existing code continues
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
                  <p className={`font-semibold truncate transition-colors ${isCurrentSong ? 'text-pink' : 'text-white group-hover:text-[#5b0426]'}`}>
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

              {/* 4. Sütun: Like + Add + Duration */}
              <div className="text-sm text-gray-400 tabular-nums text-right pr-2 flex items-center justify-end gap-3">

                {/* LIKE */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLikeSong(String(song.id));
                  }}
                  className={`
                    flex items-center transition-all
                    ${likedSongIds.has(String(song.id))
                      ? 'text-pink opacity-100'
                      : 'text-gray-400 opacity-0 group-hover:opacity-100 group-hover:text-pink'}
                    ${likingSongId === String(song.id) ? 'scale-95 opacity-80' : ''}
                  `}
                  title={likedSongIds.has(String(song.id))
                    ? 'Remove from Liked Songs'
                    : 'Add to Liked Songs'}
                >
                  <Heart
                    className={`w-4 h-4 transition-colors ${
                      likedSongIds.has(String(song.id)) ? 'fill-pink text-pink' : ''
                    }`}
                  />
                </button>

                {/* ADD TO PLAYLIST */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddToPlaylistForSong(Number(song.id));
                  }}
                  className="
                    p-1 transition-all
                    text-gray-400
                    opacity-0 group-hover:opacity-100
                    hover:text-white hover:scale-110
                  "
                  title="Add to another playlist"
                >
                  <Plus className="w-5 h-5" />
                </button>

                {/* DURATION (always visible, last) */}
                <div className="min-w-[44px] text-right">
                  {song.url && song.url !== "no" ? "0:30" : "--:--"}
                </div>

              </div>

            </div>
          );
        })}
      </div>
    );
  };

  const renderUserCard = (searchUser: User) => {
    const isFollowing = user?.following?.includes(searchUser.id);
    const isCurrentUser = searchUser.id === user?.id;

    return (
      <div key={searchUser.id} className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors">
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
            <div className="text-sm text-gray-400 truncate">{searchUser.bio}</div>
          </div>
        </div>
        {!isCurrentUser && (
          <Button
            onClick={() => handleFollow(searchUser.id, searchUser.username)}
            variant={isFollowing ? "outline" : "default"}
            className={`w-full mt-3 ${isFollowing ? "border-gray-700 text-white hover:bg-gray-800" : "bg-pink hover:bg-[#5b0426] text-black"}`}
          >
            {isFollowing ? "Unfollow" : "Follow"}
          </Button>
        )}
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

  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)} className="w-full">
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
                  <h2 className="mb-4" style={{ WebkitTextStroke: "0.5px #DB77A6" }}>
                    Songs
                  </h2>

                  {renderSongList(rawResults.songs.slice(0, PREVIEW_LIMIT))}

                  {rawResults.songs.length > PREVIEW_LIMIT && (
                    <button
                      onClick={() => setActiveTab("songs")}
                      className="mt-3 text-pink hover:underline text-sm"
                    >
                      See more songs
                    </button>
                  )}
                </div>
              )}

            {/* PLAYLISTS */}
            {rawResults.playlists.length > 0 && (
              <div>
                <h2 className="mb-4" style={{ WebkitTextStroke: "0.5px #DB77A6" }}>
                  Playlists
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {rawResults.playlists.slice(0, PREVIEW_LIMIT).map((playlist) => (
                    <PlaylistCard key={playlist.id} playlist={playlist} currentUserId={user.id} onLike={handleLike} />
                  ))}
                </div>

                {rawResults.playlists.length > PREVIEW_LIMIT && (
                  <button
                    onClick={() => setActiveTab("playlists")}
                    className="mt-3 text-pink hover:underline text-sm"
                  >
                    See more playlists
                  </button>
                )}
              </div>
            )}

            {/* USERS - ALL TAB */}
              {rawResults.users.length > 0 && (
              <div>
                <h2 className="mb-4" style={{ WebkitTextStroke: "0.5px #DB77A6" }}>
                  Users
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rawResults.users.slice(0, PREVIEW_LIMIT).map((searchUser) => renderUserCard(searchUser))}
                </div>

                {rawResults.users.length > PREVIEW_LIMIT && (
                  <button
                    onClick={() => setActiveTab("users")}
                    className="mt-3 text-pink hover:underline text-sm"
                  >
                    See more users
                  </button>
                )}
              </div>
            )}
            
            {!isLoading &&
              searchQuery &&
              rawResults.songs.length === 0 &&
              rawResults.playlists.length === 0 &&
              rawResults.users.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  No results found for "{searchQuery}"
                </div>
              )}
          </TabsContent>

          <TabsContent value="playlists" className="mt-6">
            {rawResults.playlists.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {rawResults.playlists.slice(0, visiblePlaylists).map((playlist) => (
                    <PlaylistCard key={playlist.id} playlist={playlist} currentUserId={user.id} onLike={handleLike} />
                  ))}
                </div>

                {(rawResults.playlists.length >= visiblePlaylists || rawResults.playlists.length > 0 || searchQuery.trim()) && (
                  <div className="flex justify-center mt-4">
                    <Button onClick={() => fetchMorePlaylists()} disabled={loadingMorePlaylists} className="bg-pink text-black hover:bg-[#5b0426]">
                      {loadingMorePlaylists ? "Loading..." : "Show more"}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-400">{searchQuery ? `No playlists found` : "Start typing to search"}</div>
            )}
          </TabsContent>
          
          <TabsContent value="songs" className="mt-6">
            {rawResults.songs.length > 0 ? (
              <>
                {renderSongList(rawResults.songs.slice(0, visibleSongs))}

                {(rawResults.songs.length >= visibleSongs || rawResults.songs.length > 0 || searchQuery.trim()) && (
                  <div className="flex justify-center mt-4">
                    <Button onClick={() => fetchMoreSongs()} disabled={loadingMoreSongs} className="bg-pink text-black hover:bg-[#5b0426]">
                      {loadingMoreSongs ? "Loading..." : "Show more"}
                    </Button>
                  </div>
                )}
              </>
            ) : null}
          </TabsContent>
          
          {/* USERS TAB */}
          <TabsContent value="users" className="mt-6">
            {rawResults.users.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rawResults.users.slice(0, visibleUsers).map((searchUser) => renderUserCard(searchUser))}
                </div>

                {(rawResults.users.length >= visibleUsers || rawResults.users.length > 0 || searchQuery.trim()) && (
                  <div className="flex justify-center mt-4">
                    <Button onClick={() => fetchMoreUsers()} disabled={loadingMoreUsers} className="bg-pink text-black hover:bg-[#5b0426]">
                      {loadingMoreUsers ? "Loading..." : "Show more"}
                    </Button>
                  </div>
                )}
              </>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
      {showAddToPlaylistForSong !== null && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center"
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
          onClick={() => setShowAddToPlaylistForSong(null)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <AddToPlaylistModal
              onSelect={async (targetPlaylistId) => {
                if (showAddToPlaylistForSong === null) return;
                try {
                  await playlistService.addSongToPlaylist(targetPlaylistId, showAddToPlaylistForSong);
                  alert("Song successfully added to playlist!");
                } catch (err: any) {
                  const detail = err?.response?.data?.detail;
                  if (detail === "Song already in playlist") {
                    alert("Song is already in that playlist ✔");
                  } else {
                    console.error(err);
                    alert("Failed to add song to playlist");
                  }
                } finally {
                  setShowAddToPlaylistForSong(null);
                }
              }}
              onClose={() => setShowAddToPlaylistForSong(null)}
            />
          </div>
        </div>
      , document.body)}
    </div>
  );
}