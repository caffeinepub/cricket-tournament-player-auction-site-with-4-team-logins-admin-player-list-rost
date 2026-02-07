import { useState } from 'react';
import { useGetAllMatches, useGetAllTeams, useCreateMatch, useUpdateMatchResults } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trophy, Calendar, MapPin, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { MatchView } from '../backend';
import MatchInningsScoreEditor from './MatchInningsScoreEditor';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

export default function MatchManagement() {
  const { data: matches, isLoading: matchesLoading } = useGetAllMatches();
  const { data: teams, isLoading: teamsLoading } = useGetAllTeams();
  const createMatchMutation = useCreateMatch();
  const updateMatchResultsMutation = useUpdateMatchResults();
  const { identity } = useInternetIdentity();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchView | null>(null);

  // Create match form state
  const [homeTeamId, setHomeTeamId] = useState<string>('');
  const [awayTeamId, setAwayTeamId] = useState<string>('');
  const [matchDate, setMatchDate] = useState('');
  const [location, setLocation] = useState('');

  // Edit match form state
  const [homeTeamRuns, setHomeTeamRuns] = useState('');
  const [homeTeamWickets, setHomeTeamWickets] = useState('');
  const [awayTeamRuns, setAwayTeamRuns] = useState('');
  const [awayTeamWickets, setAwayTeamWickets] = useState('');
  const [matchWinner, setMatchWinner] = useState('');

  const isAuthenticated = !!identity;

  const handleCreateMatch = async () => {
    if (!homeTeamId || !awayTeamId || !matchDate || !location) {
      toast.error('Please fill in all fields');
      return;
    }

    if (homeTeamId === awayTeamId) {
      toast.error('A team cannot play against itself');
      return;
    }

    const homeTeam = teams?.find(t => t.id.toString() === homeTeamId);
    const awayTeam = teams?.find(t => t.id.toString() === awayTeamId);

    if (!homeTeam || !awayTeam) {
      toast.error('Invalid team selection');
      return;
    }

    try {
      await createMatchMutation.mutateAsync({
        homeTeamId: BigInt(homeTeamId),
        awayTeamId: BigInt(awayTeamId),
        homeTeamName: homeTeam.name,
        awayTeamName: awayTeam.name,
        date: matchDate,
        location,
      });
      toast.success('Match created successfully');
      setCreateDialogOpen(false);
      setHomeTeamId('');
      setAwayTeamId('');
      setMatchDate('');
      setLocation('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create match');
    }
  };

  const handleEditMatch = (match: MatchView) => {
    setSelectedMatch(match);
    setHomeTeamRuns(match.homeTeamRuns.toString());
    setHomeTeamWickets(match.homeTeamWickets.toString());
    setAwayTeamRuns(match.awayTeamRuns.toString());
    setAwayTeamWickets(match.awayTeamWickets.toString());
    setMatchWinner(match.matchWinner);
    setEditDialogOpen(true);
  };

  const handleUpdateMatchResults = async () => {
    if (!selectedMatch) return;

    try {
      await updateMatchResultsMutation.mutateAsync({
        matchId: selectedMatch.matchId,
        homeTeamRuns: BigInt(homeTeamRuns || 0),
        homeTeamWickets: BigInt(homeTeamWickets || 0),
        awayTeamRuns: BigInt(awayTeamRuns || 0),
        awayTeamWickets: BigInt(awayTeamWickets || 0),
        matchWinner,
      });
      toast.success('Match results updated successfully');
      setEditDialogOpen(false);
      setSelectedMatch(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update match results');
    }
  };

  if (matchesLoading || teamsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Match Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Match Management
          </CardTitle>
          <CardDescription>Create and manage cricket matches</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create New Match
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Match</DialogTitle>
                <DialogDescription>Set up a new cricket match between two teams</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="homeTeam">Home Team</Label>
                  <Select value={homeTeamId} onValueChange={setHomeTeamId}>
                    <SelectTrigger id="homeTeam">
                      <SelectValue placeholder="Select home team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams?.map((team) => (
                        <SelectItem key={team.id.toString()} value={team.id.toString()}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="awayTeam">Away Team</Label>
                  <Select value={awayTeamId} onValueChange={setAwayTeamId}>
                    <SelectTrigger id="awayTeam">
                      <SelectValue placeholder="Select away team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams?.map((team) => (
                        <SelectItem key={team.id.toString()} value={team.id.toString()}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="matchDate">Match Date</Label>
                  <Input
                    id="matchDate"
                    type="date"
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Wankhede Stadium, Mumbai"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateMatch} disabled={createMatchMutation.isPending}>
                  {createMatchMutation.isPending ? 'Creating...' : 'Create Match'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Matches List */}
      <Card>
        <CardHeader>
          <CardTitle>All Matches</CardTitle>
          <CardDescription>View and update match scorecards</CardDescription>
        </CardHeader>
        <CardContent>
          {!matches || matches.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No matches found. Create your first match to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Match</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Winner</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((match, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <div>{match.homeTeamName} vs {match.awayTeamName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {match.date}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {match.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div>{match.homeTeamName}: {match.homeTeamRuns.toString()}/{match.homeTeamWickets.toString()}</div>
                          <div>{match.awayTeamName}: {match.awayTeamRuns.toString()}/{match.awayTeamWickets.toString()}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {match.matchWinner ? (
                          <div className="flex items-center gap-1 text-sm font-medium text-primary">
                            <Trophy className="h-3 w-3" />
                            {match.matchWinner}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">TBD</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditMatch(match)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Match Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Match Scorecard</DialogTitle>
            <DialogDescription>
              {selectedMatch && `${selectedMatch.homeTeamName} vs ${selectedMatch.awayTeamName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Overall Match Results */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Overall Match Results</h3>
              <div className="space-y-2">
                <Label>{selectedMatch?.homeTeamName} Score</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="homeRuns" className="text-xs text-muted-foreground">Runs</Label>
                    <Input
                      id="homeRuns"
                      type="number"
                      min="0"
                      value={homeTeamRuns}
                      onChange={(e) => setHomeTeamRuns(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="homeWickets" className="text-xs text-muted-foreground">Wickets</Label>
                    <Input
                      id="homeWickets"
                      type="number"
                      min="0"
                      max="10"
                      value={homeTeamWickets}
                      onChange={(e) => setHomeTeamWickets(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{selectedMatch?.awayTeamName} Score</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="awayRuns" className="text-xs text-muted-foreground">Runs</Label>
                    <Input
                      id="awayRuns"
                      type="number"
                      min="0"
                      value={awayTeamRuns}
                      onChange={(e) => setAwayTeamRuns(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="awayWickets" className="text-xs text-muted-foreground">Wickets</Label>
                    <Input
                      id="awayWickets"
                      type="number"
                      min="0"
                      max="10"
                      value={awayTeamWickets}
                      onChange={(e) => setAwayTeamWickets(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="winner">Match Winner</Label>
                <Input
                  id="winner"
                  placeholder="e.g., Mumbai Indians"
                  value={matchWinner}
                  onChange={(e) => setMatchWinner(e.target.value)}
                />
              </div>
            </div>

            {/* Innings Score Editor */}
            {selectedMatch && (
              <>
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold mb-4">Player Performance by Innings</h3>
                  <MatchInningsScoreEditor match={selectedMatch} />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMatchResults} disabled={updateMatchResultsMutation.isPending}>
              {updateMatchResultsMutation.isPending ? 'Updating...' : 'Update Match Results'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
