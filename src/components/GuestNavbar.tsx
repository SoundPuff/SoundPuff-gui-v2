import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoGif from '../data/soundpuff_logo.gif';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';

export function GuestNavbar() {
  const navigate = useNavigate();

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
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/') }>
          <img src={logoGif} alt="SoundPuff Logo" width={175} />
        </div>

        {/* Right Side: Theme Toggle and Auth Buttons */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="flex items-center gap-2 border-l border-gray-800 pl-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/auth')}
              className="gap-2 text-gray-400 hover:text-white"
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigate('/auth')}
              className="bg-pink text-black hover:bg-dark-pink"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default GuestNavbar;
