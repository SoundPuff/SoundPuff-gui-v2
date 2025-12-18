// src/services/searchService.ts
import api from '../services/api';
import { Song, Playlist, User } from '../types/index';
import { 
    SearchResponse, 
    SearchUserResponse, 
    SearchPlaylistResponse,
    SearchAllResponse 
  } from '../types/index';

export const searchService = {


    //End point for searching "all" in one request
  searchAll: async (query: string): Promise<{ songs: Song[], playlists: Playlist[], users: User[] }> => {
    if (!query) return { songs: [], playlists: [], users: [] };

    try {
      // Tek bir endpoint'e istek atıyoruz
      const response = await api.get<SearchAllResponse>('/songs/all', {
        params: { 
          query, 
          type: 'all', 
          limit: 10, 
          offset: 0 
        }
      });

      const data = response.data;

      // 1. Şarkıları Dönüştür
      const mappedSongs: Song[] = data.songs.map((item) => ({
        id: item.song.id.toString(),
        title: item.song.title,
        artist: item.song.artist,
        album: "Single",
        coverArt: item.song.album_art_url === "no" || !item.song.album_art_url
          ? "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200"
          : item.song.album_art_url,
        duration: 180,
        url: item.song.song_url
      }));

      // 2. Kullanıcıları Dönüştür
      const mappedUsers: User[] = data.users.map((item) => ({
        id: item.user.id,
        username: item.user.username,
        email: "", 
        avatar: item.user.avatar_url || "https://github.com/shadcn.png",
        bio: item.user.bio || "",
        followers: [],
        following: [],
        createdAt: item.user.created_at
      }));

      // 3. Playlistleri Dönüştür
      // Note: API returns full Playlist schema in search results
      const mappedPlaylists: Playlist[] = data.playlists.map((item) => {
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
      });

      return {
        songs: mappedSongs,
        users: mappedUsers,
        playlists: mappedPlaylists
      };

    } catch (error) {
      console.error("Search all error:", error);
      return { songs: [], playlists: [], users: [] };
    }
  },




  // Searching songs
  searchSongs: async (query: string): Promise<Song[]> => {
    if (!query) return [];
    try {
      const response = await api.get<SearchResponse>('/songs/search', {
        params: { query, limit: 50, offset: 0 }
      });
      return response.data.songs.map((item) => ({
        id: item.song.id.toString(),
        title: item.song.title,
        artist: item.song.artist,
        album: "Single",
        coverArt: item.song.album_art_url === "no" || !item.song.album_art_url
          ? "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200"
          : item.song.album_art_url,
        duration: 180,
        url: item.song.song_url
      }));
    } catch (error) {
      console.error("Search songs error:", error);
      return [];
    }
  },

  // Searching Playlists
  searchPlaylists: async (query: string): Promise<Playlist[]> => {
    if (!query) return [];
    try {
      // Endpoint: /songs/playlists/search
      const response = await api.get<SearchPlaylistResponse>('/songs/playlists/search', {
        params: { query, limit: 20, offset: 0 }
      });

      return response.data.playlists.map((item) => {
        // API returns full Playlist schema in search results
        const pl = item.playlist;
        const mappedSongs: Song[] = pl.songs.map((song) => ({
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
          id: pl.id, // Keep as number to match API
          title: pl.title,
          description: pl.description || "",
          songs: mappedSongs,
          userId: pl.user_id,
          user_id: pl.user_id,
          likes: [],
          createdAt: pl.created_at,
          created_at: pl.created_at,
          updated_at: pl.updated_at,
          privacy: pl.privacy,
          owner: pl.owner,
          likes_count: pl.likes_count,
          comments_count: pl.comments_count,
          coverArt: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200",
        };
      });
    } catch (error) {
      console.error("Search playlists error:", error);
      return [];
    }
  },

  // Searching Users
  searchUsers: async (query: string): Promise<User[]> => {
    if (!query) return [];
    try {
      // Endpoint: /songs/users/search
      const response = await api.get<SearchUserResponse>('/songs/users/search', {
        params: { query, limit: 20, offset: 0 }
      });

      return response.data.users.map((item) => {
        const u = item.user;
        return {
          id: u.id,
          username: u.username,
          email: "", // Arama sonucunda email gelmez (gizlilik gereği)
          avatar: u.avatar_url || "https://github.com/shadcn.png", // Avatar yoksa default
          bio: u.bio || "",
          followers: [], // Search listesinde detaylı follower listesi gelmez
          following: [],
          createdAt: u.created_at
        };
      });
    } catch (error) {
      console.error("Search users error:", error);
      return [];
    }
  }
};