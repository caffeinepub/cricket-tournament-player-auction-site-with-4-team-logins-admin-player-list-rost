import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

export default function LoginPage() {
  const { login, loginStatus, identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  useEffect(() => {
    if (isAuthenticated && userProfile && !profileLoading) {
      // Redirect based on role
      if (userProfile.teamId !== undefined && userProfile.teamId !== null) {
        navigate({ to: '/team' });
      } else {
        // Assume admin if no teamId
        navigate({ to: '/admin' });
      }
    }
  }, [isAuthenticated, userProfile, profileLoading, navigate]);

  const handleLogin = async () => {
    setError('');
    try {
      await login();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-emerald-950 dark:via-background dark:to-amber-950 p-4">
      <Card className="w-full max-w-md shadow-2xl border-2">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 dark:from-emerald-400 dark:to-emerald-600 bg-clip-text text-transparent">
              Cricket Auction
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Team Management Portal
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Sign in with Internet Identity to access your team dashboard or admin panel
            </p>
            
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive text-center">
                {error}
              </div>
            )}

            <Button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-md"
              size="lg"
            >
              {isLoggingIn ? 'Signing in...' : 'Sign in with Internet Identity'}
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Secure authentication powered by Internet Computer
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
