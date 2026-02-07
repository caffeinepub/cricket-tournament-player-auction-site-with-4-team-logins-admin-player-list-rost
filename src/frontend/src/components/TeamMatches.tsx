import { useGetAllMatches } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Calendar, MapPin } from 'lucide-react';

interface TeamMatchesProps {
  teamId?: bigint;
}

export default function TeamMatches({ teamId }: TeamMatchesProps) {
  const { data: matches, isLoading, error } = useGetAllMatches();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load matches. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // Filter matches for the specific team if teamId is provided
  const teamMatches = teamId 
    ? matches?.filter(m => m.homeTeamId === teamId || m.awayTeamId === teamId)
    : matches;

  if (!teamMatches || teamMatches.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {teamId ? 'No matches scheduled for this team yet.' : 'No matches scheduled yet.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {teamMatches.map((match, index) => {
        const isHomeTeam = teamId ? match.homeTeamId === teamId : false;
        const isAwayTeam = teamId ? match.awayTeamId === teamId : false;
        const isWinner = match.matchWinner && (
          (isHomeTeam && match.matchWinner === match.homeTeamName) ||
          (isAwayTeam && match.matchWinner === match.awayTeamName)
        );

        return (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">
                    {match.homeTeamName} vs {match.awayTeamName}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {match.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {match.location}
                    </span>
                  </CardDescription>
                </div>
                {match.matchWinner && (
                  <Badge variant={isWinner ? "default" : "secondary"}>
                    {isWinner ? 'Won' : 'Lost'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Match Score */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg border-2 ${isHomeTeam ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700' : 'bg-muted'}`}>
                  <p className="text-sm font-medium text-muted-foreground">{match.homeTeamName}</p>
                  <p className="text-2xl font-bold">
                    {match.homeTeamRuns}/{match.homeTeamWickets}
                  </p>
                </div>
                <div className={`p-4 rounded-lg border-2 ${isAwayTeam ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700' : 'bg-muted'}`}>
                  <p className="text-sm font-medium text-muted-foreground">{match.awayTeamName}</p>
                  <p className="text-2xl font-bold">
                    {match.awayTeamRuns}/{match.awayTeamWickets}
                  </p>
                </div>
              </div>

              {match.matchWinner && (
                <Alert className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700">
                  <AlertDescription className="font-medium text-emerald-900 dark:text-emerald-100">
                    🏆 Winner: {match.matchWinner}
                  </AlertDescription>
                </Alert>
              )}

              {/* Batting Performance */}
              {match.batsmen && match.batsmen.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Batting Performance</h4>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Player ID</TableHead>
                          <TableHead>Runs</TableHead>
                          <TableHead>Balls</TableHead>
                          <TableHead>4s</TableHead>
                          <TableHead>6s</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {match.batsmen.map((batsman, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{batsman.playerId.toString()}</TableCell>
                            <TableCell className="font-medium">{batsman.runs.toString()}</TableCell>
                            <TableCell>{batsman.ballsFaced.toString()}</TableCell>
                            <TableCell>{batsman.fours.toString()}</TableCell>
                            <TableCell>{batsman.sixes.toString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Bowling Performance */}
              {match.bowlers && match.bowlers.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Bowling Performance</h4>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Player ID</TableHead>
                          <TableHead>Overs</TableHead>
                          <TableHead>Maidens</TableHead>
                          <TableHead>Runs</TableHead>
                          <TableHead>Wickets</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {match.bowlers.map((bowler, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{bowler.playerId.toString()}</TableCell>
                            <TableCell>{bowler.overs}</TableCell>
                            <TableCell>{bowler.maidens.toString()}</TableCell>
                            <TableCell>{bowler.runsConceded.toString()}</TableCell>
                            <TableCell className="font-medium">{bowler.wickets.toString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Fielding Performance */}
              {match.fielders && match.fielders.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Fielding Performance</h4>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Player ID</TableHead>
                          <TableHead>Catches</TableHead>
                          <TableHead>Stumpings</TableHead>
                          <TableHead>Dismissals</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {match.fielders.map((fielder, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{fielder.playerId.toString()}</TableCell>
                            <TableCell>{fielder.catches.toString()}</TableCell>
                            <TableCell>{fielder.stumpings.toString()}</TableCell>
                            <TableCell className="font-medium">{fielder.dismissals.toString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
