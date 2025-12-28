import { describe, it, expect, vi, beforeEach } from 'vitest';
import { playlistService } from '../playlistService';
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

describe('PlaylistService Social & Discovery Tests (Student 4)', () => {
  
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // ==========================================
  // 1. FEED & DISCOVERY (UC-08)
  // ==========================================
  
  describe('getFeed (Discovery)', () => {
    it('should fetch the personalized feed correctly', async () => {
      // Backend'den dönen ham veri (BackendPlaylistFull formatında)
      const mockFeed = [
        {
          id: 10,
          title: 'Friends Playlist',
          description: 'Cool songs',
          user_id: 5,
          songs: [],
          likes_count: 5,
          comments_count: 2,
          is_liked: true,
          created_at: '2023-01-01',
          updated_at: '2023-01-02', // Types hatası olmaması için eklendi
          owner: { id: 5, username: 'friend', avatar_url: 'img.png' },
          privacy: 'public'
        }
      ];

      (api.get as any).mockResolvedValue({ data: mockFeed });

      const result = await playlistService.getFeed(0, 10);

      // 1. Doğru endpoint çağrıldı mı?
      expect(api.get).toHaveBeenCalledWith('/playlists/feed', {
        params: { skip: 0, limit: 10 }
      });

      // 2. Veri maplendi mi?
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Friends Playlist');
      expect(result[0].is_liked).toBe(true); // is_liked kontrolü
      expect(result[0].owner?.username).toBe('friend');
    });

    it('should handle API errors in getFeed', async () => {
      (api.get as any).mockRejectedValue(new Error('Feed failed'));
      await expect(playlistService.getFeed()).rejects.toThrow('Feed failed');
    });
  });

  // ==========================================
  // 2. SOCIAL INTERACTIONS: LIKES (UC-07)
  // ==========================================

  describe('Like / Unlike Playlists', () => {
    it('should send POST request to like a playlist', async () => {
      // BackendLike dönüş tipi
      (api.post as any).mockResolvedValue({ data: { success: true } });
      
      await playlistService.likePlaylist(99);
      
      expect(api.post).toHaveBeenCalledWith('/playlists/99/like');
    });

    it('should send DELETE request to unlike a playlist', async () => {
      (api.delete as any).mockResolvedValue({ data: { success: true } });
      
      await playlistService.unlikePlaylist(99);
      
      expect(api.delete).toHaveBeenCalledWith('/playlists/99/like');
    });

    it('should propagate errors in like operations', async () => {
      (api.post as any).mockRejectedValue(new Error('Like failed'));
      await expect(playlistService.likePlaylist(1)).rejects.toThrow('Like failed');
    });
  });

  // ==========================================
  // 3. SOCIAL INTERACTIONS: COMMENTS (UC-07)
  // ==========================================

  describe('Comments System', () => {
    
    it('should get playlist comments and map them correctly', async () => {
      const mockComments = [
        {
          id: 1,
          playlist_id: 100,
          user_id: 5,
          body: 'Nice playlist!',
          created_at: 'date',
          likes_count: 10,
          is_liked: false,
          user: { username: 'commenter', avatar_url: 'avatar.png' }
        }
      ];

      (api.get as any).mockResolvedValue({ data: mockComments });

      const result = await playlistService.getPlaylistComments(100);

      expect(api.get).toHaveBeenCalledWith('/playlists/100/comments');
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Nice playlist!'); // body -> text mapping
      expect(result[0].username).toBe('commenter');
    });

    it('should create a comment successfully', async () => {
      // DÜZELTME BURADA YAPILDI:
      // Tip hatasını çözmek için playlist_id ve user_id eklendi.
      // 'as any' kullanarak TypeScript'in aşırı katı kontrolünü testte esnetiyoruz.
      const commentRequest = { 
        body: 'New comment',
        playlist_id: 100,
        user_id: 1
      };

      const mockResponse = {
        id: 2,
        playlist_id: 100,
        user_id: 1,
        body: 'New comment',
        created_at: 'now',
        likes_count: 0,
        is_liked: false,
        user: { username: 'me', avatar_url: 'img.png' }
      };

      (api.post as any).mockResolvedValue({ data: mockResponse });

      // Typescript hatasını bypass etmek için 'as any' kullanıyoruz, 
      // çünkü test ortamında mock data ile çalışıyoruz.
      const result = await playlistService.createComment(100, commentRequest as any);

      expect(api.post).toHaveBeenCalledWith('/playlists/100/comments', commentRequest);
      expect(result.text).toBe('New comment');
    });

    it('should like a comment', async () => {
      await playlistService.likeComment(55);
      expect(api.post).toHaveBeenCalledWith('/playlists/comments/55/like');
    });

    it('should unlike a comment', async () => {
      await playlistService.unlikeComment(55);
      expect(api.delete).toHaveBeenCalledWith('/playlists/comments/55/like');
    });
  });


  // ==========================================
  // UC-10: View Playlist (Media Player Data)
  // ==========================================
  describe('getPlaylist (UC-10)', () => {
    it('should fetch a playlist by ID and map it to frontend format', async () => {
      const playlistId = 100;
      const mockBackendResponse = {
        data: {
          id: 100,
          title: 'Test Playlist',
          description: 'Desc',
          songs: [
            { id: 1, title: 'Song A', artist: 'Artist A', song_url: 'url.mp3', album_art_url: 'img.png' }
          ],
          user_id: 5,
          likes_count: 10,
          comments_count: 2,
          is_liked: true, // Backend snake_case
          created_at: '2023-01-01',
          owner: { username: 'user1' }
        }
      };

      (api.get as any).mockResolvedValue(mockBackendResponse);

      const result = await playlistService.getPlaylist(playlistId);

      // API doğru endpoint'e gitti mi?
      expect(api.get).toHaveBeenCalledWith(`/playlists/${playlistId}`);
      
      // Data doğru map'lendi mi? (Frontend camelCase)
      expect(result.id).toBe(100);
      expect(result.title).toBe('Test Playlist');
      expect(result.is_liked).toBe(true);
      expect(result.songs[0].title).toBe('Song A');
    });

    it('should handle errors when fetching playlist fails', async () => {
      (api.get as any).mockRejectedValue(new Error('Not Found'));
      await expect(playlistService.getPlaylist(999)).rejects.toThrow('Not Found');
    });
  });

  // ==========================================
  // UC-11: Like / Unlike Playlist
  // ==========================================
  describe('Like / Unlike Playlists (UC-11)', () => {
    it('should send POST request to like a playlist', async () => {
      const playlistId = 123;
      (api.post as any).mockResolvedValue({ data: { success: true } });

      await playlistService.likePlaylist(playlistId);

      expect(api.post).toHaveBeenCalledWith(`/playlists/${playlistId}/like`);
    });

    it('should send DELETE request to unlike a playlist', async () => {
      const playlistId = 123;
      (api.delete as any).mockResolvedValue({ data: { success: true } });

      await playlistService.unlikePlaylist(playlistId);

      expect(api.delete).toHaveBeenCalledWith(`/playlists/${playlistId}/like`);
    });

    it('should propagate errors in like operations', async () => {
      (api.post as any).mockRejectedValue(new Error('Network Error'));
      await expect(playlistService.likePlaylist(1)).rejects.toThrow('Network Error');
    });
  });

  // ==========================================
  // UC-12: Comments System
  // ==========================================
  describe('Comments System (UC-12)', () => {
    it('should fetch playlist comments and map them correctly', async () => {
      const playlistId = 50;
      const mockComments = {
        data: [
          {
            id: 1,
            body: 'Nice song!',
            user: { username: 'fan1', avatar_url: 'a.png' },
            created_at: '2023-05-05',
            likes_count: 5,
            is_liked: false
          }
        ]
      };

      (api.get as any).mockResolvedValue(mockComments);

      const comments = await playlistService.getPlaylistComments(playlistId);

      expect(api.get).toHaveBeenCalledWith(`/playlists/${playlistId}/comments`);
      expect(comments).toHaveLength(1);
      expect(comments[0].text).toBe('Nice song!');
      expect(comments[0].username).toBe('fan1');
    });

    it('should create a comment successfully', async () => {
      const payload = { body: 'New comment', playlist_id: 100, user_id: 1 };
      const mockResponse = {
        data: {
          id: 2,
          playlist_id: 100,
          user_id: 1,
          body: 'New comment',
          created_at: 'now',
          likes_count: 0,
          is_liked: false,
          user: { username: 'me', avatar_url: 'img.png' }
        }
      };

      (api.post as any).mockResolvedValue(mockResponse);

      // Typescript bypass for flexible mocking
      const result = await playlistService.createComment(100, payload as any);

      expect(api.post).toHaveBeenCalledWith(`/playlists/100/comments`, payload);
      expect(result.text).toBe('New comment');
    });

    it('should delete a comment', async () => {
      const commentId = 10;
      (api.delete as any).mockResolvedValue({});
      
      await playlistService.deleteComment(commentId);
      expect(api.delete).toHaveBeenCalledWith(`/playlists/comments/${commentId}`);
    });

    it('should like a comment', async () => {
      const commentId = 5;
      await playlistService.likeComment(commentId);
      expect(api.post).toHaveBeenCalledWith(`/playlists/comments/${commentId}/like`);
    });

    it('should unlike a comment', async () => {
      const commentId = 5;
      await playlistService.unlikeComment(commentId);
      expect(api.delete).toHaveBeenCalledWith(`/playlists/comments/${commentId}/like`);
    });
  });

  // ==========================================
  // Additional: Song Management (for "Like Song" feature)
  // ==========================================
  describe('Song Management (Add/Remove from Playlist)', () => {
    it('should add a song to a playlist', async () => {
      const playlistId = 1;
      const songId = 99;
      (api.post as any).mockResolvedValue({ data: { success: true } });

      await playlistService.addSongToPlaylist(playlistId, songId);

      expect(api.post).toHaveBeenCalledWith(
        `/playlists/${playlistId}/songs`,
        { song_id: 99 }
      );
    });

    it('should remove a song from a playlist', async () => {
      const playlistId = 1;
      const songId = 99;
      (api.delete as any).mockResolvedValue({});

      await playlistService.removeSongFromPlaylist(playlistId, songId);

      expect(api.delete).toHaveBeenCalledWith(`/playlists/${playlistId}/songs/${songId}`);
    });
  });
});