import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { useState } from 'react';
import { usePlayer } from '../contexts/PlayerContext';

export function MusicPlayer() {
  const { currentSong } = usePlayer();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isLiked, setIsLiked] = useState(false);

  if (!currentSong) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 py-3">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4">
        {/* Song Info */}
        <div className="flex items-center gap-3 min-w-[200px] flex-1">
          <img
            src={currentSong.coverArt}
            alt={currentSong.album}
            className="w-14 h-14 rounded object-cover"
          />
          <div className="min-w-0">
            <div className="text-white truncate">{currentSong.title}</div>
            <div className="text-gray-400 text-sm truncate">{currentSong.artist}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLiked(!isLiked)}
            className="text-gray-400 hover:text-white"
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-green-500 text-green-500' : ''}`} />
          </Button>
        </div>

        {/* Player Controls */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <SkipBack className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => setIsPlaying(!isPlaying)}
              size="sm"
              className="bg-white text-black hover:bg-gray-200 rounded-full w-10 h-10 p-0"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-gray-400 w-10 text-right">
              {formatTime(Math.floor((progress / 100) * currentSong.duration))}
            </span>
            <Slider
              value={[progress]}
              onValueChange={(value) => setProgress(value[0])}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-gray-400 w-10">
              {formatTime(currentSong.duration)}
            </span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2 min-w-[200px] flex-1 justify-end">
          <Volume2 className="w-5 h-5 text-gray-400" />
          <Slider
            value={[volume]}
            onValueChange={(value) => setVolume(value[0])}
            max={100}
            step={1}
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
}
