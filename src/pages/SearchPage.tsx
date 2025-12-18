import React, { useState, useEffect } from "react";
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
    try {
      const playlistIdNum = parseInt(playlistId);
      const playlist = results.playlists.find((p) => p.id === playlistId);
      const isLiked = playlist?.likes.includes(user.id) || false;

      if (isLiked) {
        await playlistService.unlikePlaylist(playlistIdNum);
        setResults((prev) => ({
          ...prev,
          playlists: prev.playlists.map((p) => {
            if (p.id === playlistId) {
              return {
                ...p,
                likes: p.likes.filter((id) => id !== user.id),
              };
            }
            return p;
          }),
        }));
      } else {
        await playlistService.likePlaylist(playlistIdNum);
        setResults((prev) => ({
          ...prev,
          playlists: prev.playlists.map((p) => {
            if (p.id === playlistId) {
              return {
                ...p,
                likes: [...p.likes, user.id],
              };
            }
            return p;
          }),
        }));
      }
    } catch (error) {
      console.error("Failed to like/unlike playlist:", error);
    }
  };

  const handleFollow = async (userId: string, username: string) => {
    if (!user) return;

    const isCurrentlyFollowing = user.following.includes(userId);

    try {
      if (isCurrentlyFollowing) {
        await userService.unfollowUser(username);
      } else {
        await userService.followUser(username);
      }

      const updatedFollowingList = isCurrentlyFollowing
        ? user.following.filter((id) => id !== userId)
        : [...user.following, userId];

      updateUser({
        ...user,
        following: updatedFollowingList,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail;

      if (errorMessage === "Already following this user") {
        if (!user.following.includes(userId)) {
          updateUser({
            ...user,
            following: [...user.following, userId],
          });
        }
      } else if (errorMessage === "You are not following this user") {
        updateUser({
          ...user,
          following: user.following.filter((id) => id !== userId),
        });
      } else {
        console.error("Follow operation failed:", error);
      }
    }
  };

  if (!user) return null;

  const currentUserFollowing = user.following || [];

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
            {results.songs.length > 0 && (
              <div>
                <h2 className="mb-4">Songs</h2>
                <div className="bg-gray-900 rounded-lg divide-y divide-gray-800">
                  {results.songs.slice(0, 5).map((song) => (
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

            {results.playlists.length > 0 && (
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
                      createdAt: "",
                    };

                    return (
                      <PlaylistCard
                        key={playlist.id}
                        playlist={playlist}
                        user={placeholderUser}
                        currentUserId={user.id}
                        onLike={handleLike}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {results.users.length > 0 && (
              <div>
                <h2 className="mb-4">Users</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.users.slice(0, 6).map((searchUser) => {
                    const isFollowing = currentUserFollowing.includes(
                      searchUser.id
                    );
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
              results.songs.length === 0 &&
              results.playlists.length === 0 &&
              results.users.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  No results found for "{searchQuery}"
                </div>
              )}
          </TabsContent>

          <TabsContent value="songs" className="mt-6">
            {results.songs.length > 0 ? (
              <div className="bg-gray-900 rounded-lg divide-y divide-gray-800">
                {results.songs.map((song) => (
                  <div
                    key={song.id}
                    className="p-4 hover:bg-gray-800 transition-colors flex items-center gap-4"
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
            ) : (
              <div className="text-center py-12 text-gray-400">
                {searchQuery ? `No songs found` : "Start typing to search"}
              </div>
            )}
          </TabsContent>

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
                      email: "",
                      bio: "",
                      followers: [],
                      following: [],
                      createdAt: "",
                    }}
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

          <TabsContent value="users" className="mt-6">
            {results.users.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.users.map((searchUser) => {
                  const isFollowing = currentUserFollowing.includes(
                    searchUser.id
                  );
                  return (
                    <div
                      key={searchUser.id}
                      className="bg-gray-900 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={searchUser.avatar}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="text-white">{searchUser.username}</div>
                      </div>
                      {searchUser.id !== user.id && (
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
            ) : (
              <div className="text-center py-12 text-gray-400">
                {searchQuery ? `No users found` : "Start typing to search"}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
