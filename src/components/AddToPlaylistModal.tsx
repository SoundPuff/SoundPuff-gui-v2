import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { playlistService } from "../services/playlistService";
import { Playlist } from "../types";

export function AddToPlaylistModal({
  onSelect,
  onClose,
}: {
  onSelect: (playlistId: number) => void;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  
  console.log("🔵 AddToPlaylistModal rendered");
  console.log("🔵 User:", user);

  useEffect(() => {
    console.log("🟢 useEffect triggered, user?.id:", user?.id);
    
    if (!user?.id) {
      console.log("🔴 No user ID, returning early");
      return;
    }
    

    const fetchMyPlaylists = async () => {
      console.log("🟡 Fetching playlists...");
      try {
        const all = await playlistService.getPlaylists(0, 100);
        console.log("🟢 All playlists fetched:", all);
        
        const filtered = all.filter(p => p.userId === user.id);
        console.log("🟢 Filtered playlists (user's only):", filtered);
        
        setPlaylists(filtered);
      } catch (err) {
        console.error("🔴 Failed to load playlists", err);
      } finally {
        setLoading(false);
        console.log("🟢 Loading complete");
      }
    };

    fetchMyPlaylists();
  }, [user?.id]);

  console.log("🔵 Current state - loading:", loading, "playlists:", playlists);

  return (
    <div
      className="bg-gray-900 w-[420px] max-w-[90vw] rounded-lg p-6 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >

      <h3 className="text-white mb-4 text-lg font-semibold">
        Add to playlist
      </h3>

      {loading && <div className="text-gray-400">Loading…</div>}

      {!loading && playlists.length === 0 && (
        <div className="text-gray-400">No playlists found</div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {playlists.map(pl => (
          <button
            key={pl.id}
            onClick={() => {
              console.log("🟣 Playlist selected:", pl.id, pl.title);
              onSelect(pl.id);
            }}
            className="w-full px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-left text-white"
          >
            {pl.title}
          </button>
        ))}
      </div>

      <button
        onClick={() => {
          console.log("🟣 Cancel clicked");
          onClose();
        }}
        className="mt-4 w-full text-gray-400 hover:text-white"
      >
        Cancel
      </button>
    </div>
  );
}