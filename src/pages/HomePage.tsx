import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Playlist } from "../types";
import { PlaylistCard } from "../components/PlaylistCard";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { playlistService } from "../services/playlistService";
import { useAuth } from "../contexts/AuthContext";
// ✅ YENİ: Pause ikonu eklendi
import { X, Play, Pause, TrendingUp, User as UserIcon } from "lucide-react"; 
import { Button } from "../components/ui/button";
// ✅ YENİ: Player Context
import { usePlayer } from "../contexts/PlayerContext";

const categories = ['All', 'Recently Added', 'Popular', 'Rock', 'Pop', 'Jazz', 'Hip-Hop', 'Electronic', 'Classical'];

export function HomePage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  
  // ✅ YENİ: Global Player State
  const { playSong, currentSong, isPlaying } = usePlayer();

  const [rawFeed, setRawFeed] = useState<Playlist[]>([]);
  const [rawDiscover, setRawDiscover] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState('All');

  // ✨ VERİ BİRLEŞTİRME (HYDRATION)
  const hydrateList = (list: Playlist[]) => {
    if (!user) return list;
    return list.map(playlist => {
      const isLiked = user.likedPlaylists?.includes(playlist.id.toString());
      let updatedLikes = playlist.likes || [];
      
      if (isLiked && !updatedLikes.includes(user.id)) {
        updatedLikes = [...updatedLikes, user.id];
      } else if (!isLiked && updatedLikes.includes(user.id)) {
        updatedLikes = updatedLikes.filter(id => id !== user.id);
      }

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

  // --- DESIGN LOGIC ENTEGRASYONU ---
  const filterByCategory = (playlistList: Playlist[]) => {
    if (selectedCategory === 'All') return playlistList;
    
    if (selectedCategory === 'Recently Added') {
      return [...playlistList].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
        const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
        return dateB - dateA;
      });
    }
    
    if (selectedCategory === 'Popular') {
      return [...playlistList].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    }
    
    return playlistList.filter(p => p.title.toLowerCase().includes(selectedCategory.toLowerCase()));
  };

  const filteredFeedPlaylists = filterByCategory(feedPlaylists);
  const filteredDiscoverPlaylists = filterByCategory(discoverPlaylists);

  const heroPlaylist = useMemo(() => {
    if (discoverPlaylists.length === 0) return null;
    return [...discoverPlaylists].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))[0];
  }, [discoverPlaylists]);

  const featuredArtists = useMemo(() => {
    const artistsMap = new Map();
    [...discoverPlaylists, ...feedPlaylists].forEach(p => {
        if (p.owner && p.owner.id !== user?.id) {
            artistsMap.set(p.owner.id, p.owner);
        }
    });
    return Array.from(artistsMap.values()).slice(0, 8);
  }, [discoverPlaylists, feedPlaylists, user?.id]);

  const trendingSongs = useMemo(() => {
    return discoverPlaylists.flatMap((playlist) =>
        (playlist.songs || []).map((song) => ({
          ...song,
          playlistId: playlist.id,
          playlistTitle: playlist.title,
          playlistLikes: playlist.likes_count || 0,
          playlistUser: playlist.owner,
        }))
      )
      .sort((a, b) => b.playlistLikes - a.playlistLikes)
      .slice(0, 5);
  }, [discoverPlaylists]);


  // --- AKSİYONLAR ---
  const handlePlaylistClick = (playlistId: string) => {
    navigate(`/app/playlist/${playlistId}`);
  };

  const handleUserClick = (username: string) => {
    navigate(`/app/user/${username}`);
  };


  const handleLike = async (playlistId: string) => {
    if (!user?.id) return;

    const isLiked = user.likedPlaylists?.includes(playlistId.toString()) ?? false;
    const playlistIdNum = parseInt(playlistId);

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
      updateUser({ ...user, likedPlaylists: user.likedPlaylists });
    }
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex-1 bg-gray-950 text-white p-8 overflow-y-auto pb-32">
        <LoadingSkeleton type="playlist" count={8} />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-950 text-white overflow-y-auto pb-32">
      
      {/* Category Chips */}
      <div className="sticky top-0 z-20 bg-gray-950 border-b border-gray-800/50 backdrop-blur-sm">
        <div className="px-6 py-3">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all flex items-center gap-2 text-sm ${
                  selectedCategory === category
                    ? 'bg-white text-black'
                    : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-200'
                }`}
              >
                {category}
                {selectedCategory === category && selectedCategory !== 'All' && (
                  <X 
                    className="w-3 h-3" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCategory('All');
                    }} 
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        
       {/* HERO BANNER */}
       {heroPlaylist && selectedCategory === 'All' && (
          <div 
            className="mb-12 relative w-full h-[500px] rounded-2xl overflow-hidden group cursor-pointer border border-gray-800 shadow-2xl" 
            onClick={() => handlePlaylistClick(heroPlaylist.id.toString())}
          >
            <div className="absolute inset-0 w-full h-full">
              {heroPlaylist.coverArt ? (
                <img
                  src={heroPlaylist.coverArt}
                  alt={heroPlaylist.title}
                  className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-1000"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-900 to-black" />
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
            </div>

            <div className="relative h-full flex items-end p-8 md:p-12 z-10">
              <div className="flex-1 max-w-4xl">
                <span className="inline-block px-4 py-1.5 bg-pink text-black text-xs font-bold rounded-full mb-4 tracking-wide uppercase shadow-lg shadow-pink/20">
                  Featured Playlist
                </span>
                
                <h1 className="text-5xl md:text-7xl font-extrabold mb-4 text-white leading-tight drop-shadow-2xl">
                    {heroPlaylist.title}
                </h1>
                
                <p className="text-gray-200 text-lg md:text-xl mb-8 line-clamp-2 max-w-2xl font-medium drop-shadow-md">
                  {heroPlaylist.description || "Dive into this amazing collection of tracks selected just for you."}
                </p>
                
                <div className="flex items-center gap-8 mb-8">
                  {heroPlaylist.owner && (
                    <button
                        onClick={(e) => {
                        e.stopPropagation();
                        handleUserClick(heroPlaylist.owner.username);
                        }}
                        className="flex items-center gap-3 hover:text-white text-gray-200 transition-colors group/user"
                    >
                        <img
                        src={heroPlaylist.owner.avatar_url || "https://github.com/shadcn.png"}
                        alt={heroPlaylist.owner.username}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20 group-hover/user:ring-pink transition-all shadow-md"
                        />
                        <span className="font-bold text-lg shadow-black drop-shadow-md">{heroPlaylist.owner.username}</span>
                    </button>
                  )}
                  <div className="hidden sm:flex items-center gap-6 text-sm text-gray-300 font-medium">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-pink rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)]"></span>
                        <span>{heroPlaylist.likes_count || 0} likes</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-pink rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)]"></span>
                        <span>{heroPlaylist.songs?.length || 0} songs</span>
                    </div>
                  </div>
                </div>

                <Button
                  className="bg-pink hover:bg-green-400 text-black px-10 py-7 rounded-full font-bold text-lg shadow-xl shadow-green-900/40 transition-all hover:scale-105 hover:shadow-pink/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Hero banner olduğu için burada tüm playlisti açması daha mantıklı
                    handlePlaylistClick(heroPlaylist.id.toString());
                  }}
                >
                  <Play className="w-6 h-6 mr-2 fill-black" />
                  Play Now
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* FEATURED ARTISTS */}
        {featuredArtists.length > 0 && selectedCategory === 'All' && (
          <div className="mb-10">
            <h2 className="mb-5 text-xl font-bold">Featured Artists</h2>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
              {featuredArtists.map((artist) => (
                <button
                  key={artist.id}
                  onClick={() => handleUserClick(artist.username)}
                  className="flex-shrink-0 text-center group"
                >
                  <div className="relative mb-3">
                    <img
                      src={artist.avatar_url || "https://github.com/shadcn.png"}
                      alt={artist.username}
                      className="w-32 h-32 rounded-full object-cover ring-4 ring-gray-800 group-hover:ring-pink transition-all"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-full transition-all" />
                  </div>
                  <p className="text-sm font-semibold group-hover:text-green-400 transition-colors truncate w-32">
                    {artist.username}
                  </p>
                  <p className="text-xs text-gray-400 truncate">Artist</p>
                </button>
              ))}
            </div>
          </div>
        )}


        {/* TRENDING SONGS */}
        {trendingSongs.length > 0 && selectedCategory === 'All' && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-6 h-6 text-pink" />
              <h2 className="text-xl font-bold">Trending Songs</h2>
            </div>
            <div className="bg-gray-900/30 rounded-2xl border border-gray-800/50 divide-y divide-gray-800/50">
              {trendingSongs.map((song, index) => {
                // ✅ GÜNCELLEME: Çalan şarkı kontrolü
                const isCurrentSong = currentSong?.id === song.id;

return (
  <div
    key={`${song.playlistId}-${song.id}`}
    className="group p-4 flex items-center gap-4 hover:bg-gray-800/30 transition-all cursor-pointer"
    onClick={() => playSong(song)}
  >
    {/* Rank - ONLY number */}
    <div className="w-8 flex items-center justify-center text-gray-500">
      <span className={`text-2xl transition-colors duration-200 ${isCurrentSong ? 'opacity-50' : 'opacity-100 group-hover:text-pink-500'}`}>
        {index + 1}
      </span>
    </div>

    {/* Song Info */}
    <div className="flex-1 min-w-0">
      <p className={`font-semibold truncate transition-colors ${isCurrentSong ? 'text-pink' : 'group-hover:text-green-400'}`}>
        {song.title}
      </p>
      <p className="text-sm text-gray-400 truncate">{song.artist}</p>
    </div>

    {/* Playlist Info */}
    <div 
      className="hidden md:block text-sm text-gray-400 truncate max-w-xs w-1/4 hover:text-white hover:underline z-10"
      onClick={(e) => {
        e.stopPropagation();
        handlePlaylistClick(song.playlistId.toString());
      }}
    >
      {song.playlistTitle}
    </div>

    {/* User */}
    {song.playlistUser && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleUserClick(song.playlistUser.id);
        }}
        className="hidden lg:flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors z-10"
      >
        <img
          src={song.playlistUser.avatar_url || "https://github.com/shadcn.png"}
          alt={song.playlistUser.username}
          className="w-6 h-6 rounded-full object-cover"
        />
        <span className="truncate max-w-24">{song.playlistUser.username}</span>
      </button>
    )}

    {/* Duration with less right padding */}
    <div className="text-sm text-gray-400 tabular-nums pr-2">
      {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}
    </div>

    {/* Play/Pause Icon on the right side of duration */}
    <div className="w-8 flex items-center justify-center text-white">
      {isCurrentSong && isPlaying ? (
        <Pause className="w-5 h-5 fill-white" />
      ) : (
        <Play className="w-5 h-5 fill-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      )}
    </div>
  </div>
);

              })}
            </div>
          </div>
        )}

        {/* FEED SECTION */}
        {filteredFeedPlaylists.length > 0 && (
          <div className="mb-10">
            <h2 className="mb-5 text-xl font-bold">Your Feed</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filteredFeedPlaylists.map((playlist) => (
                <div key={`feed-${playlist.id}`} className="min-w-0">
                  <PlaylistCard
                    playlist={playlist}
                    currentUserId={user.id}
                    onLike={handleLike}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DISCOVER SECTION */}
        <div>
          <h2 className="mb-5 text-xl font-bold">
            {filteredFeedPlaylists.length > 0 ? 'Discover More' : 'Discover Playlists'}
          </h2>
          
          {filteredDiscoverPlaylists.length === 0 ? (
            <div className="bg-gray-900/50 rounded-2xl p-12 text-center border border-gray-800/50">
              <p className="text-gray-400 mb-4">
                No playlists found in this category.
              </p>
              <button
                onClick={() => setSelectedCategory('All')}
                className="text-pink hover:underline"
              >
                View all playlists
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filteredDiscoverPlaylists.map((playlist) => (
                // Hero playlist'i tekrar gösterme
                (selectedCategory === 'All' && heroPlaylist && playlist.id === heroPlaylist.id) ? null : (
                  <div key={`discover-${playlist.id}`} className="min-w-0">
                    <PlaylistCard
                      playlist={playlist}
                      currentUserId={user.id}
                      onLike={handleLike}
                    />
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}