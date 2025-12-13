import axios from "axios";
import React from 'react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Music, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface AuthPageProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onSignup: (username: string, email: string, password: string) => Promise<void>;
  onBackToGuest?: () => void;
  onResetPassword?: (email: string) => Promise<void>;
}

export function AuthPage({ onLogin, onSignup, onBackToGuest, onResetPassword }: AuthPageProps) {
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onLogin(loginUsername, loginPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSignup(signupUsername, signupEmail, signupPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (onResetPassword) {
        await onResetPassword(resetEmail);
        setResetSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-green-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Music className="w-12 h-12 text-green-500" />
            <h1 className="text-green-500">SoundPuff</h1>
          </div>
          <p className="text-gray-400">Your social music platform</p>
          {onBackToGuest && (
            <Button
              onClick={onBackToGuest}
              variant="ghost"
              className="mt-2 text-green-400 hover:text-green-300"
            >
              ← Browse as guest
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Welcome back</CardTitle>
                <CardDescription>Login to your SoundPuff account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username" className="text-white">
                      Username
                    </Label>
                    <Input
                      id="login-username"
                      type="text"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="Enter your username"
                      required
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-white">
                      Password
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-green-500 hover:bg-green-600 text-black"
                    disabled={loading}
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>
                </form>

                {/* Butonu formun DIŞINA aldık ve z-index/cursor ekledik */}
                <div className="text-center mt-4 relative z-50">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        console.log("Forgot password clicked"); // Tıklamayı test etmek için
                        setShowResetDialog(true);
                      }}
                      className="text-sm text-green-400 hover:text-green-300 underline cursor-pointer transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

              </CardContent>
            </Card>
          </TabsContent>

          
          <TabsContent value="signup">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Create account</CardTitle>
                <CardDescription>Join the SoundPuff community</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username" className="text-white">
                      Username
                    </Label>
                    <Input
                      id="signup-username"
                      type="text"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                      placeholder="Choose a username"
                      required
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-white">
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-white">
                      Password
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Create a password"
                      required
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-green-500 hover:bg-green-600 text-black"
                    disabled={loading}
                  >
                    {loading ? 'Creating account...' : 'Sign Up'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      
        {showResetDialog && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            {/* Modal Kutusu */}
            <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg shadow-2xl p-6">
              
              {/* Kapatma Butonu (X) */}
              <button
                onClick={() => setShowResetDialog(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>

              {/* Başlık ve Açıklama */}
              <div className="mb-6 text-center sm:text-left">
                <h2 className="text-lg font-semibold text-white">Forgot password</h2>
                <p className="text-sm text-gray-400 mt-2">
                  Enter your email below and we'll send you a password reset link.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleResetPassword}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="text-white">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="bg-gray-800 border-gray-700 text-white focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-green-500 hover:bg-green-600 text-black font-medium"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send password reset link'}
                  </Button>
                </div>
              </form>

              {/* Başarı Mesajı */}
              {resetSuccess && (
                <div className="mt-4 p-3 bg-green-900/30 border border-green-500/50 rounded flex items-center gap-2 text-green-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Reset link sent to your email!</span>
                </div>
              )}
            </div>
          </div>
        )}
     
      </div>
    </div>
  );
}