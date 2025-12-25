import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Playlist, Comment } from '../types';
import { Heart, Play, Pause, MessageCircle, Clock, Send, Trash2, Edit, MoreHorizontal, AlertTriangle, X } from 'lucide-react';
import { useLikedSongs } from "../hooks/useLikedSongs";
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { playlistService } from '../services/playlistService';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import { AddToPlaylistModal } from "../components/AddToPlaylistModal";
import { toast } from "sonner";
import { createPortal } from "react-dom";
import { Lock, Unlock } from "lucide-react";

interface PlaylistUser {
  id: string;
  username: string;
  avatar: string;
  bio: string;
}

export function PlaylistPage() {
  const [alertModal, setAlertModal] = useState<{ title?: string; message: string } | null>(null);

  const showAlert = (message: string, title?: string) => {
    setAlertModal({ title, message });
  };

  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { playSong, currentSong, isPlaying } = usePlayer();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [playlistUser, setPlaylistUser] = useState<PlaylistUser | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Reusable Modal State
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [openSongMenuId, setOpenSongMenuId] = useState<string | null>(null);
  const [showAddToPlaylistForSong, setShowAddToPlaylistForSong] = useState<number | null>(null);

  const { likedSongIds, likingSongId, blinkingSongId, handleLikeSong } = useLikedSongs();

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

  useEffect(() => {
    const handleClickOutside = () => setOpenSongMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (!playlist || !playlistUser || !currentUser) {
    if (isLoading) return (
      <div className="flex-1 text-white overflow-y-auto pb-32" style={{ background: `radial-gradient(circle at 0% 0%, rgba(231, 140, 137, 0.15), transparent 30%), radial-gradient(circle at 100% 0%, rgba(231, 140, 137, 0.15), transparent 30%), radial-gradient(circle at 0% 100%, rgba(231, 140, 137, 0.15), transparent 30%), radial-gradient(circle at 100% 100%, rgba(231, 140, 137, 0.15), transparent 30%), black` }}>
        <div className="bg-gradient-to-b from-pink to-transparent p-8">
          <div className="max-w-7xl mx-auto"><div className="flex gap-6 items-end"><div className="w-64 h-64 bg-gray-800 rounded-lg animate-pulse" /><div className="flex-1 pb-4 space-y-4"><div className="h-4 bg-gray-800 rounded w-24 animate-pulse" /><div className="h-10 bg-gray-800 rounded w-64 animate-pulse" /><div className="h-4 bg-gray-800 rounded w-96 animate-pulse" /><div className="flex gap-2"><div className="h-4 bg-gray-800 rounded w-20 animate-pulse" /><div className="h-4 bg-gray-800 rounded w-16 animate-pulse" /></div></div></div></div></div>
        <div className="p-8"><div className="max-w-7xl mx-auto"><LoadingSkeleton type="list" /></div></div>
      </div>
    );
    return null;
  }

  const isLiked = playlist.is_liked;
  const isOwner = playlist.userId === currentUser.id;

  const togglePrivacy = async () => {
    if (!playlist) return;
    const newPrivacy = playlist.privacy === "public" ? "private" : "public";
    setPlaylist(prev => prev ? { ...prev, privacy: newPrivacy } : prev);
    try {
      await playlistService.updatePlaylist(playlist.id, { privacy: newPrivacy });
    } catch (err) {
      console.error("Privacy update failed", err);
    }
  };

  const handleLike = async () => {
    if (!playlistId || !currentUser || !playlist) return;
    const playlistIdNum = Number(playlistId);
    const currentlyLiked = playlist.is_liked;
    setPlaylist((prev) => prev ? { ...prev, is_liked: !currentlyLiked, likes_count: currentlyLiked ? Math.max(0, prev.likes_count - 1) : prev.likes_count + 1 } : prev);
    try {
      if (currentlyLiked) await playlistService.unlikePlaylist(playlistIdNum);
      else await playlistService.likePlaylist(playlistIdNum);
    } catch (error) {
      console.error('Failed to like/unlike playlist:', error);
      setPlaylist((prev) => prev ? { ...prev, is_liked: currentlyLiked, likes_count: prev.likes_count } : prev);
    }
  };

  // OPEN MODAL FOR PLAYLIST
  const handleDeletePlaylist = () => {
    setModalConfig({
      title: "Delete Playlist",
      message: "This will permanently delete your playlist and remove all associated content.",
      onConfirm: async () => {
        const playlistIdNum = parseInt(playlistId!);
        await playlistService.deletePlaylist(playlistIdNum);
        navigate('/app/library');
      }
    });
    setShowConfirm(true);
  };

  // OPEN MODAL FOR COMMENT
  const handleDeleteComment = (commentId: number) => {
    setOpenMenuId(null);
    setModalConfig({
      title: "Delete Comment",
      message: "This will permanently delete this comment.",
      onConfirm: async () => {
        await playlistService.deleteComment(commentId);
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    });
    setShowConfirm(true);
  };

  const handleConfirmAction = async () => {
    if (!modalConfig) return;
    setIsDeleting(true);
    try {
      await modalConfig.onConfirm();
      setShowConfirm(false);
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditPlaylist = () => navigate(`/app/edit-playlist/${playlistId}`);
  const handleUserClick = (userId: string) => navigate(userId ? `/app/user/${userId}` : '/app/search');

  const handleLikeComment = async (commentId: number) => {
    if (!currentUser) return;
    setComments((prev) => prev.map((c) => c.id === commentId ? { ...c, is_liked: !c.is_liked, likes_count: c.is_liked ? (c.likes_count || 0) - 1 : (c.likes_count || 0) + 1 } : c));
    try {
      const comment = comments.find((c) => c.id === commentId);
      if (comment?.is_liked) await playlistService.unlikeComment(commentId);
      else await playlistService.likeComment(commentId);
    } catch (error) {
      console.error("Failed to like/unlike comment:", error);
    }
  };

  const toggleMenu = (commentId: number) => setOpenMenuId((prev) => (prev === commentId ? null : commentId));
  const startEditComment = (comment: Comment) => { setEditingCommentId(comment.id); setEditingText(comment.text); setOpenMenuId(null); };
  const cancelEdit = () => setEditingCommentId(null);

  const saveEditedComment = async (commentId: number) => {
    if (!editingText.trim()) return;
    try {
      const updated = await playlistService.updateComment(commentId, { body: editingText });
      setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, ...updated } : c)));
      setEditingCommentId(null);
    } catch (err) {
      console.error('Failed to update comment:', err);
    }
  };

  const handleReplyClick = (parentCommentId: number) => { setReplyingToId((prev) => (prev === parentCommentId ? null : parentCommentId)); setReplyText(''); };
  const handleSendReply = async (parentCommentId: number) => {
    if (!replyText.trim() || !playlistId) return;
    try {
      const newComment = await playlistService.createComment(Number(playlistId), { body: replyText, playlist_id: Number(playlistId), parent_comment_id: parentCommentId } as any);
      setComments(prev => [...prev, newComment]);
      setReplyText('');
      setReplyingToId(null);
    } catch (err) {
      console.error('Failed to create reply:', err);
    }
  };

  const formatTotalDuration = () => {
    const totalDuration = playlist.songs.reduce((acc, song) => (song.url && song.url !== "no") ? acc + 30 : acc, 0);
    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);
    return hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`;
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !playlistId || !currentUser?.id) return;
    try {
      const newComment = await playlistService.createComment(parseInt(playlistId), { body: commentText, playlist_id: parseInt(playlistId) } as any);
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
    } catch (error) { console.error('Failed to create comment:', error); }
  };

return (
  <div
    className="flex-1 text-white overflow-y-auto pb-32"
    style={{
      background: `radial-gradient(circle at 0% 0%, rgba(231, 140, 137, 0.15), transparent 30%),
                   radial-gradient(circle at 100% 0%, rgba(231, 140, 137, 0.15), transparent 30%),
                   radial-gradient(circle at 0% 100%, rgba(231, 140, 137, 0.15), transparent 30%),
                   radial-gradient(circle at 100% 100%, rgba(231, 140, 137, 0.15), transparent 30%),
                   black`,
    }}
  >
    
    <div className="bg-gradient-to-b from-pink to-transparent p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-6 items-end">
          <div className="w-64 h-64 bg-gray-800 rounded-lg shadow-2xl overflow-hidden flex-shrink-0">
            {playlist.coverArt ? (
              <img
                src={playlist.coverArt}
                alt={playlist.title}
                className="w-full h-full object-cover"
              />
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
              <button
                onClick={() => handleUserClick(playlistUser.username)}
                className="hover:underline"
              >
                {playlistUser.username}
              </button>
              <span className="text-gray-400">
                • {playlist.songs.length} songs • {formatTotalDuration()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-6">
          <Button
            size="lg"
            className="bg-pink hover:bg-dark-pink text-black rounded-full w-14 h-14 p-0 shadow-lg shadow-pink/20 transition-transform hover:scale-105"
            onClick={() =>
              playlist.songs.length > 0 &&
              playSong(playlist.songs[0], { queue: playlist.songs, startIndex: 0 })
            }
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
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={handleEditPlaylist}
                className="text-gray-400 hover:text-white"
              >
                <Edit className="w-5 h-5 mr-2" />Edit
              </Button>
              <Button
                variant="ghost"
                onClick={togglePrivacy}
                className="text-gray-400 hover:text-white"
              >
                {playlist.privacy === 'public' ? (
                  <Unlock className="w-5 h-5" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={handleDeletePlaylist}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-5 h-5 mr-2" />Delete
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>

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
            const isCurrentSong = currentSong?.id === song.id;

            return (
              <div
                key={song.id}
                className="relative grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-3 hover:bg-white/5 rounded transition-colors group cursor-pointer"
                onClick={() =>
                  playSong(song, { queue: playlist.songs, startIndex: index })
                }
              >
                <div className="w-8 text-gray-400 flex items-center justify-center">
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
                  <img
                    src={song.coverArt}
                    alt={song.album}
                    className="w-10 h-10 rounded object-cover"
                  />
                  <div className="min-w-0">
                    <div
                      className={`truncate ${
                        isCurrentSong ? 'text-pink font-semibold' : 'text-white'
                      }`}
                    >
                      {song.title}
                    </div>
                    <div className="text-sm text-gray-400 truncate">{song.artist}</div>
                  </div>
                </div>

                <div className="flex items-center text-gray-400 truncate">{song.album}</div>

                <div
                  className="flex items-center justify-end gap-3 text-gray-400 relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLikeSong(String(song.id));
                    }}
                    className={`flex items-center transition-colors ${
                      likedSongIds.has(String(song.id))
                        ? 'text-pink opacity-100'
                        : 'text-gray-400 group-hover:text-pink opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors ${
                        likedSongIds.has(String(song.id)) ? 'fill-pink text-pink' : ''
                      } ${blinkingSongId === String(song.id) ? 'heart-blink' : ''}`}
                    />
                  </button>
                  <span className="mr-2">
                    {song.url && song.url !== 'no' ? '0:30' : '--:--'}
                  </span>

                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenSongMenuId((prev) => (prev === song.id ? null : song.id));
                      }}
                      className="p-1 hover:text-white"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {openSongMenuId === song.id && (
                  <div
                    className="absolute right-0 top-7 w-48 bg-gray-800 rounded-md shadow-lg z-[9999] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isOwner && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await playlistService.removeSongFromPlaylist(
                              Number(playlistId),
                              Number(song.id)
                            );
                            setPlaylist((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    songs: prev.songs.filter((s) => s.id !== song.id),
                                  }
                                : prev
                            );
                          } catch (err) {
                            console.error(err);
                          } finally {
                            setOpenSongMenuId(null);
                          }
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700"
                      >
                        Remove from playlist
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenSongMenuId(null);
                        setShowAddToPlaylistForSong(Number(song.id));
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700"
                    >
                      Add to another playlist
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {showAddToPlaylistForSong !== null &&
            createPortal(
              <div
                className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center"
                style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
                onClick={() => setShowAddToPlaylistForSong(null)}
              >
                <div onClick={(e) => e.stopPropagation()}>
                  <AddToPlaylistModal
                    onSelect={async (targetId) => {
                      try {
                        await playlistService.addSongToPlaylist(
                          targetId,
                          showAddToPlaylistForSong!
                        );
                        // alert('Added!');
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setShowAddToPlaylistForSong(null);
                      }
                    }}
                    onClose={() => setShowAddToPlaylistForSong(null)}
                  />
                </div>
              </div>,
              document.body
            )}
        </div>

        {/* Comments Section */}
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="w-6 h-6 text-pink" />
            <h2 style={{ WebkitTextStroke: '0.5px #d95a96' }}>
              Comments ({comments.length})
            </h2>
          </div>

          <form onSubmit={handleSubmitComment} className="mb-8">
            <div className="flex gap-3">
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="bg-gray-900 border-gray-800 text-white"
                style={{ outline: '1px solid #DB77A6' }}
              />
              <Button type="submit" className="bg-pink hover:bg-dark-pink text-black">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>

          <div className="space-y-4">
            {(() => {
              const topLevelComments = comments.filter((c) => !c.parentCommentId);
              const repliesMap: Record<number, Comment[]> = {};

              comments.forEach((c) => {
                if (c.parentCommentId) {
                  if (!repliesMap[c.parentCommentId]) repliesMap[c.parentCommentId] = [];
                  repliesMap[c.parentCommentId].push(c);
                }
              });

              const flattenReplies = (id: number): Comment[] => {
                const result: Comment[] = [];
                const queue = repliesMap[id] ? [...repliesMap[id]] : [];
                while (queue.length) {
                  const r = queue.shift()!;
                  result.push(r);
                  if (repliesMap[r.id]) queue.unshift(...repliesMap[r.id]);
                }
                return result;
              };

              const renderComment = (c: Comment) => (
                <div key={c.id} className="flex gap-3">
                  {/* ...Comment and Replies JSX... */}
                </div>
              );

              return topLevelComments.map((c) => renderComment(c));
            })()}
          </div>
        </div>
      </div>
    </div>

    {/* Confirm Modal */}
    {showConfirm &&
      createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(4px)',
            padding: '16px',
          }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: '#111827',
              border: '1px solid #1f2937',
              borderRadius: '12px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
              maxHeight: '90vh',
              overflowY: 'auto',
              outline: '2px solid #DB77A6',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                borderBottom: '1px solid #1f2937',
                backgroundColor: 'rgba(17,24,39,0.6)',
              }}
            >
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                {modalConfig?.title}
              </h3>
              <button
                onClick={() => setShowConfirm(false)}
                className="p-1 rounded-full hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-white" />
              </button>
            </div>

            <div style={{ padding: '16px' }}>
              <p className="text-gray-300 text-sm leading-relaxed">
                {modalConfig?.message}
                <br />
                <br />
                <span className="font-semibold text-red-400">
                  Are you absolutely sure?
                </span>
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                padding: '12px',
                borderTop: '1px solid #1f2937',
                backgroundColor: 'rgba(17,24,39,0.6)',
              }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirm(false)}
                className="border-gray-700 hover:bg-gray-800 text-white h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmAction}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white border-none h-8 text-xs"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
  </div>
);

}