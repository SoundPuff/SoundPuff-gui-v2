// src/types/index.ts
export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  followers: string[];
  following: string[];
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

export interface Playlist {
  id: string;
  title: string;
  description: string;
  songs: Song[];
  userId: string;
  likes: string[];
  createdAt: string;
  coverArt?: string;
}

export interface Comment {
  id: string;
  playlistId: string;
  userId: string;
  username: string;
  avatar: string;
  text: string;
  createdAt: string;
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

export interface BackendPlaylist {
  id: number;
  title: string;
  description: string | null;
  user_id: string; // Python modelinde UUID
  created_at: string;
  // Playlist modelinde cover_art yok, frontend'de varsayılan atayacağız
}

export interface SearchPlaylistItem {
  playlist: BackendPlaylist;
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
  songs: SearchSongItem[];      //SearchSongItem
  users: SearchUserItem[];      //SearchUserItem
  playlists: SearchPlaylistItem[]; //SearchPlaylistItem
  total_songs: number;
  total_users: number;
  total_playlists: number;
}