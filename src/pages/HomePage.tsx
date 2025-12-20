import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Playlist } from "../types";
import { PlaylistCard } from "../components/PlaylistCard";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { playlistService } from "../services/playlistService";
import { useAuth } from "../contexts/AuthContext";

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // İki ayrı liste için state tutuyoruz
  const [feedPlaylists, setFeedPlaylists] = useState<Playlist[]>([]);
  const [discoverPlaylists, setDiscoverPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        // 1. Feed verisini API'den çek (Takip edilenlerin playlistleri)
        const feedData = await playlistService.getFeed(0, 20);
        setFeedPlaylists(feedData);

        // 2. Discover verisini API'den çek (Tüm playlistler)
        const discoverData = await playlistService.getPlaylists(0, 20);
        setDiscoverPlaylists(discoverData);

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

  // Like işlemi yapıldığında her iki listeyi de güncellememiz gerekir
  const handleLike = async (playlistId: string) => {
    if (!user?.id) return;

    // Helper function to update a list of playlists
    const updateList = (list: Playlist[]) => {
      return list.map((p) => {
        if (p.id.toString() === playlistId.toString()) {
          const isLiked = p.likes?.includes(user.id);
          return {
            ...p,
            likes: isLiked
              ? p.likes?.filter((id) => id !== user.id)
              : [...(p.likes || []), user.id],
            likes_count: isLiked ? (p.likes_count - 1) : (p.likes_count + 1)
          };
        }
        return p;
      });
    };

    // Optimistic UI Update
    // Hem feed hem discover listesinde aynı playlist olabilir, ikisini de güncelliyoruz.
    setFeedPlaylists((prev) => updateList(prev));
    setDiscoverPlaylists((prev) => updateList(prev));

    try {
      const playlistIdNum = parseInt(playlistId);
      // Hangi listede varsa oradan like durumunu kontrol et
      const playlist = [...feedPlaylists, ...discoverPlaylists].find(
        (p) => p.id === playlistIdNum
      );
      
      if (!playlist) return;

      const isLiked = playlist.likes?.includes(user.id) || false;

      if (isLiked) {
        await playlistService.unlikePlaylist(playlistIdNum);
      } else {
        await playlistService.likePlaylist(playlistIdNum);
      }
    } catch (error) {
      console.error("Failed to like/unlike playlist:", error);
      // Hata durumunda state'i geri alabilir veya sayfayı yeniletebilirsiniz
    }
  };

  if (!user) return null;

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
        {/* --- YOUR FEED SECTION --- */}
        <h1 className="mb-2">Your Feed</h1>
        <p className="text-gray-400 mb-8">
          Latest playlists from people you follow
        </p>

        {feedPlaylists.length === 0 ? (
          <div className="bg-gray-900 rounded-lg p-12 text-center mb-12">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {feedPlaylists.map((playlist) => (
              <PlaylistCard
                key={`feed-${playlist.id}`}
                playlist={playlist}
                currentUserId={user.id}
                onLike={handleLike}
              />
            ))}
          </div>
        )}

        {/* --- DISCOVER SECTION --- */}
        <div className="mt-12">
          <h2 className="mb-6">Discover Playlists</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {discoverPlaylists.map((playlist) => (
              <PlaylistCard
                key={`discover-${playlist.id}`}
                playlist={playlist}
                currentUserId={user.id}
                onLike={handleLike}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}