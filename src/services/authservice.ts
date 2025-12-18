// src/services/authService.ts
import api from '../services/api';
import { User } from '../types';

interface AuthResponse {
  access_token: string;
  token_type: string;
}

// Backend'den gelen kullanıcı verisi formatı
interface BackendUser {
  id: string;
  username: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

const mapUser = (data: BackendUser): User => {
  return {
    id: data.id,
    username: data.username,
    email: data.email || '',
    avatar: data.avatar_url || 'https://github.com/shadcn.png', // Varsayılan avatar
    bio: data.bio || '',
    followers: [],
    following: [],
    createdAt: data.created_at
  };
};

export const authService = {
  // Signup
  signup: async (username: string, email: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/signup', {
      username,
      email,
      password,
    });
    return response.data;
  },

  // Login: ARTIK EMAIL ALIYORUZ
  login: async (email: string, password: string) => {
    // Backend 'email' beklediği için key'i 'email' olarak gönderiyoruz
    const response = await api.post<AuthResponse>('/auth/login', {
      email: email, 
      password: password,
    });
    return response.data;
  },

  // Note: getMe has been moved to userService.getMe() for consistency
  // This keeps all user-related endpoints in one service
};