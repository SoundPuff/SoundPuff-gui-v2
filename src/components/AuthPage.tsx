import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Music, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from '../contexts/AuthContext';
import logoPng from '../data/soundpuff_logo.png';
import { authService } from '../services/authService';

export function AuthPage() {
  const navigate = useNavigate();
  const { login, register, requestResetPassword } = useAuth();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isSignUpHovered, setIsSignUpHovered] = useState(false);
  const [isLogInHovered, setIsLogInHovered] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      navigate('/app/home');
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
      await register(signupUsername, signupEmail, signupPassword);
      navigate('/app/home');
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
      // TODO: Implement password reset service
      await requestResetPassword(resetEmail);
      setResetSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center p-4 min-h-screen"
      style={{
        background: `
          radial-gradient(circle at 0% 0%, rgba(231, 140, 137, 0.15), transparent 30%),
          radial-gradient(circle at 100% 0%, rgba(231, 140, 137, 0.15), transparent 30%),
          radial-gradient(circle at 0% 100%, rgba(231, 140, 137, 0.15), transparent 30%),
          radial-gradient(circle at 100% 100%, rgba(231, 140, 137, 0.15), transparent 30%),
          black
        `,
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src={logoPng} alt="SoundPuff Logo"/>
          </div>
          <h3 className="text-white"
            style={{ 
                  WebkitTextStroke: '0.5px #d95a96'
                }}>Your social music platform</h3>
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
          >
            <p className='text-white'
              style={{ 
                    WebkitTextStroke: '0.5px #d95a96'
                  }}>← Browse as guest</p>
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">
              <p className='text-white'
              style={{ 
                    WebkitTextStroke: '0.5px #d95a96'
                  }}>Login</p>
            </TabsTrigger>
            <TabsTrigger value="signup">
              <p className='text-white'
              style={{ 
                    WebkitTextStroke: '0.5px #d95a96'
                  }}>Sign Up</p>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card
              className="bg-gray-900 border-gray-800"
              style={{ outline: '3px solid #33ace3' }}
            >
              <CardHeader>
                <CardTitle className="text-white">
                  <h4 className='text-white'
                  style={{
                        WebkitTextStroke: '0.5px #d95a96'
                      }}>Welcome back</h4>
                </CardTitle>
                <CardDescription>
                  <p className='text-white'
                  style={{ 
                        color: '#d95a96', 
                        WebkitTextStroke: '0.5px #d95a96'
                      }}>Login to your SoundPuff Account</p>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-white">
                      Login
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="Enter your email"
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
                    onMouseEnter={() => setIsSignUpHovered(true)}
                    onMouseLeave={() => setIsSignUpHovered(false)}
                    style={{
                      backgroundColor: isSignUpHovered ? '#23759e' : '#33ace3',
                    }}
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
            <Card
              className="bg-gray-900 border-gray-800"
              style={{ outline: '3px solid #33ace3' }}
            >
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
          <div 
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(4px)',
            }}
          >
            {/* Modal Kutusu */}
            <div 
              className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg shadow-2xl p-6"
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '28rem',
                margin: '0 auto',
                transform: 'translateY(0)',
              }}
            >
              
              {/* Kapatma Butonu (X) */}
              <button
                onClick={() => setShowResetDialog(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>

              {/* Başlık ve Açıklama */}
              <div className="mb-6 text-center">
                <h2 className="text-lg font-semibold text-white">Forgot password</h2>
                <p className="text-sm text-gray-400 mt-2">
                  Enter your email below and we'll send you a password reset link.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleResetPassword} className="flex flex-col items-center justify-center">
                <div className="space-y-4 w-full">
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