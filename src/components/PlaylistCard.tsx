import React from "react";
import { Heart, Play, Music2 } from "lucide-react";
import { Playlist, User } from "../types";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

interface PlaylistCardProps {
  playlist: Playlist;
  user: User;
  currentUserId: string | null;
  onLike: (playlistId: string) => void;
  isGuestMode?: boolean;
}

export function PlaylistCard({
  playlist,
  user,
  currentUserId,
  onLike,
  isGuestMode = false,
}: PlaylistCardProps) {
  const navigate = useNavigate();
  const isLiked = currentUserId
    ? playlist.likes?.includes(currentUserId)
    : false;

  const onUserClick = () => {
    if (!playlist.owner?.username) {
      navigate("/app/search");
      return;
    }
    navigate(`/app/user/${playlist.owner?.username}`);
  };
  const onPlaylistClick = (playlistId: string) => {
    navigate(`/app/playlist/${playlistId}`);
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors group">
      <div className="relative mb-4">
        <div className="aspect-square rounded-lg overflow-hidden bg-gray-800">
          {playlist.coverArt ? (
            <img
              src={playlist.coverArt}
              alt={playlist.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music2 className="w-16 h-16 text-gray-600" />
            </div>
          )}
        </div>
        <Button
          size="icon"
          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-green-500 hover:bg-green-600 rounded-full w-12 h-12 shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            onPlaylistClick(playlist.id.toString());
          }}
        >
          <Play className="w-5 h-5 text-black fill-black ml-0.5" />
        </Button>
      </div>

      <div
        onClick={() => onPlaylistClick(playlist.id.toString())}
        className="cursor-pointer"
      >
        <h3 className="text-white mb-1 truncate">{playlist.title}</h3>
        <p className="text-gray-400 text-sm line-clamp-2 mb-2">
          {playlist.description}
        </p>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUserClick();
          }}
          className="flex items-center gap-2 hover:underline"
        >
          <img
            src={playlist.owner?.avatar_url || "https://github.com/shadcn.png"}
            alt={playlist.owner?.username || "User"}
            className="w-6 h-6 rounded-full object-cover"
          />
          <span className="text-sm text-gray-400">
            {playlist.owner?.username || "User"}
          </span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isGuestMode) onLike(playlist.id.toString());
          }}
          disabled={isGuestMode}
          className={`flex items-center gap-1 text-gray-400 hover:text-white transition-colors ${
            isGuestMode ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <Heart
            className={`w-5 h-5 ${
              isLiked ? "fill-green-500 text-green-500" : ""
            }`}
          />
          <span className="text-sm">{playlist.likes_count || 0}</span>
        </button>
      </div>
    </div>
  );
}
