import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Playlist, User } from "../types/index";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { PlaylistCard } from "../components/PlaylistCard";
import { AccountSettings } from "../components/AccountSettings";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { Edit2, Check, X } from "lucide-react"; // X ikonu modal kapatmak için lazım
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { playlistService } from "../services/playlistService";
import { userService } from "../services/userService";
import { useAuth } from "../contexts/AuthContext";

export function ProfilePage() {
  const { username } = useParams<{ username?: string }>();
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuth();
  
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");

  // --- MODAL STATE'LERİ ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"followers" | "following">("followers");
  const [dialogUsers, setDialogUsers] = useState<User[]>([]);
  const [isDialogLoading, setIsDialogLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const targetUsername = username || currentUser.username;
        const fetchedUser = await userService.getUserByUsername(targetUsername);

        setProfileUser(fetchedUser);
        setEditBio(fetchedUser.bio || "");
        setEditAvatar(fetchedUser.avatar || "");

        const allPlaylists = await playlistService.getPlaylists(0, 100);
        setPlaylists(allPlaylists.filter((p) => p.userId === fetchedUser.id));

      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [username, currentUser?.username]);

  const isOwnProfile = !username || username === currentUser?.username;

  // Listeyi açan fonksiyon
  const handleOpenList = async (type: "followers" | "following") => {
    if (!profileUser) return;
    
    setDialogType(type);
    setIsDialogOpen(true);
    setDialogUsers([]);
    setIsDialogLoading(true);

    try {
      const users = type === "followers" 
        ? await userService.getUserFollowers(profileUser.username)
        : await userService.getUserFollowing(profileUser.username);
      
      setDialogUsers(users);
    } catch (error) {
      console.error(`Failed to fetch ${type}:`, error);
    } finally {
      setIsDialogLoading(false);
    }
  };

  const handleUserClickInModal = (targetUserId: string, targetUsername: string) => {
     setIsDialogOpen(false);
     navigate(`/app/user/${targetUsername}`);
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    try {
      await userService.updateCurrentUser({
        bio: editBio,
        avatar_url: editAvatar
      });

      updateUser({ 
        ...currentUser, 
        bio: editBio, 
        avatar: editAvatar 
      });

      setProfileUser(prev => prev ? ({ 
        ...prev, 
        bio: editBio, 
        avatar: editAvatar 
      }) : null);

      setIsEditing(false);
    } catch (error) {
      console.error("Profil güncellenemedi:", error);
    }
  };

  const handleCancelEdit = () => {
    if (profileUser) {
        setEditBio(profileUser.bio);
        setEditAvatar(profileUser.avatar);
    }
    setIsEditing(false);
  };

  const handleFollow = async (userId: string, targetUsername: string) => {
    if (!currentUser || !profileUser) return;
    const isCurrentlyFollowing = currentUser.following.includes(userId);

    const updatedMyFollowing = isCurrentlyFollowing
        ? currentUser.following.filter(id => id !== userId)
        : [...currentUser.following, userId];

    updateUser({ ...currentUser, following: updatedMyFollowing });

    const updatedProfileFollowers = isCurrentlyFollowing
        ? profileUser.followers.filter(id => id !== currentUser.id)
        : [...profileUser.followers, currentUser.id];

    setProfileUser({ ...profileUser, followers: updatedProfileFollowers });

    try {
      if (isCurrentlyFollowing) {
        await userService.unfollowUser(targetUsername);
      } else {
        await userService.followUser(targetUsername);
      }
    } catch (error) {
      console.error("Takip işlemi başarısız:", error);
      updateUser({ ...currentUser, following: currentUser.following });
      setProfileUser({ ...profileUser, followers: profileUser.followers });
    }
  };

  const handleLike = async (playlistId: string) => {
    if (!currentUser?.id) return;
    try {
      const playlistIdNum = parseInt(playlistId);
      const playlist = playlists.find((p) => p.id === playlistIdNum);
      const isLiked = playlist?.likes?.includes(currentUser.id) || false;

      if (isLiked) {
        await playlistService.unlikePlaylist(playlistIdNum);
        setPlaylists((prev) =>
          prev.map((p) => {
             if (p.id === playlistIdNum) {
               const newCount = Math.max(0, (p.likes_count || 0) - 1);
               return { 
                 ...p, 
                 likes: p.likes?.filter((id) => id !== currentUser.id),
                 likes_count: newCount
               };
             }
             return p;
          })
        );
      } else {
        await playlistService.likePlaylist(playlistIdNum);
        setPlaylists((prev) =>
          prev.map((p) => {
             if (p.id === playlistIdNum) {
               const newCount = (p.likes_count || 0) + 1;
               return { 
                 ...p, 
                 likes: [...(p.likes || []), currentUser.id],
                 likes_count: newCount
               };
             }
             return p;
          })
        );
      }
    } catch (error) {
       console.error("Like error", error);
    }
  };

  if (isLoading || !currentUser || !profileUser) {
    return (
      <div className="flex-1 bg-gradient-to-b from-gray-900 to-black text-white overflow-y-auto pb-32">
        <LoadingSkeleton type="avatar" />
      </div>
    );
  }

  const userPlaylists = playlists;
  const isFollowing = currentUser.following?.includes(profileUser.id);

  return (
    <div className="flex-1 bg-gradient-to-b from-gray-900 to-black text-white overflow-y-auto pb-32">
      <div className="bg-gradient-to-b from-green-900/20 to-transparent p-8 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end gap-6">
            <img
              src={profileUser.avatar}
              alt={profileUser.username}
              className="w-48 h-48 rounded-full object-cover shadow-2xl"
            />
            <div className="flex-1 pb-4">
              <p className="text-sm uppercase tracking-wide mb-2">Profile</p>
              <h1 className="mb-4">{profileUser.username}</h1>
              {!isEditing ? (
                <p className="text-gray-300 mb-4">{profileUser.bio}</p>
              ) : (
                <div className="space-y-3 mb-4">
                  <Textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Your bio"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  <Input
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    placeholder="Avatar URL"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              )}
              
              <div className="flex items-center gap-6 text-sm">
                <span>{userPlaylists.length} playlists</span>
                
                <button 
                  onClick={() => handleOpenList("followers")}
                  className="hover:text-green-400 hover:underline transition-colors focus:outline-none"
                >
                  <span className="font-bold">{profileUser.followers.length}</span> followers
                </button>

                <button 
                  onClick={() => handleOpenList("following")}
                  className="hover:text-green-400 hover:underline transition-colors focus:outline-none"
                >
                  <span className="font-bold">{profileUser.following.length}</span> following
                </button>
              </div>

            </div>
          </div>

          <div className="mt-6 flex gap-3">
            {isOwnProfile ? (
              isEditing ? (
                <>
                  <Button
                    onClick={handleSaveProfile}
                    className="bg-green-500 hover:bg-green-600 text-black"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    className="border-gray-700"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="border-gray-700"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )
            ) : (
              <Button
                onClick={() => handleFollow(profileUser.id, profileUser.username)}
                variant={isFollowing ? "outline" : "default"}
                className={
                  isFollowing
                    ? "border border-gray-700 bg-transparent hover:bg-gray-800 text-white"
                    : "bg-green-500 hover:bg-green-600 text-black"
                }
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
             {userPlaylists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {userPlaylists.map((playlist) => (
                    <PlaylistCard
                      key={playlist.id}
                      playlist={playlist}
                      currentUserId={currentUser.id}
                      onLike={handleLike}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-gray-900 rounded-lg p-12 text-center">
                  <p className="text-gray-400">No playlists yet</p>
                </div>
              )}
        </div>
      </div>

      {/* --- CUSTOM MODAL (STANDART CSS/TAILWIND) --- */}
      {isDialogOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setIsDialogOpen(false)} // Dışarı tıklayınca kapanır
        >
          <div 
            className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()} // İçeri tıklayınca kapanmaz
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50">
              <h3 className="text-xl font-bold capitalize text-white">
                {dialogType}
              </h3>
              <button 
                onClick={() => setIsDialogOpen(false)}
                className="p-1 rounded-full hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-2 max-h-[60vh] overflow-y-auto">
              {isDialogLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
                </div>
              ) : dialogUsers.length > 0 ? (
                <div className="space-y-1">
                  {dialogUsers.map((u) => (
                    <div 
                      key={u.id} 
                      className="flex items-center justify-between p-3 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer group"
                      onClick={() => handleUserClickInModal(u.id, u.username)}
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={u.avatar} 
                          alt={u.username} 
                          className="w-10 h-10 rounded-full object-cover border border-gray-700"
                        />
                        <div>
                          <p className="font-medium text-white group-hover:text-green-400 transition-colors">
                            {u.username}
                          </p>
                          {u.bio && (
                            <p className="text-xs text-gray-400 line-clamp-1">{u.bio}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No users found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ------------------------------------------- */}

    </div>
  );
}