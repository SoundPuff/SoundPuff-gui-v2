import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
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

export function SearchPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // API'den gelen HAM veri
  const [rawResults, setRawResults] = useState<{
    songs: Song[];
    playlists: Playlist[];
    users: User[];
  }>({ songs: [], playlists: [], users: [] });

  // ✨ VERİ BİRLEŞTİRME VE DEBUG NOKTASI
  const hydratedPlaylists = useMemo(() => {
    // 1. Güvenlik Kontrolü
    if (!user || !rawResults.playlists) return rawResults.playlists;

    // Konsola basalım: Kullanıcının beğeni listesi dolu mu?
    // Eğer burası 0 veya undefined geliyorsa sorun Layout.tsx veya API'dedir.
    console.log("🔍 [SearchPage] User Liked Playlists:", user.likedPlaylists);

    return rawResults.playlists.map((playlist) => {
      // 2. ID Eşleştirme (String'e çevirerek garanti altına alıyoruz)
      const playlistIdStr = playlist.id.toString();
      const userLikedList = user.likedPlaylists || []; // Boşsa boş array al
      
      const isLiked = userLikedList.includes(playlistIdStr);

      // Konsolda hangi playlistin kontrol edildiğini görelim
      if (isLiked) {
         console.log(`✅ Playlist BEĞENİLMİŞ TESPİT EDİLDİ: ID=${playlistIdStr}`);
      }

      // 3. 'likes' Arrayini Doldurma
      let updatedLikes = [...(playlist.likes || [])]; // Yeni referans oluştur

      // Eğer kullanıcı beğenmişse ama array'de yoksa EKLE
      if (isLiked && user.id && !updatedLikes.includes(user.id)) {
        updatedLikes.push(user.id);
      } 
      // Eğer kullanıcı beğenmemişse ama array'de varsa ÇIKAR
      else if (!isLiked && user.id && updatedLikes.includes(user.id)) {
        updatedLikes = updatedLikes.filter(id => id !== user.id);
      }

      // 4. Sayı Düzeltme
      // Eğer kullanıcı beğenmişse sayı en az 1 olmalı.
      // Search servisi bazen count'u güncel getirmeyebilir, biz düzeltiyoruz.
      let updatedCount = playlist.likes_count || 0;
      if (isLiked && updatedCount === 0) {
        updatedCount = 1;
      }

      return {
        ...playlist,
        likes: updatedLikes,       // PlaylistCard kalbin rengini buradan anlar
        likes_count: updatedCount  // PlaylistCard sayıyı buradan anlar
      };
    });
    // Dependency array'e 'user'ı komple ekledik ki user güncellenince burası tekrar çalışsın.
  }, [rawResults.playlists, user]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setRawResults({ songs: [], playlists: [], users: [] });
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

  const handleUserClick = (userId: string) => {
    if (!userId) {
      navigate("/app/search");
      return;
    }
    navigate(`/app/user/${userId}`);
  };

  const handleLike = async (playlistId: string) => {
    if (!user?.id) return;

    const playlistIdStr = playlistId.toString();
    const isLiked = user.likedPlaylists?.includes(playlistIdStr) ?? false;
    const playlistIdNum = parseInt(playlistId);

    // Optimistic Update
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

  if (!user) return null;

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
                <div className="bg-gray-900 rounded-lg divide-y divide-gray-800">
                  {rawResults.songs.slice(0, 5).map((song) => (
                    <div
                      key={song.id}
                      className="p-4 hover:bg-gray-800 transition-colors flex items-center gap-4 group"
                    >
                      <img
                        src={song.coverArt}
                        alt={song.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white truncate">{song.title}</div>
                        <div className="text-sm text-gray-400 truncate">
                          {song.artist}
                        </div>
                      </div>
                      <div className="text-gray-400 text-sm">
                        {Math.floor(song.duration / 60)}:
                        {(song.duration % 60).toString().padStart(2, "0")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PLAYLISTS - Hydrated Data Kullanılıyor */}
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

            {/* USERS */}
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
                            onClick={() => handleUserClick(searchUser.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div
                              className="text-white truncate cursor-pointer hover:underline"
                              onClick={() => handleUserClick(searchUser.id)}
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
                                : "bg-green-500 hover:bg-green-600 text-black"
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
              <div className="bg-gray-900 rounded-lg divide-y divide-gray-800">
                {rawResults.songs.map((song) => (
                  <div key={song.id} className="p-4 hover:bg-gray-800 transition-colors flex items-center gap-4">
                     <img src={song.coverArt} className="w-10 h-10 rounded" />
                     <div className="flex-1">
                        <div className="text-white">{song.title}</div>
                        <div className="text-sm text-gray-400">{song.artist}</div>
                     </div>
                  </div>
                ))}
              </div>
            ) : null}
          </TabsContent>
          
          <TabsContent value="users" className="mt-6">
             {rawResults.users.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rawResults.users.map((searchUser) => {
                    const isFollowing = user.following?.includes(searchUser.id);
                    const isCurrentUser = searchUser.id === user.id;
                    return (
                      <div key={searchUser.id} className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors">
                        <div className="flex items-center gap-4">
                          <img src={searchUser.avatar} alt={searchUser.username} className="w-16 h-16 rounded-full object-cover cursor-pointer" onClick={() => handleUserClick(searchUser.id)}/>
                          <div className="flex-1 min-w-0">
                            <div className="text-white truncate cursor-pointer hover:underline" onClick={() => handleUserClick(searchUser.id)}>{searchUser.username}</div>
                            <div className="text-sm text-gray-400 truncate">{searchUser.bio}</div>
                          </div>
                        </div>
                        {!isCurrentUser && (
                          <Button
                            onClick={() => handleFollow(searchUser.id, searchUser.username)}
                            variant={isFollowing ? "outline" : "default"}
                            className={`w-full mt-3 ${isFollowing ? "border-gray-700 text-white hover:bg-gray-800" : "bg-green-500 hover:bg-green-600 text-black"}`}
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