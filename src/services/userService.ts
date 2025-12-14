// src/services/userService.ts
import api from '../services/api';

export const userService = {
  //  follow (POST)
  followUser: async (username: string) => {
    // Endpoint: /users/{username}/follow
    await api.post(`/users/${username}/follow`);
  },

  // unfollow (DELETE)
  unfollowUser: async (username: string) => {
    // Endpoint: /users/{username}/follow
    await api.delete(`/users/${username}/follow`);
  }
};