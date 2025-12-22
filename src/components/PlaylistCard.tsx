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

  const isLiked = user?.likedPlaylists?.includes(playlist.id.toString()) 
    || (currentUserId && playlist.likes?.includes(currentUserId)) 
    || false;

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

  // Tarih formatlama (Örn: 2 weeks ago gibi yapılabilir ama şimdilik standart tarih)
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="group flex flex-col gap-3 cursor-pointer" onClick={onPlaylistClick}>
      {/* --- THUMBNAIL KISMI --- */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 border border-gray-800/50">
        {playlist.coverArt ? (
          <img
            src={playlist.coverArt}
            alt={playlist.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <Music2 className="w-12 h-12 text-gray-600" />
          </div>
        )}

        {/* Hover Overlay & Play Button (ORTADA) */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
           <div className="opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300">
              <div className="bg-black/60 backdrop-blur-sm rounded-full p-4 border border-white/10">
                 <Play className="w-8 h-8 text-white fill-white ml-1" />
              </div>
           </div>
        </div>

        {/* Song Count Badge (SAĞ ALT - Çakışmayı önlemek için Play butonu ortaya alındı) */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
          {playlist.songs?.length || 0} songs
        </div>
      </div>

      {/* --- INFO KISMI (YouTube Style) --- */}
      <div className="flex gap-3 items-start pr-4">
        {/* Avatar */}
        <div 
          onClick={onUserClick}
          className="flex-shrink-0 mt-0.5"
        >
          <img
            src={playlist.owner?.avatar_url || "https://github.com/shadcn.png"}
            alt={playlist.owner?.username}
            className="w-9 h-9 rounded-full object-cover hover:opacity-80 transition-opacity"
          />
        </div>

        {/* Metinler */}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          {/* Başlık */}
          <h3 className="text-white font-semibold text-base line-clamp-2 leading-tight group-hover:text-green-400 transition-colors">
            {playlist.title}
          </h3>
          
          {/* Kullanıcı Adı */}
          <div 
            onClick={onUserClick}
            className="text-gray-400 text-sm hover:text-white transition-colors truncate"
          >
            {playlist.owner?.username || "Unknown"}
          </div>

          {/* Metadata (Like & Date) */}
          <div className="flex items-center text-xs text-gray-500 mt-0.5">
             <button
                onClick={onLikeClick}
                disabled={isGuestMode}
                className={`flex items-center gap-1 group/like hover:text-white transition-colors ${isLiked ? 'text-pink hover:text-green-400' : ''}`}
             >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                <span>{playlist.likes_count || 0}</span>
             </button>
             <span className="mx-1.5">•</span>
             <span>{formatDate(playlist.createdAt || playlist.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}