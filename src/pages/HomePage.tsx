import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Playlist } from "../types";
import { PlaylistCard } from "../components/PlaylistCard";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { playlistService } from "../services/playlistService";
import { useAuth } from "../contexts/AuthContext";
import { X, Play, Pause, TrendingUp, ChevronLeft, ChevronRight, Heart } from "lucide-react"; 
import { Button } from "../components/ui/button";
import { usePlayer } from "../contexts/PlayerContext";

const categories = ['All', 'Recently Added', 'Popular', 'Rock', 'Pop', 'Jazz', 'Hip-Hop', 'Electronic', 'Classical'];

// --- CAROUSEL CONSTANTS ---
const VISIBLE_COUNT = 4; // Ekranda aynı anda kaç tane görünecek
const ANIMATION_DURATION = 500;

type AnimationState = 'idle' | 'exiting' | 'entering';
type Direction = 'next' | 'prev';

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { playSong, currentSong, isPlaying } = usePlayer();

  // --- DATA STATE (Original) ---
  const [rawFeed, setRawFeed] = useState<Playlist[]>([]);
  const [rawDiscover, setRawDiscover] = useState<Playlist[]>([]);
  const [myPlaylists, setMyPlaylists] = useState<Playlist[] | null>(null);
  const [likingSongId, setLikingSongId] = useState<string | null>(null);
  const [likedPlaylistId, setLikedPlaylistId] = useState<number | null>(null);
  const [likedSongIds, setLikedSongIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // --- CAROUSEL STATE (New) ---
  const [feedIndex, setFeedIndex] = useState(0);
  const [discoverIndex, setDiscoverIndex] = useState(0);
  
  const [feedAnimState, setFeedAnimState] = useState<AnimationState>('idle');
  const [discoverAnimState, setDiscoverAnimState] = useState<AnimationState>('idle');
  
  const [feedDirection, setFeedDirection] = useState<Direction>('next');
  const [discoverDirection, setDiscoverDirection] = useState<Direction>('next');

  const feedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const discoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- FETCH DATA (Original Logic Preserved) ---
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        // Original endpoint calls preserved
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

  // --- FILTERING (Original Logic wrapped in useMemo for Slider Efficiency) ---
  const filteredFeedPlaylists = useMemo(() => {
    const list = rawFeed;
    if (selectedCategory === 'All') return list;
    if (selectedCategory === 'Recently Added') {
      return [...list].sort((a, b) => new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime());
    }
    if (selectedCategory === 'Popular') {
      return [...list].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    }
    return list.filter(p => p.title.toLowerCase().includes(selectedCategory.toLowerCase()));
  }, [rawFeed, selectedCategory]);

  const filteredDiscoverPlaylists = useMemo(() => {
    const list = rawDiscover;
    if (selectedCategory === 'All') return list;
    if (selectedCategory === 'Recently Added') {
      return [...list].sort((a, b) => new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime());
    }
    if (selectedCategory === 'Popular') {
      return [...list].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    }
    return list.filter(p => p.title.toLowerCase().includes(selectedCategory.toLowerCase()));
  }, [rawDiscover, selectedCategory]);

  // --- SLIDER LOGIC (New Feature) ---
  const getAnimationClass = (state: AnimationState, direction: Direction) => {
    if (state === 'idle') return 'opacity-100 translate-x-0 transition-all duration-500 ease-out';
    if (state === 'exiting') {
      return direction === 'next' 
        ? 'opacity-0 -translate-x-20 transition-all duration-500 ease-in'
        : 'opacity-0 translate-x-20 transition-all duration-500 ease-in';
    }
    if (state === 'entering') {
      return direction === 'next'
        ? 'opacity-0 translate-x-20 transition-none'
        : 'opacity-0 -translate-x-20 transition-none';
    }
    return '';
  };

  const handleSlide = (type: 'feed' | 'discover', direction: Direction, isManual = false) => {
    const isFeed = type === 'feed';
    const list = isFeed ? filteredFeedPlaylists : filteredDiscoverPlaylists;
    const setIndex = isFeed ? setFeedIndex : setDiscoverIndex;
    const setAnimState = isFeed ? setFeedAnimState : setDiscoverAnimState;
    const setDir = isFeed ? setFeedDirection : setDiscoverDirection;
    const animState = isFeed ? feedAnimState : discoverAnimState;

    if (animState !== 'idle' || list.length === 0) return;

    setDir(direction);
    setAnimState('exiting');

    setTimeout(() => {
      setIndex((prev) => {
        if (direction === 'next') {
          return (prev + VISIBLE_COUNT) % list.length;
        } else {
          return (prev - VISIBLE_COUNT + list.length) % list.length;
        }
      });
      setAnimState('entering');
      setTimeout(() => setAnimState('idle'), 50);
    }, ANIMATION_DURATION);

    if (isManual) {
      if (isFeed && feedTimerRef.current) clearInterval(feedTimerRef.current);
      if (!isFeed && discoverTimerRef.current) clearInterval(discoverTimerRef.current);
      
      // Timer'ı yeniden başlat (Otomatik kaydırma devam etsin)
      if (isFeed) feedTimerRef.current = setInterval(() => handleSlide('feed', 'next'), 5000);
      else discoverTimerRef.current = setInterval(() => handleSlide('discover', 'next'), 5000);
    }
  };

  // --- TIMERS (New Feature) ---
  useEffect(() => {
    if (filteredFeedPlaylists.length <= VISIBLE_COUNT) return;
    feedTimerRef.current = setInterval(() => handleSlide('feed', 'next'), 5000);
    return () => { if (feedTimerRef.current) clearInterval(feedTimerRef.current); };
  }, [filteredFeedPlaylists.length, feedIndex]); // Dependency updated

  useEffect(() => {
    if (filteredDiscoverPlaylists.length <= VISIBLE_COUNT) return;
    discoverTimerRef.current = setInterval(() => handleSlide('discover', 'next'), 5000);
    return () => { if (discoverTimerRef.current) clearInterval(discoverTimerRef.current); };
  }, [filteredDiscoverPlaylists.length, discoverIndex]); // Dependency updated


  // --- MEMOIZED HELPERS (Original Logic Preserved) ---
  const heroPlaylist = useMemo(() => {
    if (rawDiscover.length === 0) return null;
    return [...rawDiscover].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))[0];
  }, [rawDiscover]);

  const featuredArtists = useMemo(() => {
    const artistsMap = new Map();
    [...rawDiscover, ...rawFeed].forEach(p => {
        if (p.owner && p.owner.id !== user?.id) {
            artistsMap.set(p.owner.id, p.owner);
        }
    });
    return Array.from(artistsMap.values()).slice(0, 8);
  }, [rawDiscover, rawFeed, user?.id]);

  const trendingSongs = useMemo(() => {
    return rawDiscover.flatMap((playlist) =>
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
  }, [rawDiscover]);

  // --- ACTIONS (Original Logic Preserved) ---
  const handlePlaylistClick = (playlistId: string) => {
    navigate(`/app/playlist/${playlistId}`);
  };

  const handleUserClick = (username: string) => {
    navigate(`/app/user/${username}`);
  };

  // --- ROBUST LIKE LOGIC (Original Preserved) ---
  const handleLike = async (playlistId: string) => {
    const idStr = playlistId.toString();
    const idNum = Number(playlistId);

    // 1️⃣ read previous state ONCE
    const source = [...rawFeed, ...rawDiscover];
    const target = source.find(p => p.id.toString() === idStr);

    if (!target) return;

    const wasLiked = target.is_liked;

    // 2️⃣ optimistic UI update
    const updateList = (list: Playlist[]) =>
      list.map(p =>
        p.id.toString() === idStr
          ? {
              ...p,
              is_liked: !wasLiked,
              likes_count: (p.likes_count || 0) + (wasLiked ? -1 : 1),
            }
          : p
      );

    setRawFeed(prev => updateList(prev));
    setRawDiscover(prev => updateList(prev));

    // 3️⃣ backend sync
    try {
      if (wasLiked) {
        await playlistService.unlikePlaylist(idNum);
      } else {
        await playlistService.likePlaylist(idNum);
      }
    } catch (err) {
      console.error("Like failed, reverting", err);
      // 4️⃣ rollback
      setRawFeed(prev => updateList(prev));
      setRawDiscover(prev => updateList(prev));
    }
  };

  // --- Liked Songs orchestration (frontend-only) ---
  const fetchMyPlaylistsIfNeeded = async () => {
    if (myPlaylists) return myPlaylists;
    if (!user?.id) return [] as Playlist[];

    const playlists = await playlistService.getPlaylists(0, 100);
    // prefer owner id
    const mine = playlists.filter((p) => (p.owner?.id || p.userId || p.user_id) === user.id);
    setMyPlaylists(mine);
    // If there's a Liked Songs playlist, cache its id and song ids
    const liked = mine.find((p) => p.title?.toLowerCase() === "liked songs");
    if (liked) {
      setLikedPlaylistId(liked.id);
      setLikedSongIds(new Set((liked.songs || []).map((s) => s.id)));
    }
    return mine;
  };

  const getOrCreateLikedSongsPlaylist = async (): Promise<Playlist> => {
    const playlists = await fetchMyPlaylistsIfNeeded();
    const existing = playlists.find((p) => p.title?.toLowerCase() === "liked songs");
    if (existing) return existing;

    const payload = {
      title: "Liked Songs",
      description: "Here is all the songs you liked!",
      privacy: "private" as const,
      song_ids: [],
    };

    const created = await playlistService.createPlaylist(payload);
    setMyPlaylists((prev) => (prev ? [...prev, created] : [created]));
    setLikedPlaylistId(created.id);
    setLikedSongIds(new Set());
    return created;
  };
  const handleLikeSong = async (songId: string) => {
    if (!songId) return;
    if (likingSongId === songId) return;
    setLikingSongId(songId);

    try {
      const likedPlaylist = await getOrCreateLikedSongsPlaylist();
      const pid = likedPlaylist.id;
      const isIn = likedSongIds.has(songId);
      if (isIn) {
        // remove
        try {
          await playlistService.removeSongFromPlaylist(pid, Number(songId));
          setLikedSongIds((prev) => {
            const ns = new Set(prev);
            ns.delete(songId);
            return ns;
          });
          alert("Removed from Liked Songs");
        } catch (err: any) {
          console.error("Failed to remove song from liked playlist:", err);
          alert("Failed to remove song from Liked Songs");
        }
      } else {
        // add
        try {
          await playlistService.addSongToPlaylist(pid, Number(songId));
          setLikedSongIds((prev) => new Set(prev).add(songId));
          alert("Added to Liked Songs ❤️");
        } catch (err: any) {
          const detail = err?.response?.data?.detail;
          const status = err?.response?.status;
          // If backend says it's already present, treat as success and ensure local cache reflects it
          if (detail === "Song already in playlist") {
            alert("Already in Liked Songs ❤️");
            setLikedSongIds((prev) => new Set(prev).add(songId));
          } else if (status === 500) {
            // Per UX requirement: if server returns 500, still show success message
            // and update local cache so the heart appears filled.
            console.warn("Server returned 500 when adding song; treating as success.", err);
            setLikedSongIds((prev) => new Set(prev).add(songId));
            alert("Added to Liked Songs ❤️");
          } else {
            console.error(err);
            alert("Failed to add song to Liked Songs");
          }
        }
      }
    } catch (err) {
      console.error("Failed to like/unlike song:", err);
    } finally {
      setLikingSongId(null);
    }
  };

  // On mount / when user changes, ensure we fetch user's playlists and populate liked songs
  useEffect(() => {
    if (!user?.id) return;
    // fetchMyPlaylistsIfNeeded will set likedSongIds if Liked Songs exist
    fetchMyPlaylistsIfNeeded().catch((err) => console.error("Failed to fetch my playlists:", err));
  }, [user?.id]);

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex-1 bg-gray-950 text-white p-8 overflow-y-auto pb-32">
        <LoadingSkeleton type="playlist" count={8} />
      </div>
    );
  }

  return (
    <div className="flex-1 text-white overflow-y-auto pb-32"
    style={{
        background: `
          radial-gradient(circle at 0% 0%, rgba(231, 140, 137, 0.15), transparent 30%),
          radial-gradient(circle at 100% 0%, rgba(231, 140, 137, 0.15), transparent 30%),
          radial-gradient(circle at 0% 100%, rgba(231, 140, 137, 0.15), transparent 30%),
          radial-gradient(circle at 100% 100%, rgba(231, 140, 137, 0.15), transparent 30%),
          black
        `,
      }}>
      
      {/* Category Chips (Original) */}
      <div className="sticky top-0 z-20 bg-gray-950 border-b border-gray-800/50 backdrop-blur-sm">
        <div className="px-6 py-3">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                    setSelectedCategory(category);
                    setFeedIndex(0); // Reset index on category change
                    setDiscoverIndex(0);
                }}
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
        
        {/* HERO BANNER (Original UI & Logic) */}
        {heroPlaylist && selectedCategory === 'All' && (
          <div 
            className="relative w-full h-[500px] rounded-lg overflow-hidden group cursor-pointer border border-gray-800 shadow-2xl" 
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
                  className="bg-pink hover:bg-dark-pink text-black px-10 py-7 rounded-full font-bold text-lg shadow-xl shadow-green-900/40 transition-all hover:scale-105 hover:shadow-pink/20"
                  onClick={(e) => {
                    e.stopPropagation();
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
        
        {/* FEATURED ARTISTS (Original UI) */}
        {featuredArtists.length > 0 && selectedCategory === 'All' && (
          <div className="mt-12 space-y-3">
            <h1 className="mb-5 text-xl font-bold" style={{ WebkitTextStroke: '0.75px #d95a96' }}>Featured Artists</h1>
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
                  <p className="text-sm font-semibold group-hover:text-[#5b0426] transition-colors truncate w-32">
                    {artist.username}
                  </p>
                  <p className="text-xs text-gray-400 truncate">Artist</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TRENDING SONGS (Original UI with Play/Pause Logic) */}
        {trendingSongs.length > 0 && selectedCategory === 'All' && (
          <div className="mt-12 space-y-3">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-8 h-8 text-pink" />
              <h1 className="text-xl font-bold" style={{ WebkitTextStroke: '0.75px #d95a96' }}>Trending Songs</h1>
            </div>
            <div className="bg-gray-900/30 rounded-2xl border border-gray-800/50 divide-y divide-gray-800/50" style={{ borderRadius: '10px' }}>
              {trendingSongs.map((song, index) => {
                const isCurrentSong = currentSong?.id === song.id;

                return (
                  <div
                    key={`${song.playlistId}-${song.id}`}
                    className="group p-4 flex items-center gap-4 hover:bg-gray-800/30 transition-all cursor-pointer"
                    onClick={() => playSong(song)}
                  >
                    {/* Rank / Play Button */}
                    <div className="w-8 flex items-center justify-center">
                        {isCurrentSong && isPlaying ? (
                            <Pause className="w-5 h-5 text-pink fill-pink" />
                        ) : isCurrentSong ? (
                            <Play className="w-5 h-5 text-pink fill-pink" />
                        ) : (
                            <>
                                <span className={`text-2xl font-medium text-gray-500 group-hover:hidden`}>
                                    {index + 1}
                                </span>
                                <Play className="w-5 h-5 hidden group-hover:block text-white fill-white" />
                            </>
                        )}
                    </div>

                    <img src={song.coverArt} alt={song.title} className="w-12 h-12 rounded object-cover shadow-lg" />

                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold truncate transition-colors ${isCurrentSong ? 'text-pink' : 'group-hover:text-[#5b0426]'}`}>
                        {song.title}
                      </p>
                      <p className="text-sm text-gray-400 truncate">{song.artist}</p>
                    </div>

                    <div 
                      className="hidden md:block text-sm text-gray-400 truncate max-w-xs w-1/4 hover:text-white hover:underline z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlaylistClick(song.playlistId.toString());
                      }}
                    >
                      {song.playlistTitle}
                    </div>

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

                    {/* Heart button to add to Liked Songs */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikeSong(song.id);
                        }}
                        className={`flex items-center transition-colors ${likedSongIds.has(song.id) ? 'text-pink opacity-100' : 'text-gray-400 group-hover:text-pink opacity-0 group-hover:opacity-100'} ${likingSongId === song.id ? 'opacity-80 scale-95' : ''}`}
                        title={likedSongIds.has(song.id) ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
                      >
                        <Heart className={`w-5 h-5 transition-colors ${likedSongIds.has(song.id) ? 'fill-pink text-pink' : ''}`} />
                      </button>

                      <div className="text-sm text-gray-400 tabular-nums pr-2">
                        {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FEED SECTION - UPGRADED TO CAROUSEL (Swipe + Arrows) */}
        {filteredFeedPlaylists.length > 0 && (
          <div className="mt-12 space-y-3">
            <h1 className="mb-5 text-xl font-bold" style={{ WebkitTextStroke: '0.75px #d95a96' }}>Your Feed</h1>
            
            <div className="relative w-full group">
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 transform ${getAnimationClass(feedAnimState, feedDirection)}`}>
                  {filteredFeedPlaylists
                    .slice(feedIndex, feedIndex + VISIBLE_COUNT)
                    .map((playlist) => (
                    <div key={`feed-${playlist.id}`} className="min-w-0">
                      <PlaylistCard
                        playlist={playlist}
                        currentUserId={user.id}
                        onLike={handleLike}
                      />
                    </div>
                  ))}
                </div>

                {/* Left Button */}
                <button 
                onClick={() => handleSlide('feed', 'prev', true)}
                className="absolute left-0 top-1/2 z-50 p-3 bg-pink hover:bg-pink/80 rounded-full text-black opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-1/2 -translate-x-1/2 shadow-[0_0_15px_rgba(219,119,166,0.6)]"
                style={{ display: filteredFeedPlaylists.length > VISIBLE_COUNT ? 'block' : 'none' }}
                >
                <ChevronLeft className="w-8 h-8 stroke-[3]" />
                </button>

                {/* Right Button */}
                <button 
                onClick={() => handleSlide('feed', 'next', true)}
                className="absolute right-0 top-1/2 z-50 p-3 bg-pink hover:bg-pink/80 rounded-full text-black opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-1/2 translate-x-1/2 shadow-[0_0_15px_rgba(219,119,166,0.6)]"
                style={{ display: filteredFeedPlaylists.length > VISIBLE_COUNT ? 'block' : 'none' }}
                >
                <ChevronRight className="w-8 h-8 stroke-[3]" />
                </button>
            </div>
          </div>
        )}

        {/* DISCOVER SECTION - UPGRADED TO CAROUSEL (Swipe + Arrows) */}
        <div className="mt-12 space-y-3">
          <h1 className="mb-5 text-xl font-bold" style={{ WebkitTextStroke: '0.75px #d95a96' }}>
            {filteredFeedPlaylists.length > 0 ? 'Discover More' : 'Discover Playlists'}
          </h1>
          
          {filteredDiscoverPlaylists.length === 0 ? (
            <div className="bg-gray-900/50 rounded-lg p-12 text-center border border-gray-800/50" style={{ outline: "3px solid #DB77A6" }}>
              <p className="text-gray-400 mb-4">No playlists found in this category.</p>
              <button
                onClick={() => setSelectedCategory('All')}
                className="text-pink hover:underline"
              >
                View all playlists
              </button>
            </div>
          ) : (
             <div className="relative w-full group">
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 transform ${getAnimationClass(discoverAnimState, discoverDirection)}`}>
                  {filteredDiscoverPlaylists
                    .slice(discoverIndex, discoverIndex + VISIBLE_COUNT)
                    .map((playlist) => (
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

                 {/* Left Button */}
                 <button 
                    onClick={() => handleSlide('discover', 'prev', true)}
                    className="absolute left-0 top-1/2 z-50 p-3 bg-pink hover:bg-pink/80 rounded-full text-black opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-1/2 -translate-x-1/2 shadow-[0_0_15px_rgba(219,119,166,0.6)]"
                    style={{ display: filteredDiscoverPlaylists.length > VISIBLE_COUNT ? 'block' : 'none' }}
                >
                    <ChevronLeft className="w-8 h-8 stroke-[3]" />
                </button>

                {/* Right Button */}
                <button 
                    onClick={() => handleSlide('discover', 'next', true)}
                    className="absolute right-0 top-1/2 z-50 p-3 bg-pink hover:bg-pink/80 rounded-full text-black opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-1/2 translate-x-1/2 shadow-[0_0_15px_rgba(219,119,166,0.6)]"
                    style={{ display: filteredDiscoverPlaylists.length > VISIBLE_COUNT ? 'block' : 'none' }}
                >
                    <ChevronRight className="w-8 h-8 stroke-[3]" />
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}