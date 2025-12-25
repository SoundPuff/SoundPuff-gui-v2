import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button"; 
import { useAuth } from "../contexts/AuthContext";
import { AlertTriangle, Trash2, X } from "lucide-react";

export function AccountSettings() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  const [isDeleteHovered, setIsDeleteHovered] = useState(false);
  
  const { deleteAccount } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("[AccountSettings] mounted");
    return () => console.log("[AccountSettings] unmounted");
  }, []);

  useEffect(() => {
    console.log("[AccountSettings] showConfirm state:", showConfirm);
  }, [showConfirm]);

  const handleDeleteAccount = async () => {
    console.log("[AccountSettings] Delete confirmation accepted");
    if (!password || password.trim().length === 0) {
      setError("Please re-enter your password to confirm deletion.");
      return;
    }
    setIsDeleting(true);
    setError(null);
    try {
      await deleteAccount();
      setShowConfirm(false);
      setIsDeleting(false);
      navigate("/auth");
    } catch (err: any) {
      console.error("Hesap silme hatası:", err);
      setError(err.message || "Hesap silinemedi. Lütfen tekrar deneyin.");
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const confirmModal = showConfirm
    ? createPortal(
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(4px)",
            padding: "16px",
          }}
          onClick={() => {
            console.log("[AccountSettings] modal overlay click -> close");
            setShowConfirm(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "480px",
              backgroundColor: "#111827",
              border: "1px solid #1f2937",
              borderRadius: "12px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px",
                borderBottom: "1px solid #1f2937",
                backgroundColor: "rgba(17,24,39,0.6)",
              }}
            >
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Delete Account
              </h3>
              <button
                onClick={() => {
                  console.log("[AccountSettings] close icon click");
                  setShowConfirm(false);
                }}
                className="p-1 rounded-full hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-white" />
              </button>
            </div>

            <div style={{ padding: "16px" }}>
              <p className="text-gray-300 text-sm leading-relaxed">
                This will permanently delete your account, playlists, and remove all data.
                <br /><br />
                <span className="font-semibold text-red-400">Are you absolutely sure?</span>
              </p>

              <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <label className="text-xs text-gray-400" htmlFor="confirm-password">Re-enter password to continue</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #374151",
                    backgroundColor: "#0f172a",
                    color: "#e5e7eb",
                    outline: "none",
                  }}
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <div
                  style={{
                    marginTop: "12px",
                    fontSize: "12px",
                    color: "#fca5a5",
                  }}
                >
                  {error}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                padding: "12px",
                borderTop: "1px solid #1f2937",
                backgroundColor: "rgba(17,24,39,0.6)",
              }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirm(false)}
                type="button"
                className="border-gray-700 hover:bg-gray-800 text-white h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                aria-disabled={isDeleting || !password}
                type="button"
                className="bg-red-600 hover:bg-red-700 text-white border-none h-8 text-xs"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

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
            onClick={() => {
              console.log("[AccountSettings] delete button clicked");
              setShowConfirm(true);
            }}
            onMouseEnter={() => setIsDeleteHovered(true)}
            onMouseLeave={() => setIsDeleteHovered(false)}
            type="button"
            style={{
              backgroundColor: isDeleteHovered ? '#ff0e0e' : '#ff3e3e',
            }}
        >
            <Trash2 className="w-4 h-4" />
            Delete Account
        </Button>
      </div>

      {/* CONFIRMATION MODAL - KÜÇÜLTÜLMÜŞ VERSİYON */}
      {confirmModal}
    </div>
  );
}