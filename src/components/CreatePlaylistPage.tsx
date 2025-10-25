import { useState, useEffect } from 'react';
import { Song, Playlist } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Plus, X, Save } from 'lucide-react';
import { Checkbox } from './ui/checkbox';

interface CreatePlaylistPageProps {
  availableSongs: Song[];
  onSave: (title: string, description: string, selectedSongs: Song[], coverArt: string) => void;
  onCancel: () => void;
  editingPlaylist?: Playlist;
}

export function CreatePlaylistPage({
  availableSongs,
  onSave,
  onCancel,
  editingPlaylist,
}: CreatePlaylistPageProps) {
  const [title, setTitle] = useState(editingPlaylist?.title || '');
  const [description, setDescription] = useState(editingPlaylist?.description || '');
  const [coverArt, setCoverArt] = useState(editingPlaylist?.coverArt || '');
  const [selectedSongs, setSelectedSongs] = useState<Song[]>(editingPlaylist?.songs || []);

  const handleToggleSong = (song: Song) => {
    setSelectedSongs((prev) => {
      const isSelected = prev.some((s) => s.id === song.id);
      if (isSelected) {
        return prev.filter((s) => s.id !== song.id);
      } else {
        return [...prev, song];
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && selectedSongs.length > 0) {
      onSave(title, description, selectedSongs, coverArt);
    }
  };

  const isSongSelected = (songId: string) => {
    return selectedSongs.some((s) => s.id === songId);
  };

  return (
    <div className="flex-1 bg-gradient-to-b from-gray-900 to-black text-white p-8 overflow-y-auto pb-32">
      <div className="max-w-4xl mx-auto">
        <h1 className="mb-8">{editingPlaylist ? 'Edit Playlist' : 'Create New Playlist'}</h1>

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
                  <img src={coverArt} alt="Cover preview" className="w-32 h-32 rounded object-cover" />
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2>Select Songs *</h2>
              <span className="text-gray-400 text-sm">{selectedSongs.length} selected</span>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableSongs.map((song) => {
                const isSelected = isSongSelected(song.id);
                return (
                  <div
                    key={song.id}
                    className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-green-900/20 border border-green-500/30' : 'hover:bg-gray-800'
                    }`}
                    onClick={() => handleToggleSong(song)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleSong(song)}
                      className="pointer-events-none"
                    />
                    <img src={song.coverArt} alt={song.album} className="w-12 h-12 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white truncate">{song.title}</div>
                      <div className="text-sm text-gray-400 truncate">{song.artist}</div>
                    </div>
                    <div className="text-gray-400 text-sm">
                      {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedSongs.length === 0 && (
              <p className="text-gray-400 text-center py-8">Select at least one song</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={!title.trim() || selectedSongs.length === 0}
              className="bg-green-500 hover:bg-green-600 text-black"
            >
              <Save className="w-4 h-4 mr-2" />
              {editingPlaylist ? 'Save Changes' : 'Create Playlist'}
            </Button>
            <Button type="button" onClick={onCancel} variant="outline" className="border-gray-700">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
