import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Playlist, User } from "../types/index";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { PlaylistCard } from "../components/PlaylistCard";
import { AccountSettings } from "../components/AccountSettings";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { Edit2, Check, X, Search, Upload } from "lucide-react"; 
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { playlistService } from "../services/playlistService";
import { userService } from "../services/userService";
import { useAuth } from "../contexts/AuthContext";

//profil fotoğrafları buraya kaydolup buradan çekilecek
const CLOUD_NAME = "ddknfnvis"; 
const UPLOAD_PRESET = "soundpuff_preset";

export function ProfilePage() {
  const { username } = useParams<{ username?: string }>();
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuth();
  
  // --- TEMEL STATE'LER ---
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- EDİT STATE'LERİ ---
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");

  // --- DOSYA SEÇİMİ İÇİN REF ---
  // Bu ref, gizli input elementini tetiklemek için kullanılır
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- TABS İÇİN STATE'LER ---
  const [followersList, setFollowersList] = useState<User[]>([]);
  const [followingList, setFollowingList] = useState<User[]>([]);
  const [followersSearch, setFollowersSearch] = useState('');
  const [followingSearch, setFollowingSearch] = useState('');

  // --- MODAL STATE'LERİ ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"followers" | "following">("followers");
  const [dialogUsers, setDialogUsers] = useState<User[]>([]);
  const [isDialogLoading, setIsDialogLoading] = useState(false);

  const isOwnProfile = !username || (currentUser && username === currentUser.username);

  // --- VERİ ÇEKME ---
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

        if (targetUsername === currentUser.username) {
            const [followersData, followingData] = await Promise.all([
                userService.getUserFollowers(targetUsername),
                userService.getUserFollowing(targetUsername)
            ]);
            setFollowersList(followersData);
            setFollowingList(followingData);
        }

      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [username, currentUser?.username]);

  const filteredFollowers = followersList.filter((u) =>
    u.username.toLowerCase().includes(followersSearch.toLowerCase())
  );
  const filteredFollowing = followingList.filter((u) =>
    u.username.toLowerCase().includes(followingSearch.toLowerCase())
  );

  // --- DOSYA İŞLEME FONKSİYONLARI ---
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // 1. Dosya kontrolü
    if (!file.type.startsWith("image/")) {
      alert("Lütfen geçerli bir resim dosyası seçin.");
      return;
    }

    // Yükleniyor efekti için loading state'i açabilirsin istersen
    // setIsUploading(true); 

    // 2. Form verisi oluşturma
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      // 3. Cloudinary'ye istek atma
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        setEditAvatar(data.secure_url);
        console.log("Yüklenen resim linki:", data.secure_url);
      } else {
        throw new Error("Resim yüklenemedi");
      }

    } catch (error) {
      console.error("Upload hatası:", error);
      alert("Resim yüklenirken bir hata oluştu.");
    } finally {
      // setIsUploading(false);
    }
  };


  // Gizli input'a tıklatmayı tetikleyen yardımcı fonksiyon
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleOpenListModal = async (type: "followers" | "following") => {
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

  const handleUserClick = (targetUserId: string, targetUsername: string) => {
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
      updateUser({ ...currentUser, bio: editBio, avatar: editAvatar });
      setProfileUser(prev => prev ? ({ ...prev, bio: editBio, avatar: editAvatar }) : null);
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

  // --- TAKİP FONKSİYONU ---
  const handleFollow = async (userId: string, targetUsername: string) => {
    if (!currentUser || !profileUser) return;
    const isCurrentlyFollowing = currentUser.following.includes(userId);

    const updatedMyFollowing = isCurrentlyFollowing
        ? currentUser.following.filter(id => id !== userId)
        : [...currentUser.following, userId];

    updateUser({ ...currentUser, following: updatedMyFollowing });

    if (isOwnProfile) {
        const updatedProfileFollowingIds = isCurrentlyFollowing
            ? profileUser.following.filter(id => id !== userId)
            : [...profileUser.following, userId];
        
        setProfileUser({
            ...profileUser,
            following: updatedProfileFollowingIds
        });

        if (isCurrentlyFollowing) {
            setFollowingList(prev => prev.filter(u => u.id !== userId));
        } else {
            const userToAdd = followersList.find(u => u.id === userId);
            if (userToAdd) {
                setFollowingList(prev => [...prev, userToAdd]);
            }
        }
    } else {
        if (profileUser.id === userId) {
            const updatedProfileFollowers = isCurrentlyFollowing
                ? profileUser.followers.filter(id => id !== currentUser.id)
                : [...profileUser.followers, currentUser.id];
            setProfileUser({ ...profileUser, followers: updatedProfileFollowers });
        }
    }

    try {
      if (isCurrentlyFollowing) {
        await userService.unfollowUser(targetUsername);
      } else {
        await userService.followUser(targetUsername);
      }
      
      if (isOwnProfile && !isCurrentlyFollowing) {
          const newFollowing = await userService.getUserFollowing(currentUser.username);
          setFollowingList(newFollowing);
      }

    } catch (error) {
      console.error("Takip işlemi başarısız:", error);
      updateUser({ ...currentUser, following: currentUser.following });
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
            
            {/* --- AVATAR GÖRÜNTÜLEME --- */}
            <div className="relative group">
                <img
                  src={isEditing ? (editAvatar || profileUser.avatar) : profileUser.avatar}
                  alt={profileUser.username}
                  // Edit modundaysa, resme tıklanınca dosya seçici açılır
                  onClick={() => isEditing && triggerFileInput()}
                  className={`w-48 h-48 rounded-full object-cover shadow-2xl bg-gray-800 ${
                    isEditing ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''
                  }`}
                />
                
                {/* Overlay: Resmin üzerine gelince "Upload" ikonu çıkar */}
                {isEditing && (
                    <div 
                        className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={triggerFileInput}
                    >
                        <Upload className="w-8 h-8 text-white" />
                    </div>
                )}
            </div>

            <div className="flex-1 pb-4">
              <p className="text-sm uppercase tracking-wide mb-2">Profile</p>
              <h1 className="mb-2">{profileUser.username}</h1>
              
              {!isEditing ? (
                <p className="text-gray-300 mb-4">{profileUser.bio}</p>
              ) : (
                <div className="space-y-4 mb-4 max-w-lg">
                  
                  {/* --- INSTAGRAM TARZI DEĞİŞTİRME BUTONU --- */}
                  <div className="flex flex-col items-start">
                    {/* Bu yazıya tıklanınca da dosya seçici açılır */}
          <button 
            type="button"
            onClick={triggerFileInput}
            className="text-pink font-bold text-sm hover:text-[#5b0426] transition-colors cursor-pointer"
          >
                        Change Profile Photo
                    </button>
                    
                    {/* GİZLİ INPUT (Tüm tıklamalar burayı tetikler) */}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileInput}
                    />
                  </div>
                  {/* ----------------------------------------- */}

                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-medium ml-1 uppercase">Bio</label>
                    <Textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Write something about yourself..."
                      className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
                    />
                  </div>

                </div>
              )}
              
              <div className="flex items-center gap-6 text-sm">
                <span>{userPlaylists.length} playlists</span>
                
                {isOwnProfile ? (
                    <>
                        <span>{profileUser.followers.length} followers</span>
                        <span>{profileUser.following.length} following</span>
                    </>
                ) : (
                    <>
                        <button 
                        onClick={() => handleOpenListModal("followers")}
                        className="hover:text-[#5b0426] hover:underline transition-colors focus:outline-none"
                        >
                        <span className="font-bold">{profileUser.followers.length}</span> followers
                        </button>

                        <button 
                        onClick={() => handleOpenListModal("following")}
                        className="hover:text-[#5b0426] hover:underline transition-colors focus:outline-none"
                        >
                        <span className="font-bold">{profileUser.following.length}</span> following
                        </button>
                    </>
                )}
              </div>

            </div>
          </div>

          <div className="mt-6 flex gap-3">
            {isOwnProfile ? (
              isEditing ? (
                <>
                  <Button
                    onClick={handleSaveProfile}
                    className="bg-pink hover:bg-[#5b0426] text-black"
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
                      : "bg-pink hover:bg-[#5b0426] text-black"
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
              <TabsList className="mb-6 bg-transparent border-b border-gray-800 rounded-none w-full justify-start h-auto p-0">
                <TabsTrigger 
                  value="playlists"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-pink data-[state=active]:bg-transparent px-6 py-3"
                >
                  Playlists
                </TabsTrigger>
                <TabsTrigger 
                  value="followers"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-pink data-[state=active]:bg-transparent px-6 py-3"
                >
                  Followers
                </TabsTrigger>
                <TabsTrigger 
                  value="following"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-pink data-[state=active]:bg-transparent px-6 py-3"
                >
                  Following
                </TabsTrigger>
                <TabsTrigger 
                  value="settings"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-pink data-[state=active]:bg-transparent px-6 py-3"
                >
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="playlists" className="mt-6">
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
              </TabsContent>

              <TabsContent value="followers" className="mt-6">
                <div className="max-w-2xl mx-auto space-y-4">
                  <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <Input
                      value={followersSearch}
                      onChange={(e) => setFollowersSearch(e.target.value)}
                      placeholder="Search followers..."
                      className="pl-10 bg-gray-900 border-gray-800 text-white rounded-lg focus:ring-1 focus:ring-pink h-10"
                    />
                  </div>
                  {filteredFollowers.length > 0 ? (
                    <div className="space-y-1">
                      {filteredFollowers.map((follower) => {
                        const isFollowingBack = currentUser.following.includes(follower.id);
                        return (
                          <div
                            key={follower.id}
                            className="flex items-center justify-between py-2 px-2 hover:bg-gray-900 rounded-lg transition-colors"
                          >
                            <div
                              className="flex items-center gap-3 flex-1 cursor-pointer"
                              onClick={() => handleUserClick(follower.id, follower.username)}
                            >
                              <img
                                src={follower.avatar}
                                alt={follower.username}
                                className="w-10 h-10 rounded-full object-cover bg-gray-800"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate hover:underline">
                                  {follower.username}
                                </p>
                                {follower.bio && (
                                  <p className="text-xs text-gray-400 truncate max-w-[200px]">{follower.bio}</p>
                                )}
                              </div>
                            </div>
                            <Button
                                onClick={() => handleFollow(follower.id, follower.username)}
                                variant={isFollowingBack ? "secondary" : "default"}
                                size="sm"
                                className={`ml-4 h-8 px-5 text-xs font-semibold ${
                                    isFollowingBack 
                                    ? "bg-gray-800 text-white hover:bg-gray-700" 
                  : "bg-pink hover:bg-[#5b0426] text-black"
                                }`}
                            >
                                {isFollowingBack ? "Following" : "Follow"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-400">
                        {followersSearch ? 'No followers found' : 'No followers yet'}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="following" className="mt-6">
                <div className="max-w-2xl mx-auto space-y-4">
                  <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <Input
                      value={followingSearch}
                      onChange={(e) => setFollowingSearch(e.target.value)}
                      placeholder="Search following..."
                      className="pl-10 bg-gray-900 border-gray-800 text-white rounded-lg focus:ring-1 focus:ring-pink h-10"
                    />
                  </div>
                  {filteredFollowing.length > 0 ? (
                    <div className="space-y-1">
                      {filteredFollowing.map((followedUser) => (
                        <div
                          key={followedUser.id}
                          className="flex items-center justify-between py-2 px-2 hover:bg-gray-900 rounded-lg transition-colors"
                        >
                          <div
                            className="flex items-center gap-3 flex-1 cursor-pointer"
                            onClick={() => handleUserClick(followedUser.id, followedUser.username)}
                          >
                            <img
                              src={followedUser.avatar}
                              alt={followedUser.username}
                              className="w-10 h-10 rounded-full object-cover bg-gray-800"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate hover:underline">
                                {followedUser.username}
                              </p>
                              {followedUser.bio && (
                                <p className="text-xs text-gray-400 truncate max-w-[200px]">{followedUser.bio}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleFollow(followedUser.id, followedUser.username)}
                            variant="secondary"
                            size="sm"
                            className="ml-4 h-8 px-5 text-xs font-semibold bg-gray-800 text-white hover:bg-gray-700"
                          >
                            Following
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-400">
                        {followingSearch ? 'No users found' : 'Not following anyone yet'}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="settings" className="mt-6">
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

      {isDialogOpen && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold capitalize">
                {dialogType}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                 Viewing list of {dialogType}.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              {isDialogLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink" />
                </div>
              ) : dialogUsers.length > 0 ? (
                dialogUsers.map((u) => (
                  <div 
                    key={u.id} 
                    className="flex items-center justify-between p-2 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                    onClick={() => handleUserClick(u.id, u.username)}
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={u.avatar} 
                        alt={u.username} 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-white">{u.username}</p>
                        {u.bio && (
                          <p className="text-xs text-gray-400 line-clamp-1">{u.bio}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 py-4">
                  No users found.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}