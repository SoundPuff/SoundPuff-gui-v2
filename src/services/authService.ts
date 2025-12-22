// src/services/authService.ts
import api from "../services/api";
import { User } from "../types";

interface AuthResponse {
  access_token: string;
  token_type: string;
}

// Backend'den gelen kullanıcı verisi formatı
export interface LoginResponse {
  refresh_token: string;
  access_token: string;
  token_type: string;
  expires_in: number;
}

export const authService = {
  // Signup
  signup: async (
    username: string,
    email: string,
    password: string
  ): Promise<LoginResponse> => {
    const response = await api.post<AuthResponse>("/auth/signup", {
      username,
      email,
      password,
    });
    return response.data as LoginResponse;
  },

  // Login: ARTIK EMAIL ALIYORUZ
  login: async (email: string, password: string): Promise<LoginResponse> => {
    // Backend 'email' beklediği için key'i 'email' olarak gönderiyoruz
    const response = await api.post<AuthResponse>("/auth/login", {
      email: email,
      password: password,
    });
    return response.data as LoginResponse;
  },

  // Request Reset Password
  requestResetPassword: async (email: string): Promise<{ message: string }> => {
    // Backend 'email' beklediği için key'i 'email' olarak gönderiyoruz
    const response = await api.post<AuthResponse>(
      "/auth/password-reset/request",
      {
        email: email,
      }
    );
    return response.data as unknown as { message: string };
  },

  // Confirm Reset Password
  confirmResetPassword: async (token: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<AuthResponse>(
      "/auth/password-reset/confirm",
      {
        token: token,
        password: password,
      }
    );
    return response.data as LoginResponse;
  },

  // Note: getMe has been moved to userService.getMe() for consistency
  // This keeps all user-related endpoints in one service
};
