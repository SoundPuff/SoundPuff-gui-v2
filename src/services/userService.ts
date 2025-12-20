// src/services/userService.ts
import api from './api';
import { User, BackendUser, Playlist, Song } from '../types';

// Map backend user to frontend user
const mapBackendUserToFrontend = (backendUser: BackendUser): User => {
  return {
    id: backendUser.id,
    username: backendUser.username,
    email: '', 
    avatar: backendUser.avatar_url || 'https://github.com/shadcn.png',
    bio: backendUser.bio || '',
    followers: [], 
    following: [], 
    likedPlaylists: [], 
    createdAt: backendUser.created_at,
  };
};

export class UserServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'UserServiceError';
  }
}

export const userService = {
  getMe: async (): Promise<User> => {
    try {
      const response = await api.get<BackendUser>('/users/me');
      return mapBackendUserToFrontend(response.data);
    } catch (error: any) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to get current user';
      if (statusCode === 401) throw new UserServiceError('Authentication required.', 401, error.response?.data);
      throw new UserServiceError(`Failed to get current user: ${errorMessage}`, statusCode, error.response?.data);
    }
  },

  updateMe: async (userData: { bio?: string | null; avatar_url?: string | null }): Promise<User> => {
    try {
      const response = await api.put<BackendUser>('/users/me', userData);
      return mapBackendUserToFrontend(response.data);
    } catch (error: any) {
      throw error; 
    }
  },

  getUserByUsername: async (username: string): Promise<User> => {
    if (!username || username.trim().length === 0) throw new UserServiceError('Username is required', 400);
    try {
      const response = await api.get<BackendUser>(`/users/${encodeURIComponent(username)}`);
      return mapBackendUserToFrontend(response.data);
    } catch (error: any) {
      throw error;
    }
  },

  followUser: async (username: string): Promise<void> => {
    if (!username || username.trim().length === 0) throw new UserServiceError('Username is required', 400);
    try {
      await api.post(`/users/${encodeURIComponent(username)}/follow`);
    } catch (error: any) {
      throw error;
    }
  },

  unfollowUser: async (username: string): Promise<void> => {
    if (!username || username.trim().length === 0) throw new UserServiceError('Username is required', 400);
    try {
      await api.delete(`/users/${encodeURIComponent(username)}/follow`);
    } catch (error: any) {
      throw error;
    }
  },

  getUserFollowers: async (username: string): Promise<User[]> => {
    if (!username || username.trim().length === 0) throw new UserServiceError('Username is required', 400);
    try {
      const response = await api.get<BackendUser[]>(`/users/${encodeURIComponent(username)}/followers`);
      return response.data.map(mapBackendUserToFrontend);
    } catch (error: any) {
      throw error;
    }
  },

  getUserFollowing: async (username: string): Promise<User[]> => {
    if (!username || username.trim().length === 0) throw new UserServiceError('Username is required', 400);
    try {
      const response = await api.get<BackendUser[]>(`/users/${encodeURIComponent(username)}/following`);
      return response.data.map(mapBackendUserToFrontend);
    } catch (error: any) {
      throw error;
    }
  },

  // 🔍 DEBUG EKLENMİŞ VERSİYON
  // 🔥 GÜNCELLENEN FONKSİYON (BACKEND DEĞİŞMEDEN)
  getUserLikedPlaylists: async (userId: string): Promise<Playlist[]> => {
    if (!userId) return [];

    console.log("🔍 [UserService] Workaround Modu: Tüm playlistler çekilip filtrelenecek.");

    try {
      // 1. ADIM: Backend'deki genel playlist listesini çek (Limiti yüksek tutuyoruz)
      // '/playlists/' endpoint'i mevcut backend'inde var.
      const response = await api.get<any[]>('/playlists/', {
        params: { skip: 0, limit: 100 } 
      });

      const allPlaylists = response.data;
      console.log(`📦 [UserService] Toplam ${allPlaylists.length} playlist çekildi.`);

      // 2. ADIM: JavaScript ile filtrele
      // "Bu playlist'in likes listesinde benim ID'm var mı?"
      const likedPlaylists = allPlaylists.filter((pl: any) => {
        // Backend 'likes' array'ini gönderiyor mu kontrol et
        if (!pl.likes || !Array.isArray(pl.likes)) return false;

        // Beğenenler arasında ben var mıyım?
        // Backend yapısına göre like objesi { user_id: "..." } veya direkt ID string olabilir.
        return pl.likes.some((like: any) => {
            const likerId = like.user_id || like.id || like; // Farklı formatları kapsa
            return likerId === userId;
        });
      });

      console.log(`✅ [UserService] Filtreleme sonucu: ${likedPlaylists.length} beğenilen playlist bulundu.`);

      // 3. ADIM: Frontend formatına çevir
      return likedPlaylists.map((playlistData: any) => ({
          id: playlistData.id,
          title: playlistData.title,
          description: playlistData.description || "",
          songs: (playlistData.songs || []).map((s: any) => ({
              id: s.id?.toString(),
              title: s.title,
              artist: s.artist,
              album: "Single",
              duration: 180,
              coverArt: s.album_art_url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200",
              url: s.song_url
          })),
          userId: playlistData.user_id,
          user_id: playlistData.user_id,
          likes: [], // Burayı boş bırakabiliriz, detayda zaten var
          createdAt: playlistData.created_at,
          created_at: playlistData.created_at,
          updated_at: playlistData.updated_at,
          coverArt: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200",
          likes_count: playlistData.likes_count || (playlistData.likes ? playlistData.likes.length : 0),
          comments_count: playlistData.comments_count || 0,
          privacy: playlistData.privacy || 'public',
          owner: playlistData.owner || {
              id: playlistData.user_id,
              username: 'Unknown',
              bio: null,
              avatar_url: null,
              created_at: new Date().toISOString()
          }
      })) as Playlist[];

    } catch (error) {
      console.error("❌ [UserService] Get liked playlists error:", error);
      return [];
    }
  },
};