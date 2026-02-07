import { useState } from 'react';
import { useGetAllTeams, useGenerateFixtures, useGetAllMatches } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, MapPin, AlertCircle, Trophy, Play } from 'lucide-react';
import { generateRoundRobinFixtures, type RoundRobinFixture } from '../utils/roundRobin';

export default function TournamentFixturesManagement() {
  const { data: teams, isLoading: teamsLoading } = useGetAllTeams();
  const { data: matches, isLoading: matchesLoading } = useGetAllMatches();
  const generateFixturesMutation = useGenerateFixtures();

  const [tournamentName, setTournamentName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [previewFixtures, setPreviewFixtures] = useState<RoundRobinFixture[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handlePreviewFixtures = () => {
    if (!teams || teams.length < 2) {
      toast.error('At least 2 teams are required to generate fixtures');
      return;
    }

    if (!tournamentName.trim()) {
      toast.error('Please enter a tournament name');
      return;
    }

    if (!startDate) {
      toast.error('Please select a start date');
      return;
    }

    const fixtures = generateRoundRobinFixtures(
      teams.map(t => ({ id: t.id, name: t.name }))
    );

    setPreviewFixtures(fixtures);
    setShowPreview(true);
  };

  const handleGenerateFixtures = async () => {
    if (!tournamentName.trim() || !startDate) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await generateFixturesMutation.mutateAsync({
        tournamentName: tournamentName.trim(),
        startDate,
      });

      toast.success('Fixtures generated successfully');
      setTournamentName('');
      setStartDate('');
      setPreviewFixtures([]);
      setShowPreview(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate fixtures');
    }
  };

  if (teamsLoading || matchesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!teams || teams.length < 2) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Insufficient Teams</AlertTitle>
        <AlertDescription>
          At least 2 teams are required to generate tournament fixtures. Create teams in the Teams tab first.
        </AlertDescription>
      </Alert>
    );
  }

  const totalMatches = matches?.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Tournament Fixtures</h2>
        <p className="text-muted-foreground">Generate round-robin fixtures for all teams</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Possible Fixtures</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(teams.length * (teams.length - 1)) / 2}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matches Created</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMatches}</div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Fixtures Form */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Fixtures</CardTitle>
          <CardDescription>
            Create a round-robin tournament schedule for all teams
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tournament-name">Tournament Name</Label>
              <Input
                id="tournament-name"
                placeholder="e.g., Hostel Premier League 2026"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handlePreviewFixtures}
              variant="outline"
              className="gap-2"
            >
              <Calendar className="w-4 h-4" />
              Preview Fixtures
            </Button>
            <Button
              onClick={handleGenerateFixtures}
              disabled={generateFixturesMutation.isPending || !showPreview}
              className="gap-2"
            >
              <Play className="w-4 h-4" />
              {generateFixturesMutation.isPending ? 'Generating...' : 'Generate & Save Fixtures'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {showPreview && previewFixtures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fixture Preview</CardTitle>
            <CardDescription>
              {previewFixtures.length} matches will be created
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Match #</TableHead>
                    <TableHead>Home Team</TableHead>
                    <TableHead>Away Team</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewFixtures.map((fixture, index) => (
                    <TableRow key={`${fixture.homeTeamId}-${fixture.awayTeamId}`}>
                      <TableCell>
                        <Badge variant="outline">{index + 1}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{fixture.homeTeamName}</TableCell>
                      <TableCell className="font-medium">{fixture.awayTeamName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {tournamentName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {startDate}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Matches */}
      {totalMatches > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Existing Matches</AlertTitle>
          <AlertDescription>
            {totalMatches} match{totalMatches !== 1 ? 'es' : ''} already created. View them in the Matches tab.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
