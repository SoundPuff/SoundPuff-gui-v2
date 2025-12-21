import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api"; // API servisinizi buradan çağırıyoruz
import { AlertTriangle, Trash2, X, AlertCircle } from "lucide-react";

export function AccountSettings() {
  const [showConfirm, setShowConfirm] = useState(false); // Modalı açıp kapatan state
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { logout } = useAuth(); // Çıkış yapmak için
  const navigate = useNavigate(); // Yönlendirme için

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      //TODO: Henüz endpoint yok.
      await api.delete("/users/me");
      
      // 2. Başarılıysa oturumu kapat ve anasayfaya at
      if (logout) logout();
      navigate("/");
      window.location.reload();
    } catch (err: any) {
      console.error("Hesap silme hatası:", err);
      setError(err.response?.data?.detail || "Hesap silinemedi. Lütfen tekrar deneyin.");
      setIsDeleting(false);
      setShowConfirm(false); // Hata olursa modalı kapat
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h3 className="text-white mb-4">Danger Zone</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-400">
          {error}
        </div>
      )}

      {/* DELETE BUTONU (Buna basınca showConfirm = true olur) */}
      <Button 
        variant="destructive" 
        className="gap-2 bg-red-600 hover:bg-red-700 text-white"
        onClick={() => setShowConfirm(true)}
      >
        <Trash2 className="w-4 h-4" />
        Delete Account
      </Button>

      {/* CUSTOM CONFIRMATION MODAL (Elle yazılmış, kesin çalışır) */}
      {showConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShowConfirm(false)} // Dışarı tıklayınca kapanır
        >
          <div 
            className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()} // İçeri tıklayınca kapanmaz
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Delete Account Permanently
              </h3>
              <button 
                onClick={() => setShowConfirm(false)}
                className="p-1 rounded-full hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-gray-300 text-sm leading-relaxed">
                This action cannot be undone. This will permanently delete your account,
                all your playlists, comments, and remove all your data from our servers.
                <br /><br />
                <span className="font-semibold text-red-400">
                  Are you absolutely sure?
                </span>
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 bg-gray-900/50 border-t border-gray-800">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirm(false)}
                className="border-gray-700 hover:bg-gray-800 text-white"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white border-none"
              >
                {isDeleting ? "Deleting..." : "Yes, delete my account"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}