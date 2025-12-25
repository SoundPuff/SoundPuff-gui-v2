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
    id: backendPlaylist.id,
    title: backendPlaylist.title,
    description: backendPlaylist.description || "",
    songs: mappedSongs,

    userId: backendPlaylist.user_id,
    user_id: backendPlaylist.user_id,

    createdAt: backendPlaylist.created_at,
    created_at: backendPlaylist.created_at,
    updated_at: backendPlaylist.updated_at,

    privacy: backendPlaylist.privacy,
    owner: backendPlaylist.owner,

    likes_count: backendPlaylist.likes_count,
    comments_count: backendPlaylist.comments_count,
    is_liked: Boolean(backendPlaylist.is_liked), // ✅ ADD THIS

    coverArt:
      backendPlaylist.cover_image_url ||
      "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200",
  };

};

// Helper function to map backend comment to frontend comment
const mapBackendCommentToFrontend = (backendComment: BackendComment): Comment => {
  return {
    id: backendComment.id,
    playlistId: backendComment.playlist_id,
    userId: backendComment.user_id,
    username: backendComment.user.username,
    avatar: backendComment.user.avatar_url || "https://github.com/shadcn.png",
    text: backendComment.body,
    createdAt: backendComment.created_at,

    likes_count: (backendComment.likes_count ?? 0), // add this
    is_liked: (backendComment.is_liked ?? false),   // add this
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

  
  /**
   * Like a comment
   */
  likeComment: async (commentId: number): Promise<void> => {
    try {
      await api.post(`/playlists/comments/${commentId}/like`);
    } catch (error) {
      console.error("Like comment error:", error);
      throw error;
    }
  },

  /**
   * Unlike a comment
   */
  unlikeComment: async (commentId: number): Promise<void> => {
    try {
      await api.delete(`/playlists/comments/${commentId}/like`);
    } catch (error) {
      console.error("Unlike comment error:", error);
      throw error;
    }
  },


};
