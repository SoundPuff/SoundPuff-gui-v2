import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Search, Library, Plus, User, LogOut, Music } from "lucide-react";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "../contexts/AuthContext";
import { User as UserType } from "../types";
import logoGif from '../data/soundpuff_logo.gif';

interface SidebarProps {
  currentUser: UserType | null;
}

export function Sidebar({ currentUser }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { icon: Home, label: "Home", path: "/app/home" },
    { icon: Search, label: "Search", path: "/app/search" },
    { icon: Library, label: "My Playlists", path: "/app/library" },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  return (
    <nav
      className="text-white flex rounded-lg"
      style={{
        background: 'linear-gradient(to bottom, black, #5b0425 15%, #5b0425 85%, black)',
        minHeight: '80px',
      }}
    >
      <div className="flex items-center justify-between px-6 w-full">
        {/* Logo */}
        <div
          className="flex items-center gap-2"
          onClick={() => navigate("/app/home")}
        >
          <img src={logoGif} alt="SoundPuff Logo" width="175"/>
        </div>

        {/* Menu Items */}
        <ul className="flex items-center gap-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <button
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? "bg-pink text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            </li>
          ))}
          <li>
            <button
              onClick={() => navigate("/app/create-playlist")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isActive("/app/create-playlist")
                  ? "bg-pink text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Plus className="w-5 h-5" />
              <span>Create Playlist</span>
            </button>
          </li>
        </ul>

        {/* Right Side: Theme Toggle and User */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {currentUser && (
            <div className="flex items-center gap-2 border-l border-gray-800 pl-4">
              <button
                onClick={() => navigate("/app/profile")}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span>{currentUser.username}</span>
              </button>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="gap-2 text-gray-400 hover:text-white"
              >
                <LogOut className="w-5 h-5" />
                <span>Log out</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
