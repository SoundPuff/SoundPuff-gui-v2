import api from "./api";
import {
  Song,
  User,
  Playlist,
  SearchResponse,
  SearchUserResponse,
  SearchPlaylistResponse,
  SearchAllResponse,
} from "../types/index";

export const songService = {
  /**
   * Search songs by title or artist
   * @param query - Search query (min length: 1)
   * @param limit - Maximum number of results (default: 20, max: 100)
   * @param offset - Number of results to skip (default: 0)
   */
  searchSongs: async (
    query: string,
    limit: number = 6,
    offset: number = 0
  ): Promise<{ songs: Song[]; total: number }> => {
    if (!query || query.trim().length === 0) {
      return { songs: [], total: 0 };
    }

    try {
      const response = await api.get<SearchResponse>("/songs/search", {
        params: { query, limit, offset },
      });

      const mappedSongs: Song[] = response.data.songs.map((item) => ({
        id: item.song.id.toString(),
        title: item.song.title,
        artist: item.song.artist,
        album: "Single",
        coverArt:
          item.song.album_art_url === "no" || !item.song.album_art_url
            ? "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200"
            : item.song.album_art_url,
        duration: 180,
        url: item.song.song_url,
      }));

      return {
        songs: mappedSongs,
        total: response.data.total,
      };
    } catch (error) {
      console.error("Search songs error:", error);
      throw error;
    }
  },

  /**
   * Search users by username or bio
   * @param query - Search query (min length: 1)
   * @param limit - Maximum number of results (default: 20, max: 100)
   * @param offset - Number of results to skip (default: 0)
   */
  searchUsers: async (
    query: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ users: User[]; total: number }> => {
    if (!query || query.trim().length === 0) {
      return { users: [], total: 0 };
    }

    try {
      const response = await api.get<SearchUserResponse>(
        "/songs/users/search",
        {
          params: { query, limit, offset },
        }
      );

      const mappedUsers: User[] = response.data.users.map((item) => ({
        id: item.user.id,
        username: item.user.username,
        email: "",
        avatar: item.user.avatar_url || "https://github.com/shadcn.png",
        bio: item.user.bio || "",
        followers: [],
        following: [],
        createdAt: item.user.created_at,
      }));

      return {
        users: mappedUsers,
        total: response.data.total,
      };
    } catch (error) {
      console.error("Search users error:", error);
      throw error;
    }
  },

  /**
   * Search playlists by title or description
   * @param query - Search query (min length: 1)
   * @param limit - Maximum number of results (default: 20, max: 100)
   * @param offset - Number of results to skip (default: 0)
   */
  searchPlaylists: async (
    query: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ playlists: Playlist[]; total: number }> => {
    if (!query || query.trim().length === 0) {
      return { playlists: [], total: 0 };
    }

    try {
      const response = await api.get<SearchPlaylistResponse>(
        "/songs/playlists/search",
        {
          params: { query, limit, offset },
        }
      );

      const mappedPlaylists: Playlist[] = response.data.playlists.map(
        (item) => ({
          id: item.playlist.id.toString(),
          title: item.playlist.title,
          description: item.playlist.description || "",
          userId: item.playlist.user_id,
          songs: [],
          likes: [],
          coverArt:
            "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200",
          createdAt: item.playlist.created_at,
        })
      );

      return {
        playlists: mappedPlaylists,
        total: response.data.total,
      };
    } catch (error) {
      console.error("Search playlists error:", error);
      throw error;
    }
  },

  /**
   * Search across users, songs, and playlists at once
   * @param query - Search query (min length: 1)
   * @param type - Filter by type: "all", "users", "songs", or "playlists" (default: "all")
   * @param limit - Maximum results per category (default: 10, max: 50)
   * @param offset - Pagination offset per category (default: 0)
   */
  searchAll: async (
    query: string,
    type: "all" | "users" | "songs" | "playlists" = "all",
    limit: number = 10,
    offset: number = 0
  ): Promise<{
    songs: Song[];
    users: User[];
    playlists: Playlist[];
    totalSongs: number;
    totalUsers: number;
    totalPlaylists: number;
  }> => {
    if (!query || query.trim().length === 0) {
      return {
        songs: [],
        users: [],
        playlists: [],
        totalSongs: 0,
        totalUsers: 0,
        totalPlaylists: 0,
      };
    }

    try {
      const response = await api.get<SearchAllResponse>("/songs/all", {
        params: { query, type, limit, offset },
      });

      // Map songs
      const mappedSongs: Song[] = response.data.songs.map((item) => ({
        id: item.song.id.toString(),
        title: item.song.title,
        artist: item.song.artist,
        album: "Single",
        coverArt:
          item.song.album_art_url === "no" || !item.song.album_art_url
            ? "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200"
            : item.song.album_art_url,
        duration: 180,
        url: item.song.song_url,
      }));

      // Map users
      const mappedUsers: User[] = response.data.users.map((item) => ({
        id: item.user.id,
        username: item.user.username,
        email: "",
        avatar: item.user.avatar_url || "https://github.com/shadcn.png",
        bio: item.user.bio || "",
        followers: [],
        following: [],
        createdAt: item.user.created_at,
      }));

      // Map playlists
      // API returns full Playlist schema in search results
      const mappedPlaylists: Playlist[] = response.data.playlists.map(
        (item) => {
          const mappedSongs: Song[] = item.playlist.songs.map((song) => ({
            id: song.id.toString(),
            title: song.title,
            artist: song.artist,
            album: "Single",
            coverArt: song.album_art_url === "no" || !song.album_art_url
              ? "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200"
              : song.album_art_url,
            duration: 180,
            url: song.song_url,
          }));

          return {
            id: item.playlist.id, // Keep as number to match API
            title: item.playlist.title,
            description: item.playlist.description || "",
            songs: mappedSongs,
            userId: item.playlist.user_id,
            user_id: item.playlist.user_id,
            likes: [],
            createdAt: item.playlist.created_at,
            created_at: item.playlist.created_at,
            updated_at: item.playlist.updated_at,
            privacy: item.playlist.privacy,
            owner: item.playlist.owner,
            likes_count: item.playlist.likes_count,
            comments_count: item.playlist.comments_count,
            coverArt: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200",
          };
        }
      );

      return {
        songs: mappedSongs,
        users: mappedUsers,
        playlists: mappedPlaylists,
        totalSongs: response.data.total_songs,
        totalUsers: response.data.total_users,
        totalPlaylists: response.data.total_playlists,
      };
    } catch (error) {
      console.error("Search all error:", error);
      throw error;
    }
  },
};
