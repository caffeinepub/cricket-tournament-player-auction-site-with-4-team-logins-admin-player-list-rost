import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { LogOut, LogIn, Trophy, Home } from 'lucide-react';

interface TeamHeaderProps {
  teamName: string;
  remainingPurse: number;
}

export default function TeamHeader({ teamName, remainingPurse }: TeamHeaderProps) {
  const { clear, login, identity, loginStatus } = useInternetIdentity();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <header className="bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-800 dark:to-emerald-900 text-white shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{teamName}</h1>
              <p className="text-emerald-100 text-sm">
                Remaining Purse: ₹{remainingPurse.toLocaleString()} Cr
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate({ to: '/' })}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            {isAuthenticated ? (
              <Button
                onClick={handleLogout}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            ) : (
              <Button
                onClick={handleLogin}
                disabled={isLoggingIn}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              >
                <LogIn className="w-4 h-4 mr-2" />
                {isLoggingIn ? 'Sign In' : 'Sign In'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
