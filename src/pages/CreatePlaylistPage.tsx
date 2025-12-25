import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Song, Playlist } from "../types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { Plus, X, Save, Search, Upload } from "lucide-react";
import { Checkbox } from "../components/ui/checkbox";
import { songService } from "../services/songService";
import { playlistService } from "../services/playlistService";
import { useAuth } from "../contexts/AuthContext";

const CLOUD_NAME = "ddknfnvis";
const UPLOAD_PRESET = "soundpuff_preset";

export function CreatePlaylistPage() {
  const [coverImage, setCoverImage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { playlistId } = useParams<{ playlistId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatePlaylistHovered, setIsCreatePlaylistHovered] = useState(false);
  const [isCancelHovered, setIsCancelHovered] = useState(false);

  useEffect(() => {
    const fetchPlaylistData = async () => {
      if (playlistId) {
        setIsEditing(true);
        setIsLoading(true);
        try {
          const playlistIdNum = parseInt(playlistId);
          const playlist = await playlistService.getPlaylist(playlistIdNum);
          setTitle(playlist.title);
          setDescription(playlist.description || "");
          setCoverImage(playlist.cover_image_url || "");
          setSelectedSongs(playlist.songs);
        } catch (error) {
          console.error("Failed to fetch playlist:", error);
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
          console.error("Failed to search songs:", error);
        }
      } else {
        setAvailableSongs([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // --- File upload handlers (Cloudinary) ---
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        setCoverImage(data.secure_url);
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      console.error("Cover upload failed:", err);
      alert("Image upload failed");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

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

    const payload = {
      title,
      description: description || null,
      privacy: "public" as const, // ✅ FIX
      cover_image_url: coverImage || null,
      song_ids: selectedSongs.map((s) => Number(s.id)),
    };


    try {
      if (isEditing && playlistId) {
        await playlistService.updatePlaylist(Number(playlistId), payload);
      } else {
        await playlistService.createPlaylist(payload);
      }

      navigate("/app/library");
    } catch (error) {
      console.error("Failed to save playlist:", error);
    }
  };


  const isSongSelected = (songId: string) => {
    return selectedSongs.some((s) => s.id === songId);
  };

  if (isLoading) {
    return (
      <div
        className="flex-1 text-white p-8 overflow-y-auto pb-32"
        style={{
          background: `
          radial-gradient(circle at 0% 0%, rgba(231, 140, 137, 0.15), transparent 30%),
          radial-gradient(circle at 100% 0%, rgba(231, 140, 137, 0.15), transparent 30%),
          radial-gradient(circle at 0% 100%, rgba(231, 140, 137, 0.15), transparent 30%),
          radial-gradient(circle at 100% 100%, rgba(231, 140, 137, 0.15), transparent 30%),
          black
        `,
        }}
      >
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
    <div
      className="flex-1 text-white p-8 overflow-y-auto pb-32"
      style={{
        background: `
          radial-gradient(circle at 0% 0%, rgba(231, 140, 137, 0.15), transparent 30%),
          radial-gradient(circle at 100% 0%, rgba(231, 140, 137, 0.15), transparent 30%),
          radial-gradient(circle at 0% 100%, rgba(231, 140, 137, 0.15), transparent 30%),
          radial-gradient(circle at 100% 100%, rgba(231, 140, 137, 0.15), transparent 30%),
          black
        `,
      }}
    >
      <div className="max-w-4xl mx-auto">
        <h1
          className="text-white mb-4 text-4xl font-bold"
          style={{
            color: "#d95a96",
            WebkitTextStroke: "0.5px #5b0425",
          }}
        >
          {isEditing ? "Edit Playlist" : "Create New Playlist"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            className="bg-gray-900 rounded-lg p-6 space-y-6"
            style={{ outline: "3px solid #DB77A6" }}
          >
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white">
                Playlist Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter playlist title"
                required
                className="bg-gray-800 border-gray-700 text-white"
                style={{ outline: "1px solid #DB77A6" }}
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
                style={{ outline: "1px solid #DB77A6" }}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Playlist Cover</Label>

              <div
                className={`relative w-40 h-40 rounded-lg overflow-hidden border-2 border-dashed ${isDragging ? 'border-pink scale-105' : 'border-gray-600'} transition-all cursor-pointer`}
                onClick={triggerFileInput}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt="Playlist cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Upload className="w-8 h-8 mb-2" />
                    <span className="text-sm">Upload cover</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">Change Image</span>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          </div>

          <div
            className="bg-gray-900 rounded-lg p-6"
            style={{ outline: "3px solid #DB77A6" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2>Select Songs</h2>
              <span className="text-gray-400 text-sm">
                {selectedSongs.length} selected
              </span>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search
                  className="absolute top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
                  style={{ left: "8px" }}
                />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search songs..."
                  style={{ outline: "1px solid #DB77A6", paddingLeft: "32px" }}
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
                      !isSelected ? "hover:bg-gray-800" : ""
                    }`}
                    onClick={() => handleToggleSong(song)}
                    style={
                      isSelected
                        ? {
                            backgroundColor: "rgba(51, 172, 227, 0.2)",
                            border: "1px solid rgba(51, 172, 227, 0.3)",
                          }
                        : undefined
                    }
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
                      {(song.duration % 60).toString().padStart(2, "0")}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedSongs.length === 0 && availableSongs.length !== 0 && (
              <p
                className="text-white text-center py-4"
                style={{
                  WebkitTextStroke: "0.5px #d95a96",
                }}
              >
                Select at least one song
              </p>
            )}
            {availableSongs.length === 0 && (
              <p
                className="text-white text-center py-8"
                style={{
                  WebkitTextStroke: "0.5px #d95a96",
                }}
              >
                Select at least one song
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={!title.trim() || selectedSongs.length === 0}
              className="text-black"
              onMouseEnter={() => setIsCreatePlaylistHovered(true)}
              onMouseLeave={() => setIsCreatePlaylistHovered(false)}
              style={{
                backgroundColor: isCreatePlaylistHovered
                  ? "#D95A96"
                  : "#DB77A6",
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              {isEditing ? "Save Changes" : "Create Playlist"}
            </Button>
            <Button
              type="button"
              onClick={() => navigate("/app/library")}
              onMouseEnter={() => setIsCancelHovered(true)}
              onMouseLeave={() => setIsCancelHovered(false)}
              style={{
                backgroundColor: isCancelHovered ? "#DB77A6" : "transparent",
                color: isCancelHovered ? "black" : "#DB77A6",
                borderColor: "#D95A96",
                borderWidth: "1px",
              }}
            >
              <X className="w-5 h-5 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
