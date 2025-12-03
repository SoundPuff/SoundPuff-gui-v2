import React from 'react';
import { Home, Search, Library, Plus, User, LogOut, Music } from 'lucide-react';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  currentUser: { username: string; avatar: string } | null;
}

export function Sidebar({ currentPage, onNavigate, onLogout, currentUser }: SidebarProps) {
  const menuItems = [
    { icon: Home, label: 'Home', page: 'home' },
    { icon: Search, label: 'Search', page: 'search' },
    { icon: Library, label: 'My Playlists', page: 'library' },
  ];

  return (
    <nav className="bg-black dark:bg-gray-900 text-white border-b border-gray-800">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Music className="w-8 h-8 text-green-500" />
          <h1 className="text-green-500">SoundPuff</h1>
        </div>

        {/* Menu Items */}
        <ul className="flex items-center gap-2">
          {menuItems.map((item) => (
            <li key={item.page}>
              <button
                onClick={() => onNavigate(item.page)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentPage === item.page
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            </li>
          ))}
          <li>
            <button
              onClick={() => onNavigate('create-playlist')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
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
                onClick={() => onNavigate('profile')}
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
                onClick={onLogout}
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
