import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Playlist, User } from "../types";
import { PlaylistCard } from "../components/PlaylistCard";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { playlistService } from "../services/playlistService";
import { useAuth } from "../contexts/AuthContext";

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        // Fetch feed playlists (from followed users)
        const feedPlaylists = await playlistService.getFeed(0, 50);

        // Fetch all playlists for discover section
        const allPlaylists = await playlistService.getPlaylists(0, 50);

        console.log(allPlaylists);

        setPlaylists(allPlaylists);

        // Extract unique user IDs and create user objects
        const userIds = new Set<string>();
        allPlaylists.forEach((p) => userIds.add(p.userId || ""));

        // For now, we'll use placeholder users since we don't have a user service to fetch by ID
        // In a real app, you'd fetch user details here
        setUsers(
          Array.from(userIds).map((id) => ({
            id,
            username: "User",
            email: "",
            avatar: "https://github.com/shadcn.png",
            bio: "",
            followers: [],
            following: [],
            createdAt: "",
          }))
        );
      } catch (error) {
        console.error("Failed to fetch playlists:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

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
      const playlist = playlists.find((p) => p.id === playlistIdNum);
      const isLiked = playlist?.likes?.includes(user.id) || false;

      if (isLiked) {
        await playlistService.unlikePlaylist(playlistIdNum);
        setPlaylists((prev) =>
          prev.map((p) => {
            if (p.id === playlistIdNum) {
              return {
                ...p,
                likes: p.likes?.filter((id) => id !== user.id),
              };
            }
            return p;
          })
        );
      } else {
        await playlistService.likePlaylist(playlistIdNum);
        setPlaylists((prev) =>
          prev.map((p) => {
            if (p.id === playlistIdNum) {
              return {
                ...p,
                likes: [...(p.likes || []), user.id],
              };
            }
            return p;
          })
        );
      }
    } catch (error) {
      console.error("Failed to like/unlike playlist:", error);
    }
  };

  if (!user) return null;

  const currentUser = users.find((u) => u.id === user.id) || user;

  // Filter playlists from users that current user follows
  const feedPlaylists = playlists
    .filter((playlist) => currentUser?.following.includes(playlist.userId || ""))
    .sort(
      (a: Playlist, b: Playlist) =>
        new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()
    );

  if (isLoading) {
    return (
      <div className="flex-1 bg-gradient-to-b from-gray-900 to-black text-white p-8 overflow-y-auto pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-gray-800 rounded w-48 mb-2 animate-pulse" />
            <div className="h-4 bg-gray-800 rounded w-64 animate-pulse" />
          </div>
          <LoadingSkeleton type="playlist" count={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gradient-to-b from-gray-900 to-black text-white p-8 overflow-y-auto pb-32">
      <div className="max-w-7xl mx-auto">
        <h1 className="mb-2">Your Feed</h1>
        <p className="text-gray-400 mb-8">
          Latest playlists from people you follow
        </p>

        {feedPlaylists.length === 0 ? (
          <div className="bg-gray-900 rounded-lg p-12 text-center">
            <p className="text-gray-400 mb-4">
              Your feed is empty. Follow some users to see their playlists here!
            </p>
            <button
              onClick={() => handleUserClick("")}
              className="text-green-500 hover:underline"
            >
              Discover users
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {feedPlaylists.map((playlist) => {
              // const user = users.find((u) => u.id === playlist.userId);
              // if (!user) return null;
              return (
                <PlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  user={user}
                  currentUserId={user.id}
                  onLike={handleLike}
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
                  currentUserId={user.id}
                  onLike={handleLike}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
