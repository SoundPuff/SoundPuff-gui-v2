import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from '../contexts/AuthContext';
import logoPng from '../data/soundpuff_logo.png';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { confirmResetPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Invalid or missing reset token');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await confirmResetPassword(token, password);
      setSuccess(true);
      // Redirect to home after successful password reset
      setTimeout(() => {
        navigate('/app/home');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed');
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
            onClick={() => navigate('/auth')}
            variant="ghost"
          >
            <p className='text-white'
              style={{ 
                    WebkitTextStroke: '0.5px #d95a96'
                  }}>← Back to login</p>
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-900/30 border-pink/50">
            <AlertCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-400">
              Password reset successful! Redirecting...
            </AlertDescription>
          </Alert>
        )}

        <Card
          className="bg-gray-900 border-gray-800"
          style={{ outline: '3px solid #DB77A6' }}
        >
          <CardHeader>
            <CardTitle className="text-white">
              <h4 className='text-white'
              style={{
                    WebkitTextStroke: '0.5px #d95a96'
                  }}>Reset Password</h4>
            </CardTitle>
            <CardDescription>
              <p className='text-white'
              style={{ 
                    color: '#d95a96', 
                    WebkitTextStroke: '0.5px #d95a96'
                  }}>Enter your new password</p>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  New Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  required
                  className="bg-gray-800 border-gray-700 text-white"
                  disabled={loading || success || !token}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-pink hover:bg-green-600 text-black"
                style={{
                  backgroundColor: '#DB77A6',
                }}
                disabled={loading || success || !token}
              >
                {loading ? 'Resetting password...' : success ? 'Success!' : 'Reset Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

