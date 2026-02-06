import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import LoginPage from './pages/LoginPage';
import TeamDashboardPage from './pages/TeamDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProfileSetupModal from './components/ProfileSetupModal';
import { Toaster } from '@/components/ui/sonner';

// Root route with layout
const rootRoute = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  
  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

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

const routeTree = rootRoute.addChildren([loginRoute, teamRoute, adminRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
