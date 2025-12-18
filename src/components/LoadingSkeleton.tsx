import React from 'react';

interface LoadingSkeletonProps {
  type?: 'playlist' | 'card' | 'text' | 'avatar' | 'list';
  count?: number;
}

export function LoadingSkeleton({ type = 'card', count = 1 }: LoadingSkeletonProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'playlist':
        return (
          <div className="bg-gray-900 rounded-lg p-4 animate-pulse">
            <div className="aspect-square rounded-lg bg-gray-800 mb-4" />
            <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-800 rounded w-1/2" />
          </div>
        );
      
      case 'card':
        return (
          <div className="bg-gray-900 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-800 rounded w-full mb-2" />
            <div className="h-4 bg-gray-800 rounded w-2/3 mb-2" />
            <div className="h-3 bg-gray-800 rounded w-1/2" />
          </div>
        );
      
      case 'text':
        return (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-800 rounded w-full" />
            <div className="h-4 bg-gray-800 rounded w-5/6" />
            <div className="h-4 bg-gray-800 rounded w-4/6" />
          </div>
        );
      
      case 'avatar':
        return (
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-gray-800 rounded-full" />
          </div>
        );
      
      case 'list':
        return (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-12 h-12 bg-gray-800 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        );
      
      default:
        return (
          <div className="h-4 bg-gray-800 rounded animate-pulse" />
        );
    }
  };

  if (count > 1) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(count)].map((_, i) => (
          <div key={i}>{renderSkeleton()}</div>
        ))}
      </div>
    );
  }

  return renderSkeleton();
}

