import { useParams } from '@tanstack/react-router';
import { useGetPublishedScorecard, useGetAllPlayers } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, MapPin, AlertCircle, Loader2, Share2 } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { buildPublicShareUrl, copyToClipboard, shareViaWebShare } from '../utils/shareLinks';
import { toast } from 'sonner';
import PublicInningsContextCard from '../components/PublicInningsContextCard';
import PublicBallByBallFeed from '../components/PublicBallByBallFeed';

export default function PublicScorecardPage() {
  const { shareId } = useParams({ from: '/s/$shareId' });
  const { data: match, isLoading, error, isFetching } = useGetPublishedScorecard(shareId);
  const { data: players } = useGetAllPlayers();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  // Create player ID to name lookup map
  const playerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    if (players) {
      players.forEach((player) => {
        map.set(player.id.toString(), player.name);
      });
    }
    return map;
  }, [players]);

  // Helper to resolve player name
  const getPlayerName = (playerId: bigint): string => {
    const name = playerNameMap.get(playerId.toString());
    return name || `Player ${playerId.toString()}`;
  };

  // Update timestamp when data successfully refreshes
  useEffect(() => {
    if (match && !isFetching) {
      setLastUpdated(new Date());
    }
  }, [match, isFetching]);

  const handleShare = async () => {
    setIsSharing(true);
    const url = buildPublicShareUrl(shareId);
    const title = match
      ? `${match.homeTeamName} vs ${match.awayTeamName} - Live Scorecard`
      : 'Live Cricket Scorecard';

    try {
      // Try Web Share API first
      const shared = await shareViaWebShare(url, title);
      if (shared) {
        // Share sheet was opened successfully
        toast.success('Share sheet opened');
        setIsSharing(false);
        return;
      }
    } catch (error: any) {
      // User cancelled or share failed, fall through to clipboard
      if (error.name === 'AbortError') {
        // User cancelled, don't show error
        setIsSharing(false);
        return;
      }
    }

    // Fallback to clipboard
    try {
      const copied = await copyToClipboard(url);
      if (copied) {
        toast.success('Link copied to clipboard');
      } else {
        toast.error('Failed to copy link');
      }
    } catch (error) {
      toast.error('Failed to copy link');
    } finally {
      setIsSharing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Scorecard Not Available</AlertTitle>
            <AlertDescription>
              This scorecard is not available. It may have been unpublished or the link is invalid.
              Please check the link and try again.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Live indicator and Share button */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium text-muted-foreground">Live Scorecard</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              disabled={isSharing}
              className="gap-2"
            >
              {isSharing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              Share
            </Button>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {lastUpdated && (
                <span>
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              {isFetching && (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Updating...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Match Header */}
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle className="text-2xl sm:text-3xl">
                  {match.homeTeamName} vs {match.awayTeamName}
                </CardTitle>
                {match.matchWinner && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    {match.matchWinner}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {match.date}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {match.location}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{match.homeTeamName}</h3>
                <p className="text-3xl font-bold text-primary">
                  {match.homeTeamRuns.toString()}/{match.homeTeamWickets.toString()}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{match.awayTeamName}</h3>
                <p className="text-3xl font-bold text-primary">
                  {match.awayTeamRuns.toString()}/{match.awayTeamWickets.toString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Innings Context */}
        {match.ballByBallData && match.ballByBallData.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Live Match Context</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PublicInningsContextCard
                ballByBallData={match.ballByBallData}
                inningsNumber={1}
                inningsLabel="Innings 1"
              />
              <PublicInningsContextCard
                ballByBallData={match.ballByBallData}
                inningsNumber={2}
                inningsLabel="Innings 2"
              />
            </div>
          </div>
        )}

        {/* Ball-by-Ball Feed */}
        {match.ballByBallData && match.ballByBallData.length > 0 && (
          <PublicBallByBallFeed ballByBallData={match.ballByBallData} />
        )}

        {/* Batting Performance by Innings */}
        {match.batsmen && match.batsmen.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Batting Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {[1, 2].map((inningsNum) => {
                const inningsBatsmen = match.batsmen.filter(b => Number(b.innings) === inningsNum);
                if (inningsBatsmen.length === 0) return null;

                return (
                  <div key={inningsNum} className="mb-6 last:mb-0">
                    <h3 className="text-sm font-semibold mb-3">Innings {inningsNum}</h3>
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Player</TableHead>
                            <TableHead className="text-right">Runs</TableHead>
                            <TableHead className="text-right">Balls</TableHead>
                            <TableHead className="text-right">4s</TableHead>
                            <TableHead className="text-right">6s</TableHead>
                            <TableHead className="text-right">SR</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {inningsBatsmen.map((batsman, idx) => {
                            const strikeRate = Number(batsman.ballsFaced) > 0
                              ? ((Number(batsman.runs) / Number(batsman.ballsFaced)) * 100).toFixed(2)
                              : '0.00';
                            return (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{getPlayerName(batsman.playerId)}</TableCell>
                                <TableCell className="text-right">{batsman.runs.toString()}</TableCell>
                                <TableCell className="text-right">{batsman.ballsFaced.toString()}</TableCell>
                                <TableCell className="text-right">{batsman.fours.toString()}</TableCell>
                                <TableCell className="text-right">{batsman.sixes.toString()}</TableCell>
                                <TableCell className="text-right">{strikeRate}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Bowling Performance by Innings */}
        {match.bowlersByInnings && match.bowlersByInnings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Bowling Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {match.bowlersByInnings.map(([inningsNum, bowlers]) => {
                if (!bowlers || bowlers.length === 0) return null;

                return (
                  <div key={inningsNum.toString()} className="mb-6 last:mb-0">
                    <h3 className="text-sm font-semibold mb-3">Innings {inningsNum.toString()}</h3>
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Player</TableHead>
                            <TableHead className="text-right">Overs</TableHead>
                            <TableHead className="text-right">Maidens</TableHead>
                            <TableHead className="text-right">Runs</TableHead>
                            <TableHead className="text-right">Wickets</TableHead>
                            <TableHead className="text-right">Economy</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bowlers.map((bowler, idx) => {
                            const economy = bowler.overs > 0
                              ? (Number(bowler.runsConceded) / bowler.overs).toFixed(2)
                              : '0.00';
                            return (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{getPlayerName(bowler.playerId)}</TableCell>
                                <TableCell className="text-right">{bowler.overs.toFixed(1)}</TableCell>
                                <TableCell className="text-right">{bowler.maidens.toString()}</TableCell>
                                <TableCell className="text-right">{bowler.runsConceded.toString()}</TableCell>
                                <TableCell className="text-right">{bowler.wickets.toString()}</TableCell>
                                <TableCell className="text-right">{economy}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Fielding Performance */}
        {match.fielders && match.fielders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Fielding Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead className="text-right">Catches</TableHead>
                      <TableHead className="text-right">Stumpings</TableHead>
                      <TableHead className="text-right">Total Dismissals</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {match.fielders.map((fielder, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{getPlayerName(fielder.playerId)}</TableCell>
                        <TableCell className="text-right">{fielder.catches.toString()}</TableCell>
                        <TableCell className="text-right">{fielder.stumpings.toString()}</TableCell>
                        <TableCell className="text-right">{fielder.dismissals.toString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>© 2026. Built with love using <a href="https://caffeine.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">caffeine.ai</a></p>
        </div>
      </div>
    </div>
  );
}
