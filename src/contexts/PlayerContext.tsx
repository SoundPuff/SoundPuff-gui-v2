// src/contexts/PlayerContext.tsx
import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { Song } from '../types/index';

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  playSong: (song: Song) => void;
  togglePlay: () => void;
  pauseSong: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Audio nesnesi component yeniden render olsa bile sabit kalır
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // İlk yüklemede Audio objesini oluştur
  if (!audioRef.current) {
    audioRef.current = new Audio();
  }

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
    <PlayerContext.Provider value={{ currentSong, isPlaying, playSong, togglePlay, pauseSong }}>
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