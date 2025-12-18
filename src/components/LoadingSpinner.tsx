import React from 'react';
import { Music } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  message?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  fullScreen = false, 
  message 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const containerClasses = fullScreen
    ? 'min-h-screen bg-black flex items-center justify-center'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {/* Outer rotating ring */}
          <div
            className={`${sizeClasses[size]} border-4 border-gray-800 border-t-green-500 rounded-full animate-spin`}
          />
          {/* Inner pulsing icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Music
              className={`${
                size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'
              } text-green-500 animate-pulse`}
            />
          </div>
        </div>
        {message && (
          <p className="text-gray-400 text-sm animate-pulse">{message}</p>
        )}
      </div>
    </div>
  );
}

