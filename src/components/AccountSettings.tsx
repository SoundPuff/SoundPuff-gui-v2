import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button"; 
import { useAuth } from "../contexts/AuthContext";
import { userService } from "../services/userService"; 
import { AlertTriangle, Trash2, X } from "lucide-react";

export function AccountSettings() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isDeleteHovered, setIsDeleteHovered] = useState(false);
  
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await userService.deleteCurrentUser();
      
      if (logout) {
        logout();
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
      
      navigate("/login");
    } catch (err: any) {
      console.error("Hesap silme hatası:", err);
      setError(err.message || "Hesap silinemedi. Lütfen tekrar deneyin.");
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 mt-6 border border-red-900/30"
    style={{ outline: "3px solid #DB77A6" }}>
      <div className="flex items-start justify-between">
        <div>
           <h2 className="text-white mb-1"
           style={{  
              WebkitTextStroke: '0.75px #5b0425'
            }}>Danger Zone</h2>
           <h4 className="text-gray-400 text-sm"
           style={{ 
              color: '#d95a96', 
              WebkitTextStroke: '0.5px #5b0425'
            }}>
             Permanently remove your Personal Account and all of its contents.
           </h4>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button 
            className="gap-2 text-white"
            onClick={() => setShowConfirm(true)}
            onMouseEnter={() => setIsDeleteHovered(true)}
            onMouseLeave={() => setIsDeleteHovered(false)}
            style={{
              backgroundColor: isDeleteHovered ? '#ff0e0e' : '#ff3e3e',
            }}
        >
            <Trash2 className="w-4 h-4" />
            Delete Account
        </Button>
      </div>

      {/* CONFIRMATION MODAL - KÜÇÜLTÜLMÜŞ VERSİYON */}
      {showConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShowConfirm(false)}
        >
          <div 
            // GÜNCELLEME: max-w-sm (daha dar), max-h-[90vh] (ekrandan taşmaz), overflow-y-auto (scroll olur)
            className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Padding azaltıldı (p-3) */}
            <div className="flex items-center justify-between p-3 border-b border-gray-800 bg-gray-900/50">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Delete Account
              </h3>
              <button 
                onClick={() => setShowConfirm(false)}
                className="p-1 rounded-full hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-white" />
              </button>
            </div>

            {/* Body - Padding azaltıldı (p-4) */}
            <div className="p-4">
              <p className="text-gray-300 text-sm leading-relaxed">
                This will permanently delete your account, playlists, and remove all data.
                <br /><br />
                <span className="font-semibold text-red-400">
                  Are you absolutely sure?
                </span>
              </p>
            </div>

            {/* Footer - Padding azaltıldı (p-3) */}
            <div className="flex justify-end gap-2 p-3 bg-gray-900/50 border-t border-gray-800">
              <Button 
                variant="outline" 
                size="sm" // Buton boyutu küçüldü
                onClick={() => setShowConfirm(false)}
                className="border-gray-700 hover:bg-gray-800 text-white h-8 text-xs"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                size="sm" // Buton boyutu küçüldü
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white border-none h-8 text-xs"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}