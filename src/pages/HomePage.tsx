import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Playlist } from "../types";
import { PlaylistCard } from "../components/PlaylistCard";
import { Button } from '../components/ui/button';
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { playlistService } from "../services/playlistService";
import { useAuth } from "../contexts/AuthContext";

export function HomePage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  
  // Ham verileri tutuyoruz (API'den geldiği gibi)
  const [rawFeed, setRawFeed] = useState<Playlist[]>([]);
  const [rawDiscover, setRawDiscover] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDiscoverUsersHovered, setIsDiscoverUsersHovered] = useState(false);

  // ✨ VERİ BİRLEŞTİRME (HYDRATION)
  // Bu fonksiyon API'den gelen veriyi (count var, likes yok) 
  // kullanıcının yerel verisiyle (ben bunu beğendim mi?) birleştirir.
  const hydrateList = (list: Playlist[]) => {
    if (!user) return list;
    return list.map(playlist => {
      // Senin beğeni listende bu playlist ID'si var mı?
      const isLiked = user.likedPlaylists?.includes(playlist.id.toString());
      
      let updatedLikes = playlist.likes || [];
      
      // Eğer beğendiysen, 'likes' dizisine kendini ekle ki kalp kırmızı olsun
      if (isLiked && !updatedLikes.includes(user.id)) {
        updatedLikes = [...updatedLikes, user.id];
      } else if (!isLiked && updatedLikes.includes(user.id)) {
        updatedLikes = updatedLikes.filter(id => id !== user.id);
      }

      // Eğer beğendiysen ama API '0' diyorsa, onu '1' yapıyoruz
      let updatedCount = playlist.likes_count;
      if (isLiked && updatedCount === 0) {
        updatedCount = 1;
      }

      return {
        ...playlist,
        likes: updatedLikes,
        likes_count: updatedCount
      };
    });
  };

  // User verisi veya ham veri değişince listeleri yeniden hesapla
  const feedPlaylists = useMemo(() => hydrateList(rawFeed), [rawFeed, user?.likedPlaylists, user?.id]);
  const discoverPlaylists = useMemo(() => hydrateList(rawDiscover), [rawDiscover, user?.likedPlaylists, user?.id]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        const feedData = await playlistService.getFeed(0, 20);
        setRawFeed(feedData);

        const discoverData = await playlistService.getPlaylists(0, 20);
        setRawDiscover(discoverData);

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

  // Beğeni işlemi - Sadece Global Context'i güncelliyoruz, gerisini useMemo hallediyor
  const handleLike = async (playlistId: string) => {
    if (!user?.id) return;

    const isLiked = user.likedPlaylists?.includes(playlistId.toString()) ?? false;
    const playlistIdNum = parseInt(playlistId);

    // 1. Optimistic Update (Global Context)
    const updatedLikedPlaylists = isLiked
        ? user.likedPlaylists.filter(id => id !== playlistId.toString())
        : [...(user.likedPlaylists || []), playlistId.toString()];

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
    } catch (error) {
      console.error("Failed to like/unlike playlist:", error);
      // Hata olursa geri al
      updateUser({ ...user, likedPlaylists: user.likedPlaylists });
    }
  };

  if (!user) return null;

  if (isLoading) {
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
          <LoadingSkeleton type="playlist" count={8} />
        </div>
      </div>
    );
  }

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
          Your Feed
        </h1>
        <h4 className="text-white mb-8"
            style={{ 
                  WebkitTextStroke: '0.5px #d95a96'
                }}>
          Latest playlists from people you follow
        </h4>

        {feedPlaylists.length === 0 ? (
          <div className="bg-gray-900 rounded-lg p-12 text-center mb-12"
          style={{ outline: '3px solid #33ace3' }}>
            <p className="text-gray-400 mb-4">
              Your feed is empty. Follow some users to see their playlists here!
            </p>
            <Button
              onClick={() => handleUserClick("")}
              variant="ghost"
              onMouseEnter={() => setIsDiscoverUsersHovered(true)}
              onMouseLeave={() => setIsDiscoverUsersHovered(false)}
              style={{
                backgroundColor: isDiscoverUsersHovered ? '#374151' : 'transparent' // gray-700
              }}
            >
              <p className='text-white'
                style={{ 
                      WebkitTextStroke: '0.5px #d95a96'
                    }}>Discover Users</p>
            </Button>
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

        <div className="mt-12">
          <h1 className="text-white mb-4 text-4xl font-bold"
              style={{ 
                color: '#d95a96', 
                WebkitTextStroke: '0.5px #5b0425'
              }}>
            Discover Playlists
          </h1>
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