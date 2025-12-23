// src/contexts/PlayerContext.tsx
import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { Song } from '../types/index';

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playSong: (song: Song) => void;
  togglePlay: () => void;
  pauseSong: () => void;
  seekTo: (time: number) => void;
}



const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const seekTo = (time: number) => {
    if (!audioRef.current) return;

    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  
  // Audio nesnesi component yeniden render olsa bile sabit kalır
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // İlk yüklemede Audio objesini oluştur
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);


  const playSong = (song: Song) => {
    if (!audioRef.current) return;

    // Eğer aynı şarkıya tıklandıysa durdur/başlat
    if (currentSong?.id === song.id) {
      togglePlay();
      return;
    }

    // Farklı şarkıysa kaynağı değiştir ve çal
    if (song.url) {
      audioRef.current.src = song.url;
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(e => console.error("Playback error:", e));
      
      setCurrentSong(song);
      setCurrentTime(0);
      setDuration(0);

      // Şarkı bittiğinde state'i güncelle
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentSong) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .catch(e => console.error("Resume error:", e));
      setIsPlaying(true);
    }
  };

  const pauseSong = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        currentTime,
        duration,
        playSong,
        togglePlay,
        pauseSong,
        seekTo
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}