import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login, loginStatus, identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  useEffect(() => {
    // Only redirect if we have a profile and it's been fetched
    if (isAuthenticated && isFetched && userProfile && !profileLoading) {
      // Redirect based on role
      if (userProfile.teamId !== undefined && userProfile.teamId !== null) {
        navigate({ to: '/team' });
      } else {
        // Assume admin if no teamId
        navigate({ to: '/admin' });
      }
    }
  }, [isAuthenticated, userProfile, profileLoading, isFetched, navigate]);

  const handleLogin = async () => {
    setError('');
    try {
      await login();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-emerald-950 dark:via-background dark:to-amber-950 p-4">
      <Card className="w-full max-w-md shadow-2xl border-2">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-24 h-24 flex items-center justify-center">
            <img 
              src="/assets/generated/hpl-logo.dim_512x512.png" 
              alt="HPL Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 dark:from-emerald-400 dark:to-emerald-600 bg-clip-text text-transparent">
              Hostel Premier League
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Team Auction & Management Portal
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <p className="text-sm text-emerald-900 dark:text-emerald-100 font-medium mb-2">
                🌐 Public Access Available
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                View and edit teams, players, and matches without signing in. Internet Identity is optional for personalized features.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => navigate({ to: '/admin' })}
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-2 border-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                <span className="text-sm font-semibold">Admin Panel</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => navigate({ to: '/team' })}
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-2 border-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                <span className="text-sm font-semibold">Team View</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive text-center">
                {error}
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Optional</span>
              </div>
            </div>

            <Button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-md"
              size="lg"
            >
              {isLoggingIn ? 'Signing in...' : 'Sign in with Internet Identity'}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Sign in to save your profile and get personalized features
            </p>
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
