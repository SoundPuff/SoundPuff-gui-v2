import { useState } from 'react';
import { User, Playlist } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { PlaylistCard } from './PlaylistCard';
import { AccountSettings } from './AccountSettings';
import { Edit2, Check, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface ProfilePageProps {
  user: User;
  playlists: Playlist[];
  users: User[];
  currentUserId: string;
  onPlaylistClick: (playlistId: string) => void;
  onUserClick: (userId: string) => void;
  onLike: (playlistId: string) => void;
  onFollow: (userId: string) => void;
  onUpdateProfile: (bio: string, avatar: string) => void;
}

export function ProfilePage({
  user,
  playlists,
  users,
  currentUserId,
  onPlaylistClick,
  onUserClick,
  onLike,
  onFollow,
  onUpdateProfile,
}: ProfilePageProps) {
  const isOwnProfile = user.id === currentUserId;
  const currentUser = users.find((u) => u.id === currentUserId);
  const isFollowing = currentUser?.following.includes(user.id);

  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState(user.bio);
  const [editAvatar, setEditAvatar] = useState(user.avatar);

  const userPlaylists = playlists.filter((p) => p.userId === user.id);

  const handleSaveProfile = () => {
    onUpdateProfile(editBio, editAvatar);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditBio(user.bio);
    setEditAvatar(user.avatar);
    setIsEditing(false);
  };

  return (
    <div className="flex-1 bg-gradient-to-b from-gray-900 to-black text-white overflow-y-auto pb-32">
      <div className="bg-gradient-to-b from-green-900/20 to-transparent p-8 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end gap-6">
            <img
              src={user.avatar}
              alt={user.username}
              className="w-48 h-48 rounded-full object-cover shadow-2xl"
            />
            <div className="flex-1 pb-4">
              <p className="text-sm uppercase tracking-wide mb-2">Profile</p>
              <h1 className="mb-4">{user.username}</h1>
              {!isEditing ? (
                <p className="text-gray-300 mb-4">{user.bio}</p>
              ) : (
                <div className="space-y-3 mb-4">
                  <Textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Your bio"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  <Input
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    placeholder="Avatar URL"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              )}
              <div className="flex items-center gap-6 text-sm">
                <span>{userPlaylists.length} playlists</span>
                <span>{user.followers.length} followers</span>
                <span>{user.following.length} following</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            {isOwnProfile ? (
              isEditing ? (
                <>
                  <Button
                    onClick={handleSaveProfile}
                    className="bg-green-500 hover:bg-green-600 text-black"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button onClick={handleCancelEdit} variant="outline" className="border-gray-700">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} variant="outline" className="border-gray-700">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )
            ) : (
              <Button
                onClick={() => onFollow(user.id)}
                className={
                  isFollowing
                    ? 'border border-gray-700 bg-transparent hover:bg-gray-800'
                    : 'bg-green-500 hover:bg-green-600 text-black'
                }
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {isOwnProfile ? (
            <Tabs defaultValue="playlists" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="playlists">Playlists</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="playlists">
                {userPlaylists.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {userPlaylists.map((playlist) => (
                      <PlaylistCard
                        key={playlist.id}
                        playlist={playlist}
                        user={user}
                        onPlaylistClick={onPlaylistClick}
                        onUserClick={onUserClick}
                        currentUserId={currentUserId}
                        onLike={onLike}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-900 rounded-lg p-12 text-center">
                    <p className="text-gray-400">No playlists yet</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="settings">
                <AccountSettings />
              </TabsContent>
            </Tabs>
          ) : (
            <>
              <h2 className="mb-6">Playlists</h2>
              {userPlaylists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {userPlaylists.map((playlist) => (
                    <PlaylistCard
                      key={playlist.id}
                      playlist={playlist}
                      user={user}
                      onPlaylistClick={onPlaylistClick}
                      onUserClick={onUserClick}
                      currentUserId={currentUserId}
                      onLike={onLike}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-gray-900 rounded-lg p-12 text-center">
                  <p className="text-gray-400">No playlists yet</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
