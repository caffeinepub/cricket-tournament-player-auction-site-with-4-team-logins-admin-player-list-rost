import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetAllPlayers, useGetPlayersForTeam, useGetRemainingTeamPurse, useGetAllTeams } from '../hooks/useQueries';
import TeamHeader from '../components/TeamHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Users, TrendingUp } from 'lucide-react';

export default function TeamDashboardPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: allTeams } = useGetAllTeams();
  const { data: allPlayers } = useGetAllPlayers();
  const { data: teamPlayers } = useGetPlayersForTeam(userProfile?.teamId);
  const { data: remainingPurse } = useGetRemainingTeamPurse(userProfile?.teamId);

  const isAuthenticated = !!identity;

  useEffect(() => {
    if (!isAuthenticated && !profileLoading) {
      navigate({ to: '/' });
    }
  }, [isAuthenticated, profileLoading, navigate]);

  useEffect(() => {
    if (userProfile && (userProfile.teamId === undefined || userProfile.teamId === null)) {
      // This is an admin user, redirect to admin dashboard
      navigate({ to: '/admin' });
    }
  }, [userProfile, navigate]);

  if (profileLoading || !userProfile || !userProfile.teamId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-emerald-950 dark:via-background dark:to-amber-950">
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const currentTeam = allTeams?.find(t => t.id === userProfile.teamId);
  const totalPurse = currentTeam?.totalPurse || 0;
  const spent = totalPurse - (remainingPurse || 0);
  const squadSize = teamPlayers?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-emerald-950 dark:via-background dark:to-amber-950">
      <TeamHeader 
        teamName={currentTeam?.name || 'Team'} 
        remainingPurse={remainingPurse || 0}
      />
      
      <main className="container mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-2 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Purse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalPurse.toLocaleString()} Cr</div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Remaining Purse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">₹{(remainingPurse || 0).toLocaleString()} Cr</div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Squad Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{squadSize} Players</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for All Players and Team Squad */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="all">All Players</TabsTrigger>
            <TabsTrigger value="squad">My Squad</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">All Players</CardTitle>
                <CardDescription>Complete list of players in the auction</CardDescription>
              </CardHeader>
              <CardContent>
                {allPlayers && allPlayers.length > 0 ? (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Player Name</TableHead>
                          <TableHead className="font-semibold">Base Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allPlayers.map((player) => (
                          <TableRow key={Number(player.id)} className="hover:bg-muted/30">
                            <TableCell className="font-medium">{player.name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="font-semibold">
                                ₹{player.basePrice.toLocaleString()} Cr
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No players available yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="squad">
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">My Squad</CardTitle>
                <CardDescription>Players in your team</CardDescription>
              </CardHeader>
              <CardContent>
                {teamPlayers && teamPlayers.length > 0 ? (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Player Name</TableHead>
                          <TableHead className="font-semibold">Base Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamPlayers.map((player) => (
                          <TableRow key={Number(player.id)} className="hover:bg-muted/30">
                            <TableCell className="font-medium">{player.name}</TableCell>
                            <TableCell>
                              <Badge variant="default" className="font-semibold bg-emerald-600">
                                ₹{player.basePrice.toLocaleString()} Cr
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No players in your squad yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
