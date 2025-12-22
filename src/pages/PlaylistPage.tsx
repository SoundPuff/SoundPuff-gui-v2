import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Playlist, Comment } from '../types';
import { Heart, Play, Pause, MessageCircle, Clock, Send, Trash2, Edit } from 'lucide-react'; // Pause eklendi
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { playlistService } from '../services/playlistService';
import { useAuth } from '../contexts/AuthContext';
// Global Player Context
import { usePlayer } from '../contexts/PlayerContext';

interface PlaylistUser {
  id: string;
  username: string;
  avatar: string;
  bio: string;
}

export function PlaylistPage() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  // ✅ GÜNCELLEME: Global player fonksiyonları çekildi
  const { playSong, currentSong, isPlaying } = usePlayer();
  
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [playlistUser, setPlaylistUser] = useState<PlaylistUser | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylistData = async () => {
      if (!playlistId || !currentUser?.id) return;

      setIsLoading(true);
      try {
        const playlistIdNum = parseInt(playlistId);
        const [playlistData, commentsData] = await Promise.all([
          playlistService.getPlaylist(playlistIdNum),
          playlistService.getPlaylistComments(playlistIdNum),
        ]);

        setPlaylist(playlistData);
        setComments(commentsData);

        setPlaylistUser({
          id: playlistData.owner?.id || '',
          username: playlistData.owner?.username || '',
          avatar: playlistData.owner?.avatar_url || 'https://github.com/shadcn.png',
          bio: playlistData.owner?.bio || '',
        });
      } catch (error) {
        console.error('Failed to fetch playlist details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylistData();
  }, [playlistId, currentUser?.id]);

  if (!playlist || !playlistUser || !currentUser) {
    if (isLoading) {
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
          <div className="bg-gradient-to-b from-pink to-transparent p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex gap-6 items-end">
                <div className="w-64 h-64 bg-gray-800 rounded-lg animate-pulse" />
                <div className="flex-1 pb-4 space-y-4">
                  <div className="h-4 bg-gray-800 rounded w-24 animate-pulse" />
                  <div className="h-10 bg-gray-800 rounded w-64 animate-pulse" />
                  <div className="h-4 bg-gray-800 rounded w-96 animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-4 bg-gray-800 rounded w-20 animate-pulse" />
                    <div className="h-4 bg-gray-800 rounded w-16 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              <LoadingSkeleton type="list" />
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  const isLiked = playlist.likes?.includes(currentUser.id);
  const isOwner = playlist.userId === currentUser.id;

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !playlistId || !currentUser?.id) return;

    try {
      const playlistIdNum = parseInt(playlistId);
      const newComment = await playlistService.createComment(playlistIdNum, {
        body: commentText,
        playlist_id: playlistIdNum,
      });
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  const handleLike = async () => {
    if (!playlistId || !currentUser?.id) return;

    try {
      const playlistIdNum = parseInt(playlistId);
      if (isLiked) {
        await playlistService.unlikePlaylist(playlistIdNum);
        setPlaylist((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            likes: prev.likes?.filter((id) => id !== currentUser.id),
          };
        });
      } else {
        await playlistService.likePlaylist(playlistIdNum);
        setPlaylist((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            likes: [...(prev.likes || []), currentUser.id],
          };
        });
      }
    } catch (error) {
      console.error('Failed to like/unlike playlist:', error);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!playlistId) return;
    if (confirm('Are you sure you want to delete this playlist?')) {
      try {
        const playlistIdNum = parseInt(playlistId);
        await playlistService.deletePlaylist(playlistIdNum);
        navigate('/app/library');
      } catch (error) {
        console.error('Failed to delete playlist:', error);
      }
    }
  };

  const handleEditPlaylist = () => {
    navigate(`/app/edit-playlist/${playlistId}`);
  };

  const handleUserClick = (userId: string) => {
    if (!userId) {
      navigate('/app/search');
      return;
    }
    navigate(`/app/user/${userId}`);
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
    <div className="flex-1 text-white overflow-y-auto pb-32">
      {/* Header */}
      <div className="bg-gradient-to-b from-pink to-transparent p-8">
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
                  src={playlistUser.avatar}
                  alt={playlistUser.username}
                  className="w-6 h-6 rounded-full object-cover cursor-pointer"
                  onClick={() => handleUserClick(playlistUser.id)}
                />
                <button onClick={() => handleUserClick(playlistUser.id)} className="hover:underline">
                  {playlistUser.username}
                </button>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400">{playlist.songs.length} songs</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400">{formatTotalDuration()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6">
            {/* Büyük Play Butonu */}
            <Button
              size="lg"
              className="bg-pink hover:bg-green-600 text-black rounded-full w-14 h-14 p-0 shadow-lg shadow-pink/20 transition-transform hover:scale-105"
              onClick={() => playlist.songs.length > 0 && playSong(playlist.songs[0])}
            >
              <Play className="w-6 h-6 fill-black ml-0.5" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={handleLike}
              className="text-gray-400 hover:text-white"
            >
              <Heart className={`w-8 h-8 ${isLiked ? 'fill-pink text-pink' : ''}`} />
            </Button>
            <span className="text-gray-400">{playlist.likes_count || 0} likes</span>
            {isOwner && (
              <Button variant="ghost" onClick={handleEditPlaylist} className="text-gray-400 hover:text-white">
                <Edit className="w-5 h-5 mr-2" />
                Edit
              </Button>
            )}
            {isOwner && (
              <Button
                variant="ghost"
                onClick={handleDeletePlaylist}
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
            {playlist.songs.map((song, index) => {
              // ✅ Çalan şarkı kontrolü
              const isCurrentSong = currentSong?.id === song.id;

              return (
                <div
                  key={song.id}
                  className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-3 hover:bg-white/5 rounded transition-colors group cursor-pointer"
                  onClick={() => playSong(song)} // ✅ Global playSong fonksiyonu
                >
                  <div className="w-8 text-gray-400 flex items-center justify-center">
                    {/* ✅ İkon Mantığı: Çalıyorsa Pause, değilse numara veya hover ile Play */}
                    {isCurrentSong && isPlaying ? (
                      <Pause className="w-4 h-4 text-pink fill-pink" />
                    ) : isCurrentSong ? (
                      <Play className="w-4 h-4 text-pink fill-pink" />
                    ) : (
                      <>
                        <span className="group-hover:hidden">{index + 1}</span>
                        <Play className="w-4 h-4 hidden group-hover:block text-white fill-white" />
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-3 min-w-0">
                    <img src={song.coverArt} alt={song.album} className="w-10 h-10 rounded object-cover" />
                    <div className="min-w-0">
                      {/* ✅ Çalan şarkının rengini pembe yap */}
                      <div className={`truncate ${isCurrentSong ? 'text-pink font-semibold' : 'text-white'}`}>
                        {song.title}
                      </div>
                      <div className="text-sm text-gray-400 truncate">{song.artist}</div>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-400 truncate">{song.album}</div>
                  <div className="flex items-center justify-end text-gray-400">
                    {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              );
            })}
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
                <Button type="submit" className="bg-pink hover:bg-green-600 text-black">
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