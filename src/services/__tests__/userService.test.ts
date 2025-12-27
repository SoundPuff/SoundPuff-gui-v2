import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from '../userService';
import api from '../api';

// API çağrılarını Mock'luyoruz
vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
}));

describe('UserService Comprehensive Tests', () => {
  
  beforeEach(() => {
    // DÜZELTME BURADA: clearAllMocks yerine resetAllMocks kullanıyoruz.
    // Bu, önceki testlerin "hata fırlatma" ayarlarını sıfırlar.
    vi.resetAllMocks();
  });

  // ==========================================
  // 1. AUTH & USER MANAGEMENT (Student 1 Area)
  // ==========================================

  describe('getMe (Get Current User)', () => {
    it('should fetch and map the current user successfully', async () => {
      const mockBackendUser = {
        data: {
          id: 1,
          username: 'testuser',
          bio: 'My Bio',
          avatar_url: 'avatar.png',
          created_at: '2023-01-01'
        }
      };
      (api.get as any).mockResolvedValue(mockBackendUser);

      const result = await userService.getMe();

      expect(api.get).toHaveBeenCalledWith('/users/me');
      expect(result.username).toBe('testuser');
      expect(result.avatar).toBe('avatar.png');
    });

    it('should throw UserServiceError with 401 on authentication failure', async () => {
      const errorMock = {
        response: {
          status: 401,
          data: { detail: 'Unauthorized' }
        }
      };
      (api.get as any).mockRejectedValue(errorMock);

      await expect(userService.getMe()).rejects.toThrow('Authentication required.');
    });

    it('should throw generic UserServiceError on other failures', async () => {
      const errorMock = {
        message: 'Network Error'
      };
      (api.get as any).mockRejectedValue(errorMock);

      await expect(userService.getMe()).rejects.toThrow('Failed to get current user');
    });
  });

  describe('deleteCurrentUser', () => {
    it('should delete the current user successfully', async () => {
      (api.delete as any).mockResolvedValue({ status: 204 });
      await userService.deleteCurrentUser();
      expect(api.delete).toHaveBeenCalledWith('/users/me');
    });

    it('should throw UserServiceError when delete fails', async () => {
      (api.delete as any).mockRejectedValue(new Error('Delete failed'));
      await expect(userService.deleteCurrentUser()).rejects.toThrow('Failed to delete account');
    });
  });

  describe('updateCurrentUser', () => {
    it('should update user and return mapped user', async () => {
      const updateData = { bio: 'New Bio' };
      const mockResponse = {
        data: {
          id: 1,
          username: 'testuser',
          bio: 'New Bio',
          avatar_url: null,
          created_at: 'date'
        }
      };
      (api.put as any).mockResolvedValue(mockResponse);

      const result = await userService.updateCurrentUser(updateData);

      expect(api.put).toHaveBeenCalledWith('/users/me', updateData);
      expect(result.bio).toBe('New Bio');
    });

    it('should propagate errors during update', async () => {
      (api.put as any).mockRejectedValue(new Error('Update failed'));
      await expect(userService.updateCurrentUser({})).rejects.toThrow('Update failed');
    });
  });

  // ==========================================
  // 2. SOCIAL FEATURES (Student 4 Area)
  // ==========================================

  describe('getUserByUsername (Parallel Fetching)', () => {
    it('should fetch profile, followers, and following in parallel', async () => {
      const targetUser = "targetUser";
      
      (api.get as any).mockImplementation((url: string) => {
        if (url.endsWith('/followers')) {
          return Promise.resolve({ data: [{ id: 101, username: 'f1' }] });
        }
        if (url.endsWith('/following')) {
          return Promise.resolve({ data: [{ id: 102, username: 'f2' }, { id: 103, username: 'f3' }] });
        }
        return Promise.resolve({ 
          data: { id: 1, username: targetUser, bio: 'Bio', avatar_url: null, created_at: 'date' } 
        });
      });

      const result = await userService.getUserByUsername(targetUser);

      expect(result.username).toBe(targetUser);
      expect(result.followers).toEqual([101]);
      expect(result.following).toEqual([102, 103]);
    });

    it('should throw error if username is empty', async () => {
      await expect(userService.getUserByUsername("")).rejects.toThrow('Username is required');
    });

    it('should propagate errors if any request fails', async () => {
      (api.get as any).mockRejectedValue(new Error('API Error'));
      await expect(userService.getUserByUsername("user")).rejects.toThrow('API Error');
    });
  });

  describe('Follow / Unfollow', () => {
    it('should follow user successfully', async () => {
      (api.post as any).mockResolvedValue({ data: { success: true } });
      await userService.followUser("user1");
      expect(api.post).toHaveBeenCalledWith('/users/user1/follow');
    });

    it('should unfollow user successfully', async () => {
      // DÜZELTME: Başarılı cevabı açıkça veriyoruz
      (api.delete as any).mockResolvedValue({ data: { success: true } });
      
      await userService.unfollowUser("user1");
      expect(api.delete).toHaveBeenCalledWith('/users/user1/follow');
    });

    it('should throw error when username is empty for follow/unfollow', async () => {
      await expect(userService.followUser("")).rejects.toThrow('Username is required');
      await expect(userService.unfollowUser("   ")).rejects.toThrow('Username is required');
    });
  });

  describe('Get Lists (Followers/Following)', () => {
    it('should fetch followers list', async () => {
      (api.get as any).mockResolvedValue({ 
        data: [{ id: 1, username: 'u1', avatar_url: null, created_at: 'd' }] 
      });
      const res = await userService.getUserFollowers("me");
      expect(res[0].username).toBe('u1');
      expect(api.get).toHaveBeenCalledWith('/users/me/followers');
    });

    it('should fetch following list', async () => {
      (api.get as any).mockResolvedValue({ 
        data: [{ id: 2, username: 'u2', avatar_url: null, created_at: 'd' }] 
      });
      const res = await userService.getUserFollowing("me");
      expect(res[0].username).toBe('u2');
      expect(api.get).toHaveBeenCalledWith('/users/me/following');
    });

    it('should validate username input', async () => {
        await expect(userService.getUserFollowers("")).rejects.toThrow();
        await expect(userService.getUserFollowing("")).rejects.toThrow();
    });
  });

  // ==========================================
  // 3. PLAYLIST LOGIC
  // ==========================================

  describe('getUserLikedPlaylists (Client-side Filtering Logic)', () => {
    it('should return empty array if userId is not provided', async () => {
      const res = await userService.getUserLikedPlaylists("");
      expect(res).toEqual([]);
      expect(api.get).not.toHaveBeenCalled();
    });

    it('should fetch ALL playlists and filter by liker ID correctly', async () => {
      const targetUserId = "user_123";
      const mockPlaylists = [
        {
          id: 1,
          title: "Liked Playlist",
          likes: [{ user_id: targetUserId }],
          songs: [],
          user_id: 99,
          created_at: 'date'
        },
        {
          id: 2,
          title: "Not Liked Playlist",
          likes: [{ user_id: "other_user" }],
          songs: [],
          user_id: 99,
          created_at: 'date'
        }
      ];

      (api.get as any).mockResolvedValue({ data: mockPlaylists });

      const result = await userService.getUserLikedPlaylists(targetUserId);

      expect(api.get).toHaveBeenCalledWith('/playlists/', expect.anything());
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Liked Playlist");
    });

    it('should handle alternative like structure (direct ID strings)', async () => {
      const targetUserId = "user_ABC";
      const mockPlaylists = [
        {
          id: 3,
          title: "String Liked",
          likes: ["user_ABC"],
          user_id: 1
        }
      ];
      (api.get as any).mockResolvedValue({ data: mockPlaylists });

      const result = await userService.getUserLikedPlaylists(targetUserId);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("String Liked");
    });

    it('should handle API errors gracefully (return empty array)', async () => {
      (api.get as any).mockRejectedValue(new Error("API Fail"));
      const result = await userService.getUserLikedPlaylists("any_user");
      expect(result).toEqual([]);
    });
  });

});