import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet, createHashHistory } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import LoginPage from './pages/LoginPage';
import TeamDashboardPage from './pages/TeamDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import PublicScorecardPage from './pages/PublicScorecardPage';
import DebugPage from './pages/DebugPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfileSetupModal from './components/ProfileSetupModal';
import GlobalErrorBoundary from './components/GlobalErrorBoundary';
import FatalErrorProvider, { useFatalError } from './components/FatalErrorProvider';
import { initializeGlobalErrorHandling } from './utils/globalErrorHandling';
import { Toaster } from '@/components/ui/sonner';

// Root route with layout
const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});

function RootLayout() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  
  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Set document title
  useEffect(() => {
    document.title = 'Hostel Premier League Team Auction & Management';
  }, []);

  return (
    <>
      <div className="min-h-screen bg-background">
        {showProfileSetup && <ProfileSetupModal />}
        <Outlet />
      </div>
      <Toaster />
    </>
  );
}

// Login route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LoginPage,
});

// Team dashboard route
const teamRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/team',
  component: TeamDashboardPage,
});

// Admin dashboard route
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminDashboardPage,
});

// Public scorecard route (no authentication required)
const publicScorecardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/s/$shareId',
  component: PublicScorecardPage,
});

// Debug diagnostics route
const debugRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/debug',
  component: DebugPage,
});

const routeTree = rootRoute.addChildren([loginRoute, teamRoute, adminRoute, publicScorecardRoute, debugRoute]);

// Use hash history for production-safe deep links
const hashHistory = createHashHistory();

const router = createRouter({ 
  routeTree,
  history: hashHistory,
  defaultNotFoundComponent: NotFoundPage,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function AppWithErrorHandling() {
  const { setFatalError } = useFatalError();

  useEffect(() => {
    initializeGlobalErrorHandling((error) => {
      setFatalError({
        message: error.message,
        stack: error.stack,
        context: { ...error.context },
      });
    });
  }, [setFatalError]);

  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <GlobalErrorBoundary>
      <FatalErrorProvider>
        <AppWithErrorHandling />
      </FatalErrorProvider>
    </GlobalErrorBoundary>
  );
}
