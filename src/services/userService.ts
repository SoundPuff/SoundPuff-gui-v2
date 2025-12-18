// src/services/userService.ts
import api from './api';
import { User, BackendUser } from '../types';

// Map backend user to frontend user
const mapBackendUserToFrontend = (backendUser: BackendUser): User => {
  return {
    id: backendUser.id,
    username: backendUser.username,
    email: '', // Email is not returned in User schema for privacy
    avatar: backendUser.avatar_url || 'https://github.com/shadcn.png',
    bio: backendUser.bio || '',
    followers: [], // Not included in User schema, would need separate call
    following: [], // Not included in User schema, would need separate call
    createdAt: backendUser.created_at,
  };
};

// Custom error class for user service errors
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
  /**
   * Get current authenticated user
   * @returns Current user profile
   * @throws {UserServiceError} If user is not authenticated or request fails
   */
  getMe: async (): Promise<User> => {
    try {
      const response = await api.get<BackendUser>('/users/me');
      return mapBackendUserToFrontend(response.data);
    } catch (error: any) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to get current user';
      
      if (statusCode === 401) {
        throw new UserServiceError('Authentication required. Please log in.', 401, error.response?.data);
      }
      
      throw new UserServiceError(
        `Failed to get current user: ${errorMessage}`,
        statusCode,
        error.response?.data
      );
    }
  },

  /**
   * Update current authenticated user profile
   * @param userData - User update data (bio and/or avatar_url)
   * @returns Updated user profile
   * @throws {UserServiceError} If update fails
   */
  updateMe: async (userData: { bio?: string | null; avatar_url?: string | null }): Promise<User> => {
    try {
      const response = await api.put<BackendUser>('/users/me', userData);
      return mapBackendUserToFrontend(response.data);
    } catch (error: any) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to update user';
      
      if (statusCode === 401) {
        throw new UserServiceError('Authentication required. Please log in.', 401, error.response?.data);
      }
      
      if (statusCode === 422) {
        const validationErrors = error.response?.data?.detail;
        throw new UserServiceError(
          `Validation error: ${JSON.stringify(validationErrors)}`,
          422,
          validationErrors
        );
      }
      
      throw new UserServiceError(
        `Failed to update user: ${errorMessage}`,
        statusCode,
        error.response?.data
      );
    }
  },

  /**
   * Get user by username
   * @param username - Username to lookup
   * @returns User profile
   * @throws {UserServiceError} If user not found or request fails
   */
  getUserByUsername: async (username: string): Promise<User> => {
    if (!username || username.trim().length === 0) {
      throw new UserServiceError('Username is required', 400);
    }

    try {
      const response = await api.get<BackendUser>(`/users/${encodeURIComponent(username)}`);
      return mapBackendUserToFrontend(response.data);
    } catch (error: any) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to get user';
      
      if (statusCode === 404) {
        throw new UserServiceError(`User "${username}" not found`, 404, error.response?.data);
      }
      
      if (statusCode === 422) {
        const validationErrors = error.response?.data?.detail;
        throw new UserServiceError(
          `Validation error: ${JSON.stringify(validationErrors)}`,
          422,
          validationErrors
        );
      }
      
      throw new UserServiceError(
        `Failed to get user: ${errorMessage}`,
        statusCode,
        error.response?.data
      );
    }
  },

  /**
   * Follow a user
   * @param username - Username of the user to follow
   * @throws {UserServiceError} If follow operation fails
   */
  followUser: async (username: string): Promise<void> => {
    if (!username || username.trim().length === 0) {
      throw new UserServiceError('Username is required', 400);
    }

    try {
      await api.post(`/users/${encodeURIComponent(username)}/follow`);
    } catch (error: any) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to follow user';
      
      if (statusCode === 401) {
        throw new UserServiceError('Authentication required. Please log in.', 401, error.response?.data);
      }
      
      if (statusCode === 404) {
        throw new UserServiceError(`User "${username}" not found`, 404, error.response?.data);
      }
      
      if (statusCode === 400 && errorMessage.includes('Already following')) {
        // This is actually a success case - user is already following
        // We'll throw a specific error that can be handled gracefully
        throw new UserServiceError('Already following this user', 400, error.response?.data);
      }
      
      if (statusCode === 400 && errorMessage.includes('cannot follow yourself')) {
        throw new UserServiceError('You cannot follow yourself', 400, error.response?.data);
      }
      
      if (statusCode === 422) {
        const validationErrors = error.response?.data?.detail;
        throw new UserServiceError(
          `Validation error: ${JSON.stringify(validationErrors)}`,
          422,
          validationErrors
        );
      }
      
      throw new UserServiceError(
        `Failed to follow user: ${errorMessage}`,
        statusCode,
        error.response?.data
      );
    }
  },

  /**
   * Unfollow a user
   * @param username - Username of the user to unfollow
   * @throws {UserServiceError} If unfollow operation fails
   */
  unfollowUser: async (username: string): Promise<void> => {
    if (!username || username.trim().length === 0) {
      throw new UserServiceError('Username is required', 400);
    }

    try {
      await api.delete(`/users/${encodeURIComponent(username)}/follow`);
    } catch (error: any) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to unfollow user';
      
      if (statusCode === 401) {
        throw new UserServiceError('Authentication required. Please log in.', 401, error.response?.data);
      }
      
      if (statusCode === 404) {
        throw new UserServiceError(`User "${username}" not found`, 404, error.response?.data);
      }
      
      if (statusCode === 400 && errorMessage.includes('not following')) {
        // This is actually a success case - user is already not following
        // We'll throw a specific error that can be handled gracefully
        throw new UserServiceError('You are not following this user', 400, error.response?.data);
      }
      
      if (statusCode === 422) {
        const validationErrors = error.response?.data?.detail;
        throw new UserServiceError(
          `Validation error: ${JSON.stringify(validationErrors)}`,
          422,
          validationErrors
        );
      }
      
      throw new UserServiceError(
        `Failed to unfollow user: ${errorMessage}`,
        statusCode,
        error.response?.data
      );
    }
  },

  /**
   * Get list of users following a specific user
   * @param username - Username of the user
   * @returns Array of user profiles who are followers
   * @throws {UserServiceError} If request fails
   */
  getUserFollowers: async (username: string): Promise<User[]> => {
    if (!username || username.trim().length === 0) {
      throw new UserServiceError('Username is required', 400);
    }

    try {
      const response = await api.get<BackendUser[]>(`/users/${encodeURIComponent(username)}/followers`);
      return response.data.map(mapBackendUserToFrontend);
    } catch (error: any) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to get followers';
      
      if (statusCode === 404) {
        throw new UserServiceError(`User "${username}" not found`, 404, error.response?.data);
      }
      
      if (statusCode === 422) {
        const validationErrors = error.response?.data?.detail;
        throw new UserServiceError(
          `Validation error: ${JSON.stringify(validationErrors)}`,
          422,
          validationErrors
        );
      }
      
      throw new UserServiceError(
        `Failed to get followers: ${errorMessage}`,
        statusCode,
        error.response?.data
      );
    }
  },

  /**
   * Get list of users that a specific user is following
   * @param username - Username of the user
   * @returns Array of user profiles who are being followed
   * @throws {UserServiceError} If request fails
   */
  getUserFollowing: async (username: string): Promise<User[]> => {
    if (!username || username.trim().length === 0) {
      throw new UserServiceError('Username is required', 400);
    }

    try {
      const response = await api.get<BackendUser[]>(`/users/${encodeURIComponent(username)}/following`);
      return response.data.map(mapBackendUserToFrontend);
    } catch (error: any) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to get following';
      
      if (statusCode === 404) {
        throw new UserServiceError(`User "${username}" not found`, 404, error.response?.data);
      }
      
      if (statusCode === 422) {
        const validationErrors = error.response?.data?.detail;
        throw new UserServiceError(
          `Validation error: ${JSON.stringify(validationErrors)}`,
          422,
          validationErrors
        );
      }
      
      throw new UserServiceError(
        `Failed to get following: ${errorMessage}`,
        statusCode,
        error.response?.data
      );
    }
  },
};
