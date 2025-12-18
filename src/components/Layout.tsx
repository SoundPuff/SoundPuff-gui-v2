import React, { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MusicPlayer } from "./MusicPlayer";
import { ChatBot } from "./ChatBot";
import { useAuth } from "../contexts/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-black dark:bg-gray-950">
      <Sidebar currentUser={user} />
      <div className="flex-1 overflow-hidden">{children}</div>
      <MusicPlayer />
      {isAuthenticated && <ChatBot />}
    </div>
  );
}
