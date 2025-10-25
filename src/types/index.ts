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
