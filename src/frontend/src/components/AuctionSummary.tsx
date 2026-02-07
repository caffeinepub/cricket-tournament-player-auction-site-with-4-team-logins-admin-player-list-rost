import { useGetAllTeamSummaries } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Download, AlertCircle, Trophy, DollarSign } from 'lucide-react';
import { exportAuctionSummaryToCSV } from '../utils/csvExport';

export default function AuctionSummary() {
  const { data: summaries, isLoading, error } = useGetAllTeamSummaries();

  const handleExportCSV = () => {
    if (!summaries || summaries.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      exportAuctionSummaryToCSV(summaries);
      toast.success('CSV exported successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export CSV');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load auction summary. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!summaries || summaries.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Teams</AlertTitle>
        <AlertDescription>
          Create teams in the Teams tab to see the auction summary.
        </AlertDescription>
      </Alert>
    );
  }

  const totalTeams = summaries.length;
  const totalPlayers = summaries.reduce((sum, s) => sum + s.roster.length, 0);
  const totalSpent = summaries.reduce(
    (sum, s) => sum + (s.team.totalPurse - s.remainingPurse),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Auction Summary</h2>
          <p className="text-muted-foreground">Overview of all teams and their rosters</p>
        </div>
        <Button onClick={handleExportCSV} className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeams}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players Bought</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlayers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹ {totalSpent.toFixed(2)} Cr</div>
          </CardContent>
        </Card>
      </div>

      {/* Team Summaries */}
      <div className="space-y-6">
        {summaries.map((summary) => {
          const spent = summary.team.totalPurse - summary.remainingPurse;
          const spentPercentage = (spent / summary.team.totalPurse) * 100;

          return (
            <Card key={summary.team.id.toString()}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{summary.team.name}</CardTitle>
                    <CardDescription>
                      {summary.roster.length} player{summary.roster.length !== 1 ? 's' : ''} bought
                    </CardDescription>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-sm text-muted-foreground">Total Purse</div>
                    <div className="text-lg font-bold">₹ {summary.team.totalPurse.toFixed(2)} Cr</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Spent</div>
                    <div className="text-lg font-semibold text-destructive">
                      ₹ {spent.toFixed(2)} Cr
                    </div>
                    <Badge variant="secondary">{spentPercentage.toFixed(1)}% of budget</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Remaining</div>
                    <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                      ₹ {summary.remainingPurse.toFixed(2)} Cr
                    </div>
                    <Badge variant="outline">{(100 - spentPercentage).toFixed(1)}% left</Badge>
                  </div>
                </div>

                {summary.roster.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>No players bought yet</AlertDescription>
                  </Alert>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Player Name</TableHead>
                          <TableHead className="text-right">Final Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summary.roster.map(([player, price]) => (
                          <TableRow key={player.id.toString()}>
                            <TableCell className="font-medium">{player.name}</TableCell>
                            <TableCell className="text-right font-semibold">
                              ₹ {price.toFixed(2)} Cr
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
