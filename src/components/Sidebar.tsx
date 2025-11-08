import { Home, Search, Library, Plus, User, LogOut, Music } from 'lucide-react';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle.tsx';

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
    <div className="w-64 bg-black dark:bg-gray-900 text-white h-screen flex flex-col p-6">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-8 h-8 text-green-500" />
          <h1 className="text-green-500">SoundPuff</h1>
        </div>
        <ThemeToggle />
      </div>

      <nav className="flex-1">
        <ul className="space-y-4">
          {menuItems.map((item) => (
            <li key={item.page}>
              <button
                onClick={() => onNavigate(item.page)}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
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
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Playlist</span>
            </button>
          </li>
        </ul>
      </nav>

      {currentUser && (
        <div className="border-t border-gray-800 pt-4 mt-4">
          <button
            onClick={() => onNavigate('profile')}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors mb-2"
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
            className="w-full justify-start gap-3 text-gray-400 hover:text-white"
          >
            <LogOut className="w-5 h-5" />
            <span>Log out</span>
          </Button>
        </div>
      )}
    </div>
  );
}
