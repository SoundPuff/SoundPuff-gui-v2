import api from "./api";
import {
  Playlist,
  Song,
  Comment,
  BackendPlaylistFull,
  BackendComment,
  BackendSong,
  PlaylistCreateRequest,
  PlaylistUpdateRequest,
  CommentCreateRequest,
  CommentUpdateRequest,
  BackendLike,
} from "../types/index";

// Helper function to map backend playlist to frontend playlist
const mapBackendPlaylistToFrontend = (
  backendPlaylist: BackendPlaylistFull
): Playlist => {
  const mappedSongs: Song[] = backendPlaylist.songs.map(
    (song: BackendSong) => ({
      id: song.id.toString(),
      title: song.title,
      artist: song.artist,
      album: "Single",
      coverArt:
        song.album_art_url === "no" || !song.album_art_url
          ? "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200"
          : song.album_art_url,
      duration: 180,
      url: song.song_url,
    })
  );

  return {
    id: backendPlaylist.id, // Keep as number to match API
    title: backendPlaylist.title,
    description: backendPlaylist.description || "", // Convert null to empty string for frontend
    songs: mappedSongs,
    userId: backendPlaylist.user_id, // Frontend convenience field
    user_id: backendPlaylist.user_id, // API field
    likes: [], // Frontend convenience field (not from API, only likes_count is available)
    createdAt: backendPlaylist.created_at, // Frontend convenience field
    created_at: backendPlaylist.created_at, // API field
    updated_at: backendPlaylist.updated_at, // API field
    privacy: backendPlaylist.privacy, // API field
    owner: backendPlaylist.owner, // API field (BackendUser)
    likes_count: backendPlaylist.likes_count, // API field
    comments_count: backendPlaylist.comments_count, // API field
    coverArt: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200", // Frontend convenience field
  };
};

// Helper function to map backend comment to frontend comment
const mapBackendCommentToFrontend = (
  backendComment: BackendComment
): Comment => {
  return {
    id: backendComment.id, // Keep as number to match API
    playlistId: backendComment.playlist_id, // Keep as number to match API
    userId: backendComment.user_id,
    username: backendComment.user.username,
    avatar: backendComment.user.avatar_url || "https://github.com/shadcn.png",
    text: backendComment.body,
    createdAt: backendComment.created_at,
  };
};

export const playlistService = {
  /**
   * Get all playlists (paginated)
   * @param skip - Number of playlists to skip (default: 0)
   * @param limit - Maximum number of playlists to return (default: 20)
   */
  getPlaylists: async (
    skip: number = 0,
    limit: number = 20
  ): Promise<Playlist[]> => {
    try {
      const response = await api.get<BackendPlaylistFull[]>("/playlists/", {
        params: { skip, limit },
      });
      return response.data.map(mapBackendPlaylistToFrontend);
    } catch (error) {
      console.error("Get playlists error:", error);
      throw error;
    }
  },

  /**
   * Create a new playlist
   * @param playlistData - Playlist creation data
   */
  createPlaylist: async (
    playlistData: PlaylistCreateRequest
  ): Promise<Playlist> => {
    try {
      const response = await api.post<BackendPlaylistFull>(
        "/playlists/",
        playlistData
      );
      return mapBackendPlaylistToFrontend(response.data);
    } catch (error) {
      console.error("Create playlist error:", error);
      throw error;
    }
  },

  /**
   * Get personalized feed (playlists from followed users)
   * @param skip - Number of playlists to skip (default: 0)
   * @param limit - Maximum number of playlists to return (default: 20)
   */
  getFeed: async (
    skip: number = 0,
    limit: number = 20
  ): Promise<Playlist[]> => {
    try {
      const response = await api.get<BackendPlaylistFull[]>("/playlists/feed", {
        params: { skip, limit },
      });
      return response.data.map(mapBackendPlaylistToFrontend);
    } catch (error) {
      console.error("Get feed error:", error);
      throw error;
    }
  },

  /**
   * Get a specific playlist by ID
   * @param playlistId - The ID of the playlist
   */
  getPlaylist: async (playlistId: number): Promise<Playlist> => {
    try {
      const response = await api.get<BackendPlaylistFull>(
        `/playlists/${playlistId}`
      );
      return mapBackendPlaylistToFrontend(response.data);
    } catch (error) {
      console.error("Get playlist error:", error);
      throw error;
    }
  },

  /**
   * Update a playlist
   * @param playlistId - The ID of the playlist to update
   * @param playlistData - Updated playlist data
   */
  updatePlaylist: async (
    playlistId: number,
    playlistData: PlaylistUpdateRequest
  ): Promise<Playlist> => {
    try {
      const response = await api.put<BackendPlaylistFull>(
        `/playlists/${playlistId}`,
        playlistData
      );
      return mapBackendPlaylistToFrontend(response.data);
    } catch (error) {
      console.error("Update playlist error:", error);
      throw error;
    }
  },

  /**
   * Delete a playlist
   * @param playlistId - The ID of the playlist to delete
   */
  deletePlaylist: async (playlistId: number): Promise<void> => {
    try {
      await api.delete(`/playlists/${playlistId}`);
    } catch (error) {
      console.error("Delete playlist error:", error);
      throw error;
    }
  },

  /**
   * Like a playlist
   * @param playlistId - The ID of the playlist to like
   */
  likePlaylist: async (playlistId: number): Promise<BackendLike> => {
    try {
      const response = await api.post<BackendLike>(
        `/playlists/${playlistId}/like`
      );
      return response.data;
    } catch (error) {
      console.error("Like playlist error:", error);
      throw error;
    }
  },

  /**
   * Unlike a playlist
   * @param playlistId - The ID of the playlist to unlike
   */
  unlikePlaylist: async (playlistId: number): Promise<void> => {
    try {
      await api.delete(`/playlists/${playlistId}/like`);
    } catch (error) {
      console.error("Unlike playlist error:", error);
      throw error;
    }
  },

  /**
   * Get comments for a playlist
   * @param playlistId - The ID of the playlist
   */
  getPlaylistComments: async (playlistId: number): Promise<Comment[]> => {
    try {
      const response = await api.get<BackendComment[]>(
        `/playlists/${playlistId}/comments`
      );
      return response.data.map(mapBackendCommentToFrontend);
    } catch (error) {
      console.error("Get playlist comments error:", error);
      throw error;
    }
  },

  /**
   * Create a comment on a playlist
   * @param playlistId - The ID of the playlist
   * @param commentData - Comment data
   */
  createComment: async (
    playlistId: number,
    commentData: CommentCreateRequest
  ): Promise<Comment> => {
    try {
      const response = await api.post<BackendComment>(
        `/playlists/${playlistId}/comments`,
        commentData
      );
      return mapBackendCommentToFrontend(response.data);
    } catch (error) {
      console.error("Create comment error:", error);
      throw error;
    }
  },

  /**
   * Update a comment
   * @param commentId - The ID of the comment to update
   * @param commentData - Updated comment data
   */
  updateComment: async (
    commentId: number,
    commentData: CommentUpdateRequest
  ): Promise<Comment> => {
    try {
      const response = await api.put<BackendComment>(
        `/playlists/comments/${commentId}`,
        commentData
      );
      return mapBackendCommentToFrontend(response.data);
    } catch (error) {
      console.error("Update comment error:", error);
      throw error;
    }
  },

  /**
   * Delete a comment
   * @param commentId - The ID of the comment to delete
   */
  deleteComment: async (commentId: number): Promise<void> => {
    try {
      await api.delete(`/playlists/comments/${commentId}`);
    } catch (error) {
      console.error("Delete comment error:", error);
      throw error;
    }
  },
};
