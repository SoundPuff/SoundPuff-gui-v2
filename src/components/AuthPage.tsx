import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Music } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface AuthPageProps {
  onLogin: (username: string, password: string) => void;
  onSignup: (username: string, email: string, password: string) => void;
}

export function AuthPage({ onLogin, onSignup }: AuthPageProps) {
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(loginUsername, loginPassword);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    onSignup(signupUsername, signupEmail, signupPassword);
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
        </div>

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
                  <Button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-black">
                    Login
                  </Button>
                  <p className="text-sm text-gray-400 text-center">
                    Demo: Use username "irem" with any password
                  </p>
                </form>
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
                  <Button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-black">
                    Sign Up
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
