import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetAllPlayers, useGetPlayersForTeam, useGetRemainingTeamPurse, useGetAllTeams } from '../hooks/useQueries';
import TeamHeader from '../components/TeamHeader';
import TeamMatches from '../components/TeamMatches';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Users, TrendingUp, AlertCircle } from 'lucide-react';

export default function TeamDashboardPage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: allTeams, isLoading: teamsLoading } = useGetAllTeams();
  
  const isAuthenticated = !!identity;
  
  // Determine which team to display
  const profileTeamId = isAuthenticated && userProfile?.teamId ? userProfile.teamId : undefined;
  const [selectedTeamId, setSelectedTeamId] = useState<bigint | undefined>(profileTeamId);
  
  // Use profile team if available, otherwise use selected team
  const displayTeamId = profileTeamId || selectedTeamId;
  
  // Convert undefined to null for hooks that expect bigint | null
  const { data: teamPlayers } = useGetPlayersForTeam(displayTeamId ?? null);
  const { data: remainingPurse } = useGetRemainingTeamPurse(displayTeamId ?? null);

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

  const currentTeam = allTeams?.find(t => t.id === displayTeamId);
  const totalPurse = currentTeam?.totalPurse || 0;
  const spent = totalPurse - (remainingPurse || 0);
  const squadSize = teamPlayers?.length || 0;

  // Show team selector if no profile team is set
  const showTeamSelector = !profileTeamId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-emerald-950 dark:via-background dark:to-amber-950">
      <TeamHeader 
        teamName={currentTeam?.name || 'Team Dashboard'} 
        remainingPurse={remainingPurse || 0}
      />
      
      <main className="container mx-auto p-6 space-y-6">
        {showTeamSelector && (
          <Card>
            <CardHeader>
              <CardTitle>Select a Team</CardTitle>
              <CardDescription>Choose a team to view its details and matches</CardDescription>
            </CardHeader>
            <CardContent>
              {teamsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : !allTeams || allTeams.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No teams available. Create teams in the Admin Panel first.
                  </AlertDescription>
                </Alert>
              ) : (
                <Select
                  value={selectedTeamId?.toString()}
                  onValueChange={(value) => setSelectedTeamId(BigInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a team to view" />
                  </SelectTrigger>
                  <SelectContent>
                    {allTeams.map((team) => (
                      <SelectItem key={team.id.toString()} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>
        )}

        {!displayTeamId ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select a team to view its dashboard.
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="matches">Matches</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Remaining Purse</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹ {remainingPurse?.toFixed(2)} Cr</div>
                    <p className="text-xs text-muted-foreground">
                      of ₹ {totalPurse.toFixed(2)} Cr total
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Squad Size</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{squadSize}</div>
                    <p className="text-xs text-muted-foreground">
                      players in squad
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹ {spent.toFixed(2)} Cr</div>
                    <p className="text-xs text-muted-foreground">
                      {totalPurse > 0 ? ((spent / totalPurse) * 100).toFixed(1) : 0}% of budget
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Squad Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Squad Roster</CardTitle>
                  <CardDescription>Players assigned to this team</CardDescription>
                </CardHeader>
                <CardContent>
                  {!teamPlayers || teamPlayers.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No players assigned to this team yet.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Player Name</TableHead>
                            <TableHead>Base Price</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {teamPlayers.map((player) => (
                            <TableRow key={player.id.toString()}>
                              <TableCell className="font-medium">{player.name}</TableCell>
                              <TableCell>₹ {player.basePrice.toFixed(2)} Cr</TableCell>
                              <TableCell>
                                <Badge variant="secondary">Active</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="matches">
              <TeamMatches teamId={displayTeamId} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
