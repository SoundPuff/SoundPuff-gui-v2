import React from "react";
import { Heart, Play, Music2 } from "lucide-react";
import { Playlist } from "../types";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface PlaylistCardProps {
  playlist: Playlist;
  currentUserId: string | null;
  onLike: (playlistId: string) => void;
  isGuestMode?: boolean;
}

export function PlaylistCard({
  playlist,
  currentUserId,
  onLike,
  isGuestMode = false,
}: PlaylistCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isLiked = playlist.is_liked === true;

  const onUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGuestMode) return;
    const username = playlist.owner?.username || "unknown";
    navigate(`/app/user/${username}`);
  };

  const onPlaylistClick = () => {
    if (isGuestMode) return;
    navigate(`/app/playlist/${playlist.id}`);
  };

  const onLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isGuestMode) onLike(playlist.id.toString());
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div 
      className="group flex flex-col gap-3 cursor-pointer w-full bg-gray-900 rounded-lg p-3 hover:bg-gray-800 transition-colors" 
      onClick={onPlaylistClick}
      // İSTENİLEN OUTLINE STİLİ BURAYA EKLENDİ
      style={{ outline: '3px solid #33ace3' }}
    >
      
      {/* --- THUMBNAIL KISMI --- */}
      <div 
        className="relative w-full rounded-lg overflow-hidden bg-gray-950"
        style={{ aspectRatio: '16/9' }}
      >
        {playlist.coverArt ? (
          <img
            src={playlist.coverArt}
            alt={playlist.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <Music2 className="w-12 h-12 text-gray-600" />
          </div>
        )}

        {/* Hover Overlay & Play Button */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center z-10">
           <div className="opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300 shadow-xl">
              <div className="bg-black/60 backdrop-blur-md rounded-full p-3 border border-white/10 shadow-xl">
                 <Play className="w-8 h-8 text-white fill-white ml-1" />
              </div>
           </div>
        </div>

        {/* Song Count Badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md z-20 pointer-events-none">
          {playlist.songs?.length || 0} songs
        </div>
      </div>

      {/* --- INFO KISMI --- */}
      <div className="flex gap-3 items-start pr-1">
        {/* Avatar */}
        <div 
          onClick={onUserClick}
          className="flex-shrink-0 mt-0.5 z-20"
        >
          <img
            src={playlist.owner?.avatar_url || "https://github.com/shadcn.png"}
            alt={playlist.owner?.username}
            className="w-9 h-9 rounded-full object-cover hover:opacity-80 transition-opacity bg-gray-800 border border-gray-700"
          />
        </div>

        {/* Metinler */}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 mb-1 group-hover:text-[#33ace3] transition-colors" title={playlist.title}
          style={{
                WebkitTextStroke: "0.3px #DB77A6"
              }}>
            {playlist.title}
          </h3>
          
          <div 
            onClick={onUserClick}
            className="text-gray-400 text-xs hover:text-white transition-colors truncate w-fit mb-0.5"
          >
            {playlist.owner?.username || "Unknown"}
          </div>

          <div className="flex items-center text-xs text-gray-500 mt-0.5">

<button
  onClick={onLikeClick}
  disabled={isGuestMode}
  className="flex items-center gap-1.5 text-gray-400 hover:text-pink transition-colors z-20"
>
  <Heart
    className={`w-5 h-5 transition-colors ${
      isLiked ? 'fill-pink text-pink' : ''
    }`}
  />
  <span className="text-sm">
    {playlist.likes_count || 0}
  </span>
</button>



             <span className="mx-1.5">•</span>
             <span>{formatDate(playlist.createdAt || playlist.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}