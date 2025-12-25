import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { LogIn, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

interface SignInDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SignInDialog({ open, onClose }: SignInDialogProps) {
  const navigate = useNavigate();

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (open) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Lock body scroll
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      // Restore body scroll
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }

    // Cleanup function
    return () => {
      if (open) {
        const scrollY = document.body.style.top;
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || "0") * -1);
        }
      }
    };
  }, [open]);

  const handleSignInClick = () => {
    onClose();
    navigate("/auth");
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
      }}
    >
      {/* Modal Kutusu */}
      <div
        className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "28rem",
          margin: "0 auto",
          transform: "translateY(0)",
          zIndex: 10000,
          outline: "3px solid #DB77A6",
        }}
      >
        {/* Kapatma Butonu (X) */}
        <button
          onClick={handleCloseClick}
          className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors z-10 cursor-pointer"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Başlık ve Açıklama */}
        <div className="mb-6 text-center">
          <h2
            className="text-lg font-semibold text-white"
            style={{
              color: "#d95a96",
              WebkitTextStroke: "0.5px #5b0425",
            }}
          >
            Sign In to Interact
          </h2>
          <h4
            className="text-sm text-white mt-2"
            style={{
              WebkitTextStroke: "0.5px #d95a96",
            }}
          >
            Please sign in to view playlists, like content, and interact with
            the community.
          </h4>
        </div>

        {/* Sign In Button */}
        <div className="flex flex-col items-center justify-center">
          <Button
            onClick={handleSignInClick}
            className="w-full bg-[#DB77A6] hover:bg-[#D95A96] text-white font-medium cursor-pointer hover:bg-dark-pink"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
