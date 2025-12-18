import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Playlist, User } from "../types/index";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { PlaylistCard } from "../components/PlaylistCard";
import { AccountSettings } from "../components/AccountSettings";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { Edit2, Check, X } from "lucide-react";
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
  const [user, setUser] = useState<User | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      console.log(username);

      setIsLoading(true);
      try {
        const profileUser =
          username && username !== currentUser.username
            ? await userService.getUserByUsername(username)
            : currentUser;

        setUser(profileUser);
        setEditBio(profileUser.bio);
        setEditAvatar(profileUser.avatar);

        // Fetch user's playlists
        const allPlaylists = await playlistService.getPlaylists(0, 100);
        setPlaylists(allPlaylists.filter((p) => p.userId === profileUser.id));
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [username, currentUser]);

  const isOwnProfile = !username || username === currentUser?.username;

  if (!currentUser || !user) {
    return null;
  }

  const isFollowing = currentUser.following.includes(user.id);
  const userPlaylists = playlists.filter((p) => p.userId === user.id);

  const handleSaveProfile = () => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, bio: editBio, avatar: editAvatar };
    updateUser(updatedUser);
    setUser(updatedUser);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditBio(user.bio);
    setEditAvatar(user.avatar);
    setIsEditing(false);
  };

  const handlePlaylistClick = (playlistId: string) => {
    navigate(`/app/playlist/${playlistId}`);
  };

  const handleUserClick = (userId: string) => {
    if (!userId) {
      navigate("/app/search");
      return;
    }
    navigate(`/app/user/${userId}`);
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
              return {
                ...p,
                likes: p.likes?.filter((id) => id !== currentUser.id),
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
              return {
                ...p,
                likes: [...(p.likes || []), currentUser.id],
              };
            }
            return p;
          })
        );
      }
    } catch (error) {
      console.error("Failed to like/unlike playlist:", error);
    }
  };

  const handleFollow = async (userId: string, username: string) => {
    if (!currentUser) return;

    const isCurrentlyFollowing = currentUser.following.includes(userId);

    try {
      if (isCurrentlyFollowing) {
        await userService.unfollowUser(username);
      } else {
        await userService.followUser(username);
      }

      const updatedFollowingList = isCurrentlyFollowing
        ? currentUser.following.filter((id) => id !== userId)
        : [...currentUser.following, userId];

      updateUser({
        ...currentUser,
        following: updatedFollowingList,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail;

      if (errorMessage === "Already following this user") {
        if (!currentUser.following.includes(userId)) {
          updateUser({
            ...currentUser,
            following: [...currentUser.following, userId],
          });
        }
      } else if (errorMessage === "You are not following this user") {
        updateUser({
          ...currentUser,
          following: currentUser.following.filter((id) => id !== userId),
        });
      } else {
        console.error("Follow operation failed:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-gradient-to-b from-gray-900 to-black text-white overflow-y-auto pb-32">
        <div className="bg-gradient-to-b from-green-900/20 to-transparent p-8 pb-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end gap-6">
              <LoadingSkeleton type="avatar" />
              <div className="flex-1 pb-4 space-y-4">
                <div className="h-4 bg-gray-800 rounded w-24 animate-pulse" />
                <div className="h-8 bg-gray-800 rounded w-48 animate-pulse" />
                <div className="h-4 bg-gray-800 rounded w-64 animate-pulse" />
                <div className="flex gap-6">
                  <div className="h-4 bg-gray-800 rounded w-20 animate-pulse" />
                  <div className="h-4 bg-gray-800 rounded w-24 animate-pulse" />
                  <div className="h-4 bg-gray-800 rounded w-20 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <LoadingSkeleton type="playlist" count={4} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gradient-to-b from-gray-900 to-black text-white overflow-y-auto pb-32">
      <div className="bg-gradient-to-b from-green-900/20 to-transparent p-8 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end gap-6">
            <img
              src={user.avatar}
              alt={user.username}
              className="w-48 h-48 rounded-full object-cover shadow-2xl"
            />
            <div className="flex-1 pb-4">
              <p className="text-sm uppercase tracking-wide mb-2">Profile</p>
              <h1 className="mb-4">{user.username}</h1>
              {!isEditing ? (
                <p className="text-gray-300 mb-4">{user.bio}</p>
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
                <span>{user.followers.length} followers</span>
                <span>{user.following.length} following</span>
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
                onClick={() => handleFollow(user.id, user.username)}
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
          {isOwnProfile ? (
            <Tabs defaultValue="playlists" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="playlists">Playlists</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="playlists">
                {userPlaylists.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {userPlaylists.map((playlist) => (
                      <PlaylistCard
                        key={playlist.id}
                        playlist={playlist}
                        user={user}
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
              </TabsContent>
              <TabsContent value="settings">
                <AccountSettings />
              </TabsContent>
            </Tabs>
          ) : (
            <>
              <h2 className="mb-6">Playlists</h2>
              {userPlaylists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {userPlaylists.map((playlist) => (
                    <PlaylistCard
                      key={playlist.id}
                      playlist={playlist}
                      user={user}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
