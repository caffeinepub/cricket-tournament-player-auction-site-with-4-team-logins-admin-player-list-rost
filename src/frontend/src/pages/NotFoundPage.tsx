import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-emerald-950 dark:via-background dark:to-amber-950 p-4">
      <Card className="w-full max-w-md shadow-2xl border-2">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto w-20 h-20 flex items-center justify-center bg-amber-100 dark:bg-amber-950/30 rounded-full">
            <AlertCircle className="w-12 h-12 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 dark:from-emerald-400 dark:to-emerald-600 bg-clip-text text-transparent">
              Page Not Found
            </CardTitle>
            <CardDescription className="text-base mt-2">
              The page you're looking for doesn't exist
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                The route you tried to access could not be found. This might be because the link is broken or the page has been moved.
              </p>
            </div>

            <Button
              onClick={() => navigate({ to: '/' })}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-md"
              size="lg"
            >
              <Home className="w-5 h-5 mr-2" />
              Go to Home
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => navigate({ to: '/admin' })}
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-2 border-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                <span className="text-sm font-semibold">Admin Panel</span>
              </Button>
              <Button
                onClick={() => navigate({ to: '/team' })}
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-2 border-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                <span className="text-sm font-semibold">Team View</span>
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Need help? Contact your administrator
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
