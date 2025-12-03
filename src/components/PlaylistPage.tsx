import React from 'react';
import { useState } from 'react';
import { Playlist, User, Comment, Song } from '../types';
import { Heart, Play, MessageCircle, Clock, Send, Trash2, Edit } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Separator } from './ui/separator';

interface PlaylistPageProps {
  playlist: Playlist;
  user: User;
  comments: Comment[];
  currentUserId: string;
  onLike: (playlistId: string) => void;
  onComment: (playlistId: string, text: string) => void;
  onUserClick: (userId: string) => void;
  onPlaySong: (song: Song) => void;
  onDeletePlaylist?: () => void;
  onEditPlaylist?: () => void;
}

export function PlaylistPage({
  playlist,
  user,
  comments,
  currentUserId,
  onLike,
  onComment,
  onUserClick,
  onPlaySong,
  onDeletePlaylist,
  onEditPlaylist,
}: PlaylistPageProps) {
  const [commentText, setCommentText] = useState('');
  const isLiked = playlist.likes.includes(currentUserId);
  const isOwner = playlist.userId === currentUserId;

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onComment(playlist.id, commentText);
      setCommentText('');
    }
  };

  const totalDuration = playlist.songs.reduce((acc, song) => acc + song.duration, 0);
  const formatTotalDuration = () => {
    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);
    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
  };

  return (
    <div className="flex-1 bg-gradient-to-b from-gray-900 to-black text-white overflow-y-auto pb-32">
      {/* Header */}
      <div className="bg-gradient-to-b from-green-900/40 to-transparent p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-6 items-end">
            <div className="w-64 h-64 bg-gray-800 rounded-lg shadow-2xl overflow-hidden flex-shrink-0">
              {playlist.coverArt ? (
                <img src={playlist.coverArt} alt={playlist.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-900 to-green-700">
                  <Play className="w-24 h-24 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 pb-4">
              <p className="text-sm uppercase tracking-wide mb-2">Playlist</p>
              <h1 className="mb-4">{playlist.title}</h1>
              <p className="text-gray-300 mb-4">{playlist.description}</p>
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-6 h-6 rounded-full object-cover cursor-pointer"
                  onClick={() => onUserClick(user.id)}
                />
                <button onClick={() => onUserClick(user.id)} className="hover:underline">
                  {user.username}
                </button>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400">{playlist.songs.length} songs</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400">{formatTotalDuration()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <Button
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-black rounded-full w-14 h-14 p-0"
              onClick={() => playlist.songs.length > 0 && onPlaySong(playlist.songs[0])}
            >
              <Play className="w-6 h-6 fill-black ml-0.5" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => onLike(playlist.id)}
              className="text-gray-400 hover:text-white"
            >
              <Heart className={`w-8 h-8 ${isLiked ? 'fill-green-500 text-green-500' : ''}`} />
            </Button>
            <span className="text-gray-400">{playlist.likes.length} likes</span>
            {isOwner && onEditPlaylist && (
              <Button variant="ghost" onClick={onEditPlaylist} className="text-gray-400 hover:text-white">
                <Edit className="w-5 h-5 mr-2" />
                Edit
              </Button>
            )}
            {isOwner && onDeletePlaylist && (
              <Button
                variant="ghost"
                onClick={onDeletePlaylist}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Songs List */}
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-black/20 rounded-lg">
            <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-2 text-gray-400 text-sm border-b border-gray-800">
              <div className="w-8">#</div>
              <div>Title</div>
              <div>Album</div>
              <div className="text-right">
                <Clock className="w-4 h-4 inline" />
              </div>
            </div>
            {playlist.songs.map((song, index) => (
              <div
                key={song.id}
                className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-3 hover:bg-white/5 rounded transition-colors group cursor-pointer"
                onClick={() => onPlaySong(song)}
              >
                <div className="w-8 text-gray-400 flex items-center">
                  <span className="group-hover:hidden">{index + 1}</span>
                  <Play className="w-4 h-4 hidden group-hover:block" />
                </div>
                <div className="flex items-center gap-3 min-w-0">
                  <img src={song.coverArt} alt={song.album} className="w-10 h-10 rounded object-cover" />
                  <div className="min-w-0">
                    <div className="text-white truncate">{song.title}</div>
                    <div className="text-sm text-gray-400 truncate">{song.artist}</div>
                  </div>
                </div>
                <div className="flex items-center text-gray-400 truncate">{song.album}</div>
                <div className="flex items-center justify-end text-gray-400">
                  {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                </div>
              </div>
            ))}
          </div>

          {/* Comments Section */}
          <div className="mt-12">
            <div className="flex items-center gap-2 mb-6">
              <MessageCircle className="w-6 h-6" />
              <h2>Comments ({comments.length})</h2>
            </div>

            <form onSubmit={handleSubmitComment} className="mb-8">
              <div className="flex gap-3">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="bg-gray-900 border-gray-800 text-white"
                />
                <Button type="submit" className="bg-green-500 hover:bg-green-600 text-black">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>

            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <img
                    src={comment.avatar}
                    alt={comment.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="bg-gray-900 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-white">{comment.username}</span>
                        <span className="text-gray-500 text-sm">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-300">{comment.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
