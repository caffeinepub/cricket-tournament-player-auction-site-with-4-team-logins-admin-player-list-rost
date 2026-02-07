import { useState } from 'react';
import { useGetAllMatches, useCreateMatch, useGetAllTeams, usePublishScorecard, useUnpublishScorecard } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, ExternalLink, Share2, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import MatchInningsScoreEditor from './MatchInningsScoreEditor';
import BallByBallEditor from './BallByBallEditor';
import { Badge } from '@/components/ui/badge';
import { buildPublicShareUrl, copyToClipboard } from '../utils/shareLinks';
import type { MatchListView } from '../backend';

export default function MatchManagement() {
  const { data: matches, isLoading: matchesLoading } = useGetAllMatches();
  const { data: teams } = useGetAllTeams();
  const createMatchMutation = useCreateMatch();
  const publishMutation = usePublishScorecard();
  const unpublishMutation = useUnpublishScorecard();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<MatchListView | null>(null);
  const [copiedMatchId, setCopiedMatchId] = useState<bigint | null>(null);

  // Create match form state
  const [homeTeamId, setHomeTeamId] = useState<string>('');
  const [awayTeamId, setAwayTeamId] = useState<string>('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');

  // Edit match form state
  const [editHomeTeamRuns, setEditHomeTeamRuns] = useState('');
  const [editHomeTeamWickets, setEditHomeTeamWickets] = useState('');
  const [editAwayTeamRuns, setEditAwayTeamRuns] = useState('');
  const [editAwayTeamWickets, setEditAwayTeamWickets] = useState('');
  const [editMatchWinner, setEditMatchWinner] = useState('');

  const handleCreateMatch = async () => {
    if (!homeTeamId || !awayTeamId || !date || !location) {
      toast.error('Please fill in all fields');
      return;
    }

    const homeTeam = teams?.find((t) => t.id.toString() === homeTeamId);
    const awayTeam = teams?.find((t) => t.id.toString() === awayTeamId);

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
        date,
        location,
      });
      toast.success('Match created successfully');
      setIsCreateDialogOpen(false);
      setHomeTeamId('');
      setAwayTeamId('');
      setDate('');
      setLocation('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create match');
    }
  };

  const handleEditMatch = (match: MatchListView) => {
    setEditingMatch(match);
    setEditHomeTeamRuns(match.homeTeamRuns.toString());
    setEditHomeTeamWickets(match.homeTeamWickets.toString());
    setEditAwayTeamRuns(match.awayTeamRuns.toString());
    setEditAwayTeamWickets(match.awayTeamWickets.toString());
    setEditMatchWinner(match.matchWinner);
  };

  const handlePublish = async (match: MatchListView) => {
    try {
      // If already published and has shareableId, reuse it
      if (match.isPublished && match.shareableId) {
        toast.info('Match is already published');
        return;
      }

      // Generate a new shareableId if not published or missing
      const shareableId = match.shareableId || `match-${match.matchId}-${Date.now()}`;
      
      await publishMutation.mutateAsync({
        matchId: match.matchId,
        shareableId,
      });
      toast.success('Scorecard published successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to publish scorecard');
    }
  };

  const handleUnpublish = async (matchId: bigint) => {
    try {
      await unpublishMutation.mutateAsync(matchId);
      toast.success('Scorecard unpublished successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to unpublish scorecard');
    }
  };

  const handleCopyShareLink = async (match: MatchListView) => {
    if (!match.shareableId) {
      toast.error('No shareable link available. Please publish the scorecard first.');
      return;
    }

    const url = buildPublicShareUrl(match.shareableId);
    const copied = await copyToClipboard(url);
    
    if (copied) {
      setCopiedMatchId(match.matchId);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopiedMatchId(null), 2000);
    } else {
      toast.error('Failed to copy link');
    }
  };

  const handleOpenShareLink = (match: MatchListView) => {
    if (!match.shareableId) {
      toast.error('No shareable link available. Please publish the scorecard first.');
      return;
    }

    const url = buildPublicShareUrl(match.shareableId);
    window.open(url, '_blank');
  };

  const handleShare = async (match: MatchListView) => {
    // If not published, guide user to publish first
    if (!match.isPublished || !match.shareableId) {
      toast.info('Publishing scorecard...');
      await handlePublish(match);
      // After publish, the match will have shareableId, copy it
      setTimeout(() => {
        handleCopyShareLink(match);
      }, 500);
      return;
    }

    // If already published, just copy the link
    await handleCopyShareLink(match);
  };

  if (matchesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Match Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Match Management</CardTitle>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Match
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Match</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Enter location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateMatch} disabled={createMatchMutation.isPending}>
                {createMatchMutation.isPending ? 'Creating...' : 'Create Match'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Match</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches && matches.length > 0 ? (
                matches.map((match) => (
                  <TableRow key={match.matchId.toString()}>
                    <TableCell className="font-medium">
                      {match.homeTeamName} vs {match.awayTeamName}
                    </TableCell>
                    <TableCell>{match.date}</TableCell>
                    <TableCell>{match.location}</TableCell>
                    <TableCell>
                      {match.homeTeamRuns.toString()}/{match.homeTeamWickets.toString()} -{' '}
                      {match.awayTeamRuns.toString()}/{match.awayTeamWickets.toString()}
                    </TableCell>
                    <TableCell>
                      {match.isPublished ? (
                        <Badge variant="default" className="gap-1">
                          <Eye className="h-3 w-3" />
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <EyeOff className="h-3 w-3" />
                          Private
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare(match)}
                          className="gap-1"
                          title="Share scorecard"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditMatch(match)}
                          className="gap-1"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No matches found. Create your first match to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Edit Match Dialog */}
      {editingMatch && (
        <Dialog open={!!editingMatch} onOpenChange={() => setEditingMatch(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Edit Match: {editingMatch.homeTeamName} vs {editingMatch.awayTeamName}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Publish/Unpublish Controls */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Scorecard Visibility</h3>
                    <p className="text-sm text-muted-foreground">
                      {editingMatch.isPublished
                        ? 'This scorecard is publicly accessible via a shareable link'
                        : 'This scorecard is private and not publicly accessible'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingMatch.isPublished ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnpublish(editingMatch.matchId)}
                        disabled={unpublishMutation.isPending}
                        className="gap-2"
                      >
                        <EyeOff className="h-4 w-4" />
                        {unpublishMutation.isPending ? 'Unpublishing...' : 'Unpublish'}
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handlePublish(editingMatch)}
                        disabled={publishMutation.isPending}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        {publishMutation.isPending ? 'Publishing...' : 'Publish'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Share Link Section */}
                {editingMatch.isPublished && editingMatch.shareableId && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label>Shareable Link</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={buildPublicShareUrl(editingMatch.shareableId)}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyShareLink(editingMatch)}
                        className="gap-2 shrink-0"
                      >
                        {copiedMatchId === editingMatch.matchId ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenShareLink(editingMatch)}
                        className="gap-2 shrink-0"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Match Results Editor */}
              <div className="space-y-4">
                <h3 className="font-semibold">Overall Match Results</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{editingMatch.homeTeamName} Runs</Label>
                    <Input
                      type="number"
                      value={editHomeTeamRuns}
                      onChange={(e) => setEditHomeTeamRuns(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{editingMatch.homeTeamName} Wickets</Label>
                    <Input
                      type="number"
                      value={editHomeTeamWickets}
                      onChange={(e) => setEditHomeTeamWickets(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{editingMatch.awayTeamName} Runs</Label>
                    <Input
                      type="number"
                      value={editAwayTeamRuns}
                      onChange={(e) => setEditAwayTeamRuns(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{editingMatch.awayTeamName} Wickets</Label>
                    <Input
                      type="number"
                      value={editAwayTeamWickets}
                      onChange={(e) => setEditAwayTeamWickets(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Match Winner</Label>
                    <Input
                      placeholder="Enter winner team name"
                      value={editMatchWinner}
                      onChange={(e) => setEditMatchWinner(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Per-Innings Scorecard Editor */}
              <MatchInningsScoreEditor match={editingMatch} />

              {/* Ball-by-Ball Editor */}
              <BallByBallEditor match={editingMatch} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingMatch(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
