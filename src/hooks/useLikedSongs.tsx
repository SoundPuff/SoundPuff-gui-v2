import { useEffect, useState, useCallback } from "react";
import { playlistService } from "../services/playlistService";
import { useAuth } from "../contexts/AuthContext";
import { Playlist } from "../types";
import { toast } from "sonner";

// Lightweight hook to manage the "Liked Songs" playlist client-side.
// Returns: likedSongIds (Set<string>), likingSongId, handleLikeSong(songId), fetchMyPlaylistsIfNeeded()
export function useLikedSongs() {
  const { user } = useAuth();
  const [myPlaylists, setMyPlaylists] = useState<Playlist[] | null>(null);
  const [likingSongId, setLikingSongId] = useState<string | null>(null);
  const [likedPlaylistId, setLikedPlaylistId] = useState<number | null>(null);
  const [likedSongIds, setLikedSongIds] = useState<Set<string>>(new Set());
  const [blinkingSongId, setBlinkingSongId] = useState<string | null>(null);

  const fetchMyPlaylistsIfNeeded = useCallback(async () => {
    if (myPlaylists) return myPlaylists;
    if (!user?.id) return [] as Playlist[];

    const playlists = await playlistService.getPlaylists(0, 100);
    const mine = playlists.filter(
      (p) => (p.owner?.id || p.userId || p.user_id) === user.id
    );
    setMyPlaylists(mine);

    const liked = mine.find((p) => p.title?.toLowerCase() === "liked songs");
    if (liked) {
      setLikedPlaylistId(liked.id);
      setLikedSongIds(new Set((liked.songs || []).map((s) => String(s.id))));
    }
    return mine;
  }, [myPlaylists, user?.id]);

  const getOrCreateLikedSongsPlaylist = useCallback(async () => {
    const playlists = await fetchMyPlaylistsIfNeeded();
    const existing = playlists.find((p) => p.title?.toLowerCase() === "liked songs");
    if (existing) return existing;

    const payload = {
      title: "Liked Songs",
      description: "Here is all the songs you liked!",
      privacy: "private" as const,
      song_ids: [],
    };

    const created = await playlistService.createPlaylist(payload);
    setMyPlaylists((prev) => (prev ? [...prev, created] : [created]));
    setLikedPlaylistId(created.id);
    setLikedSongIds(new Set());
    return created;
  }, [fetchMyPlaylistsIfNeeded]);

  const handleLikeSong = useCallback(
    async (songIdRaw: string) => {
      const songId = String(songIdRaw);
      if (!songId) return;
      if (likingSongId === songId) return;
      setLikingSongId(songId);

      try {
        const likedPlaylist = await getOrCreateLikedSongsPlaylist();
        const pid = likedPlaylist.id;
        const isIn = likedSongIds.has(songId);
        if (isIn) {
          try {
            await playlistService.removeSongFromPlaylist(pid, Number(songId));
            setLikedSongIds((prev) => {
              const ns = new Set(prev);
              ns.delete(songId);
              return ns;
            });
            toast("Removed from Liked Songs");
          } catch (err: any) {
            console.error("Failed to remove song from liked playlist:", err);
            toast.error("Failed to remove from Liked Songs");
          }
        } else {
          try {
            await playlistService.addSongToPlaylist(pid, Number(songId));
            setLikedSongIds((prev) => new Set(prev).add(songId));
            setBlinkingSongId(songId);
            toast.success("Added to liked songs ❤️");
            setTimeout(() => setBlinkingSongId(null), 600);
          } catch (err: any) {
            const detail = err?.response?.data?.detail;
            const status = err?.response?.status;
            if (detail === "Song already in playlist") {
              setBlinkingSongId(songId);
              toast.success("Already in liked songs ❤️");
              setLikedSongIds((prev) => new Set(prev).add(songId));
              setTimeout(() => setBlinkingSongId(null), 600);
            } else if (status === 500) {
              // Treat 500 as success per UX requirement
              console.warn("Server returned 500 when adding song; treating as success.", err);
              setLikedSongIds((prev) => new Set(prev).add(songId));
              setBlinkingSongId(songId);
              toast.success("Added to liked songs ❤️");
              setTimeout(() => setBlinkingSongId(null), 600);
            } else {
              console.error(err);
              toast.error("Failed to add song to Liked Songs");
            }
          }
        }
      } catch (err) {
        console.error("Failed to like/unlike song:", err);
      } finally {
        setLikingSongId(null);
      }
    },
    [getOrCreateLikedSongsPlaylist, likingSongId, likedSongIds]
  );

  // populate on mount/user change
  useEffect(() => {
    if (!user?.id) return;
    fetchMyPlaylistsIfNeeded().catch((err) => console.error("Failed to fetch my playlists:", err));
  }, [user?.id, fetchMyPlaylistsIfNeeded]);

  return {
    likedSongIds,
    likingSongId,
    blinkingSongId,
    likedPlaylistId,
    fetchMyPlaylistsIfNeeded,
    handleLikeSong,
  } as const;
}
