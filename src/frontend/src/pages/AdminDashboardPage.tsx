import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import AdminHeader from '../components/AdminHeader';
import PlayerManagement from '../components/PlayerManagement';
import TeamManagement from '../components/TeamManagement';
import MatchManagement from '../components/MatchManagement';
import AuctionSummary from '../components/AuctionSummary';
import TournamentFixturesManagement from '../components/TournamentFixturesManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboardPage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const displayName = isAuthenticated && userProfile ? userProfile.name : 'Guest';

  // Show loading state while profile is being fetched for authenticated users
  if (isAuthenticated && profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-emerald-950 dark:via-background dark:to-amber-950">
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-emerald-950 dark:via-background dark:to-amber-950">
      <AdminHeader adminName={displayName} />
      
      <main className="container mx-auto p-6 space-y-6">
        <Tabs defaultValue="players" className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-5">
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="summary">Auction Summary</TabsTrigger>
            <TabsTrigger value="tournament">Tournament</TabsTrigger>
          </TabsList>

          <TabsContent value="players">
            <PlayerManagement />
          </TabsContent>

          <TabsContent value="teams">
            <TeamManagement />
          </TabsContent>

          <TabsContent value="matches">
            <MatchManagement />
          </TabsContent>

          <TabsContent value="summary">
            <AuctionSummary />
          </TabsContent>

          <TabsContent value="tournament">
            <TournamentFixturesManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
