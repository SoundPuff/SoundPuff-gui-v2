import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Song, Playlist } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Plus, X, Save, Search } from 'lucide-react';
import { Checkbox } from '../components/ui/checkbox';
import { songService } from '../services/songService';
import { playlistService } from '../services/playlistService';
import { useAuth } from '../contexts/AuthContext';

export function CreatePlaylistPage() {
  const { playlistId } = useParams<{ playlistId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverArt, setCoverArt] = useState('');
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchPlaylistData = async () => {
      if (playlistId) {
        setIsEditing(true);
        setIsLoading(true);
        try {
          const playlistIdNum = parseInt(playlistId);
          const playlist = await playlistService.getPlaylist(playlistIdNum);
          setTitle(playlist.title);
          setDescription(playlist.description);
          setCoverArt(playlist.coverArt || '');
          setSelectedSongs(playlist.songs);
        } catch (error) {
          console.error('Failed to fetch playlist:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchPlaylistData();
  }, [playlistId]);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.trim()) {
        try {
          const { songs } = await songService.searchSongs(searchQuery);
          setAvailableSongs(songs);
        } catch (error) {
          console.error('Failed to search songs:', error);
        }
      } else {
        setAvailableSongs([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleToggleSong = (song: Song) => {
    if (!song || !song.id) return;
    setSelectedSongs((prev) => {
      const isSelected = prev.some((s) => s && s.id === song.id);
      if (isSelected) {
        return prev.filter((s) => s && s.id !== song.id);
      } else {
        return [...prev, song];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedSongs.length === 0 || !user?.id) return;

    try {
      if (isEditing && playlistId) {
        // Update existing playlist
        const playlistIdNum = parseInt(playlistId);
        await playlistService.updatePlaylist(playlistIdNum, {
          title,
          description,
          privacy: 'public',
        });
      } else {
        // Create new playlist
        await playlistService.createPlaylist({
          title,
          description,
          privacy: 'public',
        });
      }
      navigate('/app/library');
    } catch (error) {
      console.error('Failed to save playlist:', error);
    }
  };

  const isSongSelected = (songId: string) => {
    return selectedSongs.some((s) => s.id === songId);
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-gradient-to-b from-gray-900 to-black text-white p-8 overflow-y-auto pb-32">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 bg-gray-800 rounded w-48 mb-8 animate-pulse" />
          <div className="bg-gray-900 rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <div className="h-4 bg-gray-800 rounded w-32 animate-pulse" />
              <div className="h-10 bg-gray-800 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-800 rounded w-24 animate-pulse" />
              <div className="h-20 bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gradient-to-b from-gray-900 to-black text-white p-8 overflow-y-auto pb-32">
      <div className="max-w-4xl mx-auto">
        <h1 className="mb-8">
          {isEditing ? 'Edit Playlist' : 'Create New Playlist'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-900 rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white">
                Playlist Title *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter playlist title"
                required
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your playlist..."
                className="bg-gray-800 border-gray-700 text-white"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverArt" className="text-white">
                Cover Image URL
              </Label>
              <Input
                id="coverArt"
                value={coverArt}
                onChange={(e) => setCoverArt(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="bg-gray-800 border-gray-700 text-white"
              />
              {coverArt && (
                <div className="mt-2">
                  <img
                    src={coverArt}
                    alt="Cover preview"
                    className="w-32 h-32 rounded object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2>Select Songs *</h2>
              <span className="text-gray-400 text-sm">
                {selectedSongs.length} selected
              </span>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" style={{ left: '8px' }} />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search songs..."
                  style={{ paddingLeft: '32px' }}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableSongs.map((song) => {
                const isSelected = isSongSelected(song.id);
                return (
                  <div
                    key={song.id}
                    className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-green-900/20 border border-green-500/30'
                        : 'hover:bg-gray-800'
                    }`}
                    onClick={() => handleToggleSong(song)}
                  >
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (!song || !song.id) return;
                          setSelectedSongs((prev) => {
                            if (checked) {
                              if (!prev.some((s) => s && s.id === song.id)) {
                                return [...prev, song];
                              }
                              return prev;
                            } else {
                              return prev.filter((s) => s && s.id !== song.id);
                            }
                          });
                        }}
                      />
                    </div>
                    <img
                      src={song.coverArt}
                      alt={song.album}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-white truncate">{song.title}</div>
                      <div className="text-sm text-gray-400 truncate">
                        {song.artist}
                      </div>
                    </div>
                    <div className="text-gray-400 text-sm">
                      {Math.floor(song.duration / 60)}:
                      {(song.duration % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedSongs.length === 0 && availableSongs.length !== 0 && (
              <p className="text-gray-400 text-center py-8">
                Select at least one song
              </p>
            )}
            {availableSongs.length === 0 && (
              <p className="text-gray-400 text-center py-8">
                Search songs to add to your playlist
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={!title.trim() || selectedSongs.length === 0}
              className="bg-green-500 hover:bg-green-600 text-black"
            >
              <Save className="w-4 h-4 mr-2" />
              {isEditing ? 'Save Changes' : 'Create Playlist'}
            </Button>
            <Button
              type="button"
              onClick={() => navigate('/app/library')}
              variant="outline"
              className="border-gray-700"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

