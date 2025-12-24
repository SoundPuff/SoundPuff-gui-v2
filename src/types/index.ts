// src/types/index.ts
export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  followers: string[];
  following: string[];
  likedPlaylists: string[]; //Beğenilen Playlist ID'leri
  createdAt: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverArt: string;
  url?: string; // Serviste 'url' ataması var yine de opsiyenel ekledim
}

export interface PlaylistOwner {
  username: string;
  id: string;
  bio: string;
  avatar_url: string;
  created_at: string;
}
export interface Playlist {
  id: number; // API returns integer
  title: string;
  description: string | null;
  songs: Song[];
  userId?: string; // Frontend convenience field
  user_id: string; // API field (UUID)
  likes?: string[]; // Frontend convenience field (not from API)
  createdAt?: string; // Frontend convenience field
  created_at: string; // API field (date-time)
  updated_at?: string | null; // API field (date-time or null)
  coverArt?: string; // Frontend convenience field
  privacy: "public" | "private"; // API field
  owner: BackendUser; // API field (User schema)
  likes_count: number; // API field (default: 0)
  comments_count: number; // API field (default: 0)
}

export interface Comment {
  id: number; // API returns integer
  playlistId: number; // API returns integer
  userId: string; // API returns UUID
  username: string; // From user object
  avatar: string; // From user.avatar_url
  text: string; // API field is "body"
  createdAt: string; // API field is "created_at"

  likes_count?: number; // new
  is_liked?: boolean;   // new
}


// Backend SONG SEARCH TYPE
// Backend'den gelen ham şarkı verisi
export interface BackendSong {
  id: number;
  title: string;
  artist: string;
  album_art_url: string | null;
  song_url: string;
  created_at: string;
}

// Arama sonucundaki "song" ve "relevance" yapısı
export interface SearchSongItem {
  song: BackendSong;
  relevance: number | null;
}

// Arama endpoint'inin genel cevabı
export interface SearchResponse {
  query: string;
  songs: SearchSongItem[];
  total: number;
}

// --- USER SEARCH TYPES ---

export interface BackendUser {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

// Backend'den profil güncelleme isteği için (PUT /users/me)
export interface UserUpdateRequest {
  bio?: string;
  avatar_url?: string;
}

export interface SearchUserItem {
  user: BackendUser;
  relevance: number | null;
}

export interface SearchUserResponse {
  query: string;
  users: SearchUserItem[];
  total: number;
}

// --- PLAYLIST SEARCH TYPES ---
// Note: API returns full Playlist schema in search results, not just basic fields
export interface SearchPlaylistItem {
  playlist: BackendPlaylistFull; // Full Playlist schema from API
  relevance: number | null;
}

export interface SearchPlaylistResponse {
  query: string;
  playlists: SearchPlaylistItem[];
  total: number;
}

// --- ALL SEARCH RESPONSE TYPE ---
export interface SearchAllResponse {
  query: string;
  songs: SearchSongItem[]; //SearchSongItem
  users: SearchUserItem[]; //SearchUserItem
  playlists: SearchPlaylistItem[]; //SearchPlaylistItem
  total_songs: number;
  total_users: number;
  total_playlists: number;
}

// --- BACKEND PLAYLIST TYPES ---
// Matches API schema "Playlist"
export interface BackendPlaylistFull {
  id: number;
  title: string;
  description: string | null;
  privacy: "public" | "private";
  user_id: string; // UUID
  created_at: string; // date-time
  updated_at: string | null; // date-time or null
  owner: BackendUser; // User schema
  songs: BackendSong[]; // Array of Song schema
  likes_count: number; // default: 0
  comments_count: number; // default: 0
}

// --- BACKEND COMMENT TYPES ---
// Matches API schema "Comment"
export interface BackendComment {
  id: number;
  body: string;
  user_id: string; // UUID
  playlist_id: number;
  created_at: string; // date-time
  user: BackendUser; // User schema

  // Add these optional fields if API supports them
  likes_count?: number;
  is_liked?: boolean;
}


// --- PLAYLIST REQUEST TYPES ---
// Matches API schema "PlaylistCreate"
export interface PlaylistCreateRequest {
  title: string; // required
  description?: string | null;
  privacy?: "public" | "private"; // default: "public"
  song_ids: number[];
}

// Matches API schema "PlaylistUpdate"
export interface PlaylistUpdateRequest {
  title?: string | null;
  description?: string | null;
  privacy?: "public" | "private" | null;
  song_ids?: number[];
}

// --- COMMENT REQUEST TYPES ---
// Matches API schema "CommentCreate"
export interface CommentCreateRequest {
  body: string; // required
  playlist_id: number; // required
}

// Matches API schema "CommentUpdate"
export interface CommentUpdateRequest {
  body: string; // required
}

// --- LIKE TYPE ---
// Matches API schema "Like"
export interface BackendLike {
  playlist_id: number;
  user_id: string; // UUID
  created_at: string; // date-time
}
