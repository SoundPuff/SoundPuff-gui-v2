// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Token management
export const tokenManager = {
  getToken: (): string | null => localStorage.getItem('access_token'),
  setToken: (token: string): void => localStorage.setItem('access_token', token),
  removeToken: (): void => localStorage.removeItem('access_token'),
};

// Base fetch wrapper with JWT authentication
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenManager.getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      tokenManager.removeToken();
      throw new Error('Unauthorized - please log in again');
    }
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Authentication API
export const authAPI = {
  // FR1: Register new account
  register: async (username: string, email: string, password: string) => {
    return apiFetch<{ access_token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  },

  // FR2: Login with credentials
  login: async (username: string, password: string) => {
    return apiFetch<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  // FR3: Logout
  logout: async () => {
    return apiFetch<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  },

  // Get current user
  getCurrentUser: async () => {
    return apiFetch<any>('/auth/me');
  },
};

// User API
export const userAPI = {
  // FR4: Update profile (bio, avatar)
  updateProfile: async (userId: string, bio: string, avatar: string) => {
    return apiFetch<any>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ bio, avatar }),
    });
  },

  // FR5: Delete account
  deleteAccount: async (userId: string) => {
    return apiFetch<{ message: string }>(`/users/${userId}`, {
      method: 'DELETE',
    });
  },

  // Get user by ID
  getUser: async (userId: string) => {
    return apiFetch<any>(`/users/${userId}`);
  },

  // FR12: Follow user
  followUser: async (userId: string) => {
    return apiFetch<any>(`/users/${userId}/follow`, {
      method: 'POST',
    });
  },

  // FR12: Unfollow user
  unfollowUser: async (userId: string) => {
    return apiFetch<any>(`/users/${userId}/unfollow`, {
      method: 'POST',
    });
  },

  // Get user's followers
  getFollowers: async (userId: string) => {
    return apiFetch<any[]>(`/users/${userId}/followers`);
  },

  // Get user's following
  getFollowing: async (userId: string) => {
    return apiFetch<any[]>(`/users/${userId}/following`);
  },
};

// Playlist API
export const playlistAPI = {
  // FR6: Create playlist
  createPlaylist: async (title: string, description: string, songs: any[], coverArt?: string) => {
    return apiFetch<any>('/playlists', {
      method: 'POST',
      body: JSON.stringify({ title, description, songs, cover_art: coverArt }),
    });
  },

  // FR7: Edit playlist (add/remove songs)
  updatePlaylist: async (
    playlistId: string,
    title: string,
    description: string,
    songs: any[],
    coverArt?: string
  ) => {
    return apiFetch<any>(`/playlists/${playlistId}`, {
      method: 'PUT',
      body: JSON.stringify({ title, description, songs, cover_art: coverArt }),
    });
  },

  // FR8: Delete playlist
  deletePlaylist: async (playlistId: string) => {
    return apiFetch<{ message: string }>(`/playlists/${playlistId}`, {
      method: 'DELETE',
    });
  },

  // FR9: Get playlist details
  getPlaylist: async (playlistId: string) => {
    return apiFetch<any>(`/playlists/${playlistId}`);
  },

  // Get user's playlists
  getUserPlaylists: async (userId: string) => {
    return apiFetch<any[]>(`/users/${userId}/playlists`);
  },

  // FR15: Get public playlists (for guests)
  getPublicPlaylists: async (limit: number = 10) => {
    return apiFetch<any[]>(`/playlists/public?limit=${limit}`);
  },

  // FR10: Like playlist
  likePlaylist: async (playlistId: string) => {
    return apiFetch<any>(`/playlists/${playlistId}/like`, {
      method: 'POST',
    });
  },

  // FR10: Unlike playlist
  unlikePlaylist: async (playlistId: string) => {
    return apiFetch<any>(`/playlists/${playlistId}/unlike`, {
      method: 'POST',
    });
  },
};

// Comment API
export const commentAPI = {
  // FR11: Add comment to playlist
  addComment: async (playlistId: string, text: string) => {
    return apiFetch<any>(`/playlists/${playlistId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  // Get playlist comments
  getPlaylistComments: async (playlistId: string) => {
    return apiFetch<any[]>(`/playlists/${playlistId}/comments`);
  },

  // Delete comment
  deleteComment: async (commentId: string) => {
    return apiFetch<{ message: string }>(`/comments/${commentId}`, {
      method: 'DELETE',
    });
  },
};

// Feed API
export const feedAPI = {
  // FR13: Get feed of playlists from followed users
  getFeed: async (page: number = 1, limit: number = 20) => {
    return apiFetch<{ playlists: any[]; total: number; page: number }>(
      `/feed?page=${page}&limit=${limit}`
    );
  },
};

// Search API
export const searchAPI = {
  // FR14: Search for users, playlists, or songs
  search: async (query: string, type: 'all' | 'users' | 'playlists' | 'songs' = 'all') => {
    return apiFetch<{
      users?: any[];
      playlists?: any[];
      songs?: any[];
    }>(`/search?q=${encodeURIComponent(query)}&type=${type}`);
  },
};

// Songs API
export const songAPI = {
  // Get all songs
  getSongs: async () => {
    return apiFetch<any[]>('/songs');
  },

  // Get song by ID
  getSong: async (songId: string) => {
    return apiFetch<any>(`/songs/${songId}`);
  },
};
