// src/contexts/PlayerContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  ReactNode
} from 'react';
import { Song } from '../types';
  
import { searchService } from '../services/searchService';

interface PlayOptions {
  queue?: Song[];
  startIndex?: number;
}

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;               // ✅ add
  setVolume: (vol: number) => void; // ✅ add
  queue: Song[];                // ✅ expose queue
  currentIndex: number;          // ✅ expose currentIndex

  playSong: (song: Song, options?: PlayOptions) => void;
  playNext: () => void;
  playPrevious: () => void;

  togglePlay: () => void;
  pauseSong: () => void;
  seekTo: (time: number) => void;
}


const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30); // preview fixed

  const [volume, setVolume] = useState(0.7); // 0-1 for audio element

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      playNext();
    };

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []); // <-- only once

  // 🔹 update audio volume when volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume; // 0-1
    }
  }, [volume]);


  // 🔹 play a song
  const playSong = (song: Song, options?: PlayOptions) => {
    if (!audioRef.current) return;
    if (!song.url || song.url === 'no') return;

    // Same song → toggle
    if (currentSong?.id === song.id) {
      togglePlay();
      return;
    }

    // Queue handling
    if (options?.queue) {
      setQueue(options.queue);
      setCurrentIndex(options.startIndex ?? 0);
    }

    audioRef.current.src = song.url;
    audioRef.current.currentTime = 0;

    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(console.error);

    setCurrentSong(song);
    setCurrentTime(0);
    setDuration(30);
  };

  // 🔹 next logic
  const playNext = async () => {
    console.log('[Player] playNext called');

    // ✅ playlist exists & has next
    if (queue.length && currentIndex + 1 < queue.length) {
      const nextIndex = currentIndex + 1;
      console.log('[Player] Playing next from playlist:', queue[nextIndex]);

      setCurrentIndex(nextIndex);
      playSong(queue[nextIndex]);
      return;
    }

    // 🚨 playlist ended OR no playlist
    console.log('[Player] Playlist finished or no queue → fetching random song');
    fetchRandomSongAndPlay();
  };


  // 🔹 previous logic
  const playPrevious = () => {
    if (!queue.length) return;

    if (currentIndex <= 0) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      return;
    }

    const prevIndex = currentIndex - 1;
    setCurrentIndex(prevIndex);
    playSong(queue[prevIndex]);
  };


  // 🔹 random fallback (with retry)

  const fetchRandomSongAndPlay = async (attempt = 0, lastSong: Song | null = null) => {
    const MAX_ATTEMPTS = 5;

    if (attempt >= MAX_ATTEMPTS) {
      if (lastSong) {
        console.warn('[Random] ⚠️ Max attempts reached. Playing last fetched song even if not playable:', lastSong);
        setQueue([]);
        setCurrentIndex(-1);

        // Bypass url check for last song
        if (audioRef.current) {
          audioRef.current.src = lastSong.url || ''; // even 'no'
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(console.error);
        }
        setCurrentSong(lastSong);
        setCurrentTime(0);
        setDuration(30);
      } else {
        console.error('[Random] ❌ Max attempts reached. No song to play.');
      }
      return;
    }

    try {
      const searchQuery = Math.floor(Math.random() * (19023 - 2 + 1) + 2).toString();
      const songs = await searchService.searchSongs(searchQuery);

      if (!songs || songs.length === 0) {
        fetchRandomSongAndPlay(attempt + 1, lastSong);
        return;
      }

      const song = songs[Math.floor(Math.random() * songs.length)];

      console.log(`[Random] 🔄 Attempt ${attempt + 1} | Fetched song:`, song);

      if (song.url && song.url !== 'no') {
        setQueue([]);
        setCurrentIndex(-1);
        playSong(song);
        return;
      }

      // Retry, keep last fetched song
      fetchRandomSongAndPlay(attempt + 1, song);

    } catch (err: any) {
      if (err.response?.status === 401) return;
      fetchRandomSongAndPlay(attempt + 1, lastSong);
    }
  };



  const togglePlay = () => {
    if (!audioRef.current || !currentSong) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const pauseSong = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const seekTo = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,         // ✅ expose
        setVolume,      // ✅ expose
        queue,          // ✅ expose queue
        currentIndex,   // ✅ expose currentIndex
        playSong,
        playNext,
        playPrevious,
        togglePlay,
        pauseSong,
        seekTo,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
