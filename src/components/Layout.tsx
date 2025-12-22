import React, { ReactNode, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { MusicPlayer } from "./MusicPlayer";
import { ChatBot } from "./ChatBot";
import { useAuth } from "../contexts/AuthContext";
import { userService } from "../services/userService";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, isAuthenticated, updateUser } = useAuth();

  useEffect(() => {
    const syncUserData = async () => {
      // 1. Kontrol: Kullanıcı giriş yapmış mı?
      if (!isAuthenticated || !user?.username) {
        console.log("🚫 [Layout] Sync atlanıyor. (Auth yok veya Username eksik)");
        return;
      }

      console.log("🔄 [Layout] Sync başlatılıyor... Kullanıcı:", user.username);

      try {
        // 2. API'den verileri çek
        const [followingUsers, likedPlaylists] = await Promise.all([
          userService.getUserFollowing(user.username),
          userService.getUserLikedPlaylists(user.id)
        ]);
        
        console.log("📡 [Layout] API Cevabı - Beğenilen Playlist Sayısı:", likedPlaylists.length);

        const followingIds = followingUsers.map(u => u.id);
        const likedPlaylistIds = likedPlaylists.map(p => p.id.toString()); 

        const currentFollowing = user.following || [];
        const currentLikes = user.likedPlaylists || [];

        const isFollowingDifferent = 
          followingIds.length !== currentFollowing.length || 
          !followingIds.every(id => currentFollowing.includes(id));

        const isLikesDifferent = 
          likedPlaylistIds.length !== currentLikes.length || 
          !likedPlaylistIds.every(id => currentLikes.includes(id));

        if (isFollowingDifferent || isLikesDifferent) {
          console.log("⚡ [Layout] User Context güncelleniyor!", {
            eskiLikeSayisi: currentLikes.length,
            yeniLikeSayisi: likedPlaylistIds.length
          });

          updateUser({
            ...user,
            following: isFollowingDifferent ? followingIds : currentFollowing,
            likedPlaylists: isLikesDifferent ? likedPlaylistIds : currentLikes
          });
        } else {
            console.log("✅ [Layout] Veriler zaten güncel, güncelleme yapılmadı.");
        }

      } catch (error) {
        console.error("❌ [Layout] Sync Hatası:", error);
      }
    };

    syncUserData();
  }, [isAuthenticated, user?.username]); 

  return (
    // Yapı aynen korundu: flex-col
    <div className="flex flex-col min-h-screen bg-black dark:bg-gray-950">
      <Sidebar currentUser={user} />
      
      {/* ✅ GÜNCELLEME: 
         İçerik alanına 'pb-24' eklendi.
         Böylece sayfa içeriği MusicPlayer'ın arkasında kalmaz.
      */}
      <div className="flex flex-1 flex-col overflow-hidden pb-24">
        {children}
      </div>

      {/* MusicPlayer en altta ve sabit (fixed) */}
      <MusicPlayer />
      
      {isAuthenticated && <ChatBot />}
    </div>
  );
}