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
  
  // Profilde görüntülenen kullanıcı
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      // Eğer kullanıcı login değilse bekleme
      if (!currentUser) return;

      setIsLoading(true);
      try {
        // Hangi kullanıcıyı çekeceğiz? URL'deki username veya kendi username'imiz
        const targetUsername = username || currentUser.username;

        // 1. Kullanıcı detaylarını (Followers/Following dahil) çek
        // userService.ts içinde Promise.all ile 3 endpointi birleştiriyoruz.
        const fetchedUser = await userService.getUserByUsername(targetUsername);

        setProfileUser(fetchedUser);
        setEditBio(fetchedUser.bio || "");
        setEditAvatar(fetchedUser.avatar || "");

        // 2. Playlistleri çek
        const allPlaylists = await playlistService.getPlaylists(0, 100);
        setPlaylists(allPlaylists.filter((p) => p.userId === fetchedUser.id));

      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [username, currentUser?.username]); // Dependency updated

  const isOwnProfile = !username || username === currentUser?.username;

  if (!currentUser || !profileUser) {
    return null; // veya loading spinner
  }

  // Takip durumu kontrolü (currentUser'ın following listesinde var mı?)
  const isFollowing = currentUser.following?.includes(profileUser.id);
  const userPlaylists = playlists; // Zaten filtreleyip state'e attık

  // ----------------------------------------------------------------
  // GÜNCELLENEN KISIM: Profil Kaydetme
  // ----------------------------------------------------------------
  const handleSaveProfile = async () => {
    if (!currentUser) return;

    try {
      // 1. Backend'e PUT isteği at (username ve id gönderilmez, sadece değişenler)
      await userService.updateCurrentUser({
        bio: editBio,
        avatar_url: editAvatar
      });

      // 2. Context'i güncelle (Uygulama genelinde avatar değişsin)
      updateUser({ 
        ...currentUser, 
        bio: editBio, 
        avatar: editAvatar 
      });

      // 3. Mevcut sayfa state'ini güncelle
      setProfileUser({ 
        ...profileUser, 
        bio: editBio, 
        avatar: editAvatar 
      });

      setIsEditing(false);
    } catch (error) {
      console.error("Profil güncellenemedi:", error);
      alert("Profil güncellenirken bir hata oluştu.");
    }
  };

  const handleCancelEdit = () => {
    setEditBio(profileUser.bio);
    setEditAvatar(profileUser.avatar);
    setIsEditing(false);
  };

  // ----------------------------------------------------------------
  // GÜNCELLENEN KISIM: Takip Etme (Sayıların Anlık Güncellenmesi)
  // ----------------------------------------------------------------
  const handleFollow = async (userId: string, targetUsername: string) => {
    if (!currentUser) return;

    const isCurrentlyFollowing = currentUser.following.includes(userId);

    // OPTIMISTIC UPDATE BAŞLANGIÇ
    
    // 1. Sizin (Current User) following listenizi güncelleyin
    const updatedMyFollowing = isCurrentlyFollowing
        ? currentUser.following.filter(id => id !== userId)
        : [...currentUser.following, userId];

    updateUser({ ...currentUser, following: updatedMyFollowing });

    // 2. Profildeki Kullanıcının (Profile User) followers listesini güncelleyin
    // Eğer kendi profilinizdeyseniz (isOwnProfile) bu mantık değişebilir ama
    // genelde başkasının profilindeyken takip edersiniz.
    const updatedProfileFollowers = isCurrentlyFollowing
        ? profileUser.followers.filter(id => id !== currentUser.id)
        : [...profileUser.followers, currentUser.id];

    setProfileUser({ ...profileUser, followers: updatedProfileFollowers });

    try {
      // API İsteği
      if (isCurrentlyFollowing) {
        await userService.unfollowUser(targetUsername);
      } else {
        await userService.followUser(targetUsername);
      }
    } catch (error) {
      console.error("Takip işlemi başarısız:", error);
      // Hata durumunda Rollback (Geri alma)
      updateUser({ ...currentUser, following: currentUser.following });
      setProfileUser({ ...profileUser, followers: profileUser.followers });
    }
  };

  // Playlist Like işlemleri (Değişmedi, aynen kalabilir)
  const handleLike = async (playlistId: string) => {
    // ... (Mevcut kodunuzdaki handleLike içeriği)
    if (!currentUser?.id) return;
    try {
      const playlistIdNum = parseInt(playlistId);
      const playlist = playlists.find((p) => p.id === playlistIdNum);
      // Not: Backend likes array dönmüyorsa burada yine optimistic update hatası olabilir.
      // SearchPage.tsx için yaptığımız düzeltmenin aynısını buraya da uygulamanız gerekebilir.
      const isLiked = playlist?.likes?.includes(currentUser.id) || false;

      if (isLiked) {
        await playlistService.unlikePlaylist(playlistIdNum);
        setPlaylists((prev) =>
          prev.map((p) => {
             if (p.id === playlistIdNum) {
               // Like count güncelleme
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

  if (isLoading) {
    return (
      <div className="flex-1 bg-gradient-to-b from-gray-900 to-black text-white overflow-y-auto pb-32">
        <LoadingSkeleton type="avatar" /> {/* Basit skeleton örneği */}
      </div>
    );
  }

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
                {/* DÜZELTME: Artık doğru sayılar görünecek */}
                <span>{profileUser.followers.length} followers</span>
                <span>{profileUser.following.length} following</span>
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
             {/* Playlist listeleme kısmı aynı kalabilir */}
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
    </div>
  );
}