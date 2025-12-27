import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchService } from '../searchService';
import api from '../api';

// API çağrılarını Mock'luyoruz
vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('SearchService Unit Tests', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- 1. SEARCH ALL TESTLERİ ---
  
  it('should searchAll handles songs, users AND playlists correctly', async () => {
    // Hem şarkı hem playlist içeren dolu bir cevap simüle ediyoruz (Lines 60-90 coverage için)
    const mockResponse = {
      data: {
        songs: [
            { song: { id: 1, title: 'Test Song', artist: 'Tester', album_art_url: 'img.jpg', song_url: 'url' } }
        ],
        playlists: [
            { playlist: { id: 5, title: 'Test Playlist', user_id: 1, songs: [], is_liked: false, created_at: 'date', owner: {} } }
        ],
        users: []
      }
    };

    (api.get as any).mockResolvedValue(mockResponse);

    const result = await searchService.searchAll("FullQuery");

    // Endpoint kontrolü
    expect(api.get).toHaveBeenCalledWith('/songs/all', expect.anything());
    
    // Mapping kontrolü
    expect(result.songs).toHaveLength(1);
    expect(result.playlists).toHaveLength(1); // Playlist mapping kodunun çalıştığını doğrular
    expect(result.playlists[0].title).toBe('Test Playlist');
  });

  it('should return empty objects if query is empty for searchAll', async () => {
    const result = await searchService.searchAll("");
    expect(result.songs).toEqual([]);
    expect(result.playlists).toEqual([]);
  });

  // --- 2. SEARCH SONGS TESTLERİ (Coverage Artışı için) ---

  it('should call /songs/search endpoint for searchSongs', async () => {
    const mockResponse = {
      data: {
        songs: [
          { song: { id: 10, title: 'Solo Song', artist: 'Solo Artist', album_art_url: 'img.jpg', song_url: 'url' } }
        ]
      }
    };
    (api.get as any).mockResolvedValue(mockResponse);

    const result = await searchService.searchSongs("SongQuery");

    expect(api.get).toHaveBeenCalledWith('/songs/search', expect.objectContaining({
      params: expect.objectContaining({ query: 'SongQuery' })
    }));
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Solo Song');
  });

  it('should return empty array for searchSongs if query is empty', async () => {
     const res = await searchService.searchSongs("");
     expect(res).toEqual([]);
  });

  // --- 3. SEARCH PLAYLISTS TESTLERİ (Coverage Artışı için) ---

  it('should call /songs/playlists/search endpoint for searchPlaylists', async () => {
    const mockResponse = {
      data: {
        playlists: [
          {
            playlist: {
              id: 99,
              title: 'Found Playlist',
              description: 'Desc',
              user_id: 1,
              songs: [],
              is_liked: true,
              created_at: '2023-01-01',
              likes_count: 5,
              comments_count: 2
            }
          }
        ]
      }
    };
    (api.get as any).mockResolvedValue(mockResponse);

    const result = await searchService.searchPlaylists("PlaylistQuery");

    expect(api.get).toHaveBeenCalledWith('/songs/playlists/search', expect.objectContaining({
        params: expect.objectContaining({ query: 'PlaylistQuery' })
    }));
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Found Playlist');
    expect(result[0].is_liked).toBe(true);
  });

  it('should return empty array for searchPlaylists if query is empty', async () => {
     const res = await searchService.searchPlaylists("");
     expect(res).toEqual([]);
  });

  // --- 4. SEARCH USERS TESTLERİ ---

  it('should call /songs/users/search endpoint for searchUsers', async () => {
    const mockUserResponse = {
      data: {
        users: [
          { user: { id: 101, username: 'TestUser', avatar_url: 'avatar.png' } }
        ]
      }
    };

    (api.get as any).mockResolvedValue(mockUserResponse);

    const result = await searchService.searchUsers("UserQuery");

    expect(api.get).toHaveBeenCalledWith('/songs/users/search', expect.anything());
    expect(result[0].username).toBe('TestUser');
  });
  
  it('should return empty array for searchUsers if query is empty', async () => {
     const res = await searchService.searchUsers("");
     expect(res).toEqual([]);
  });

  // --- 5. ERROR HANDLING (HATA YÖNETİMİ) TESTLERİ ---
  // Coverage oranını %100'e çıkarmak için catch bloklarını test ediyoruz.

  it('should handle API errors gracefully in searchAll', async () => {
    // API'nin hata fırlattığını simüle et
    (api.get as any).mockRejectedValue(new Error("Network Error"));
    
    // Hata durumunda boş obje dönmeli (catch bloğu çalışmalı)
    const result = await searchService.searchAll("ErrorQuery");
    
    expect(result.songs).toEqual([]);
    expect(result.playlists).toEqual([]);
    expect(result.users).toEqual([]);
  });

  it('should handle API errors gracefully in searchSongs', async () => {
    (api.get as any).mockRejectedValue(new Error("Network Error"));
    const result = await searchService.searchSongs("ErrorQuery");
    expect(result).toEqual([]);
  });

  it('should handle API errors gracefully in searchPlaylists', async () => {
    (api.get as any).mockRejectedValue(new Error("Network Error"));
    const result = await searchService.searchPlaylists("ErrorQuery");
    expect(result).toEqual([]);
  });

  it('should handle API errors gracefully in searchUsers', async () => {
    (api.get as any).mockRejectedValue(new Error("Network Error"));
    const result = await searchService.searchUsers("ErrorQuery");
    expect(result).toEqual([]);
  });

});