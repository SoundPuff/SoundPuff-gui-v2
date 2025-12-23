import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
// Global Context'i çekiyoruz
import { usePlayer } from '../contexts/PlayerContext';

export function MusicPlayer() {
  // Global state'leri alıyoruz: currentSong, isPlaying ve togglePlay fonksiyonu
  const {
    currentSong,
    isPlaying,
    togglePlay,
    playNext,
    playPrevious,
    currentTime,
    duration,
    seekTo,
    volume,      // ✅ add
    setVolume,   // ✅ add
  } = usePlayer();

  
  // Progress ve Volume şimdilik görsel kalabilir (Context'e time update eklenirse burası da bağlanır)
  const progress =
  duration > 0 ? (currentTime / duration) * 100 : 0;

  const [isLiked, setIsLiked] = useState(false);

  // Şarkı yoksa player'ı gösterme
  if (!currentSong) {
    return null;
  }

  const formatTime = (seconds: number) => {
    if (!seconds && seconds !== 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (value: number[]) => {
    if (!duration) return;

    const percent = value[0];
    const newTime = (percent / 100) * duration;
    seekTo(newTime);
  };


  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 py-3 z-50">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4">
        {/* Song Info */}
        <div className="flex items-center gap-3 min-w-[200px] flex-1">
          <img
            src={currentSong.coverArt}
            alt={currentSong.title} // album yerine title daha güvenli
            className="w-14 h-14 rounded object-cover shadow-lg"
          />
          <div className="min-w-0">
            <div className="text-white truncate font-medium">{currentSong.title}</div>
            <div className="text-gray-400 text-sm truncate">{currentSong.artist}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLiked(!isLiked)}
            className="text-gray-400 hover:text-white ml-2"
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-pink text-pink' : ''}`} />
          </Button>
        </div>

        {/* Player Controls */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={playPrevious}
              className="text-gray-400 hover:text-white"
            >
              <SkipBack className="w-5 h-5" />
            </Button>

            {/* PLAY/PAUSE BUTONU - ARTIK GLOBAL ÇALIŞIYOR */}
            <Button
              onClick={togglePlay} // <-- Context'teki fonksiyonu çağırıyoruz
              size="sm"
              className="bg-white text-black hover:bg-gray-200 rounded-full w-10 h-10 p-0 transition-transform hover:scale-105"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={playNext}
              className="text-gray-400 hover:text-white"
            >
              <SkipForward className="w-5 h-5" />
            </Button>

          </div>
          
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-gray-400 w-10 text-right">
              {formatTime(Math.floor(currentTime))}
            </span>
            <Slider
              value={[progress]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="flex-1"
            />


            <span className="text-xs text-gray-400 w-10">
              {formatTime(Math.floor(duration))}
            </span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2 min-w-[200px] flex-1 justify-end">
          <Volume2 className="w-5 h-5 text-gray-400" />
            <Slider
              value={[volume * 100]}              // convert 0-1 to 0-100
              onValueChange={(value) => setVolume(value[0] / 100)} // convert 0-100 to 0-1
              max={100}
              step={1}
              className="w-24"
            />
        </div>
      </div>
    </div>
  );
}