import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";

export function NotFoundPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const homePath = user ? "/app/home" : "/";

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white flex items-center justify-center px-6">
      <div className="max-w-lg text-center space-y-6">
        <p className="text-pink uppercase tracking-[0.3em] text-sm">404</p>
        <h1 className="text-4xl font-bold">Page not found</h1>
        <p className="text-gray-400">
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            className="bg-pink hover:bg-[#5b0426] text-black"
            onClick={() => navigate(homePath)}
          >
            Go home
          </Button>
          <Button
            variant="outline"
            className="border-gray-700 text-white"
            onClick={() => navigate(-1)}
          >
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
}

