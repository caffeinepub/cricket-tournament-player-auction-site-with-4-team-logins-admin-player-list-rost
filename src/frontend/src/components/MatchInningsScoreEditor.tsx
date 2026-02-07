import { useState, useEffect } from 'react';
import { useGetAllPlayers, useAddBatsmanPerformance, useUpdateBowlerPerformance } from '../hooks/useQueries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { MatchView, BatsmanPerformance, BowlerPerformance } from '../backend';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface MatchInningsScoreEditorProps {
  match: MatchView;
}

interface EditableBatsmanRow {
  id: string;
  playerId: string;
  runs: string;
  ballsFaced: string;
  fours: string;
  sixes: string;
  isNew?: boolean;
}

interface EditableBowlerRow {
  id: string;
  playerId: string;
  overs: string;
  maidens: string;
  runsConceded: string;
  wickets: string;
  ballsBowled: string;
  isNew?: boolean;
}

export default function MatchInningsScoreEditor({ match }: MatchInningsScoreEditorProps) {
  const { data: players } = useGetAllPlayers();
  const { identity } = useInternetIdentity();
  const [selectedInnings, setSelectedInnings] = useState<'1' | '2'>('1');

  const isAuthenticated = !!identity;

  if (!isAuthenticated) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please log in to edit player performance data.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={selectedInnings} onValueChange={(v) => setSelectedInnings(v as '1' | '2')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="1">Innings 1</TabsTrigger>
          <TabsTrigger value="2">Innings 2</TabsTrigger>
        </TabsList>

        <TabsContent value="1" className="space-y-4">
          <InningsEditor
            match={match}
            innings={1}
            players={players || []}
          />
        </TabsContent>

        <TabsContent value="2" className="space-y-4">
          <InningsEditor
            match={match}
            innings={2}
            players={players || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface InningsEditorProps {
  match: MatchView;
  innings: number;
  players: Array<{ id: bigint; name: string; basePrice: number }>;
}

function InningsEditor({ match, innings, players }: InningsEditorProps) {
  const addBatsmanMutation = useAddBatsmanPerformance();
  const updateBowlerMutation = useUpdateBowlerPerformance();

  // Filter existing data by innings
  const existingBatsmen = match.batsmen.filter(b => Number(b.innings) === innings);
  
  // Get bowlers for this innings from bowlersByInnings (array of tuples)
  const bowlersByInningsEntry = match.bowlersByInnings.find(([inningsNum]) => Number(inningsNum) === innings);
  const existingBowlers = bowlersByInningsEntry ? bowlersByInningsEntry[1] : [];

  // Initialize editable state
  const [batsmenRows, setBatsmenRows] = useState<EditableBatsmanRow[]>([]);
  const [bowlerRows, setBowlerRows] = useState<EditableBowlerRow[]>([]);

  useEffect(() => {
    // Initialize batsmen rows from existing data
    setBatsmenRows(
      existingBatsmen.map((b, idx) => ({
        id: `existing-bat-${idx}`,
        playerId: b.playerId.toString(),
        runs: b.runs.toString(),
        ballsFaced: b.ballsFaced.toString(),
        fours: b.fours.toString(),
        sixes: b.sixes.toString(),
        isNew: false,
      }))
    );

    // Initialize bowler rows from existing data
    setBowlerRows(
      existingBowlers.map((b, idx) => ({
        id: `existing-bowl-${idx}`,
        playerId: b.playerId.toString(),
        overs: b.overs.toString(),
        maidens: b.maidens.toString(),
        runsConceded: b.runsConceded.toString(),
        wickets: b.wickets.toString(),
        ballsBowled: b.ballsBowled.toString(),
        isNew: false,
      }))
    );
  }, [match.matchId, innings]);

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id.toString() === playerId);
    return player?.name || `Player ${playerId}`;
  };

  const addBatsmanRow = () => {
    setBatsmenRows([
      ...batsmenRows,
      {
        id: `new-bat-${Date.now()}`,
        playerId: '',
        runs: '0',
        ballsFaced: '0',
        fours: '0',
        sixes: '0',
        isNew: true,
      },
    ]);
  };

  const addBowlerRow = () => {
    setBowlerRows([
      ...bowlerRows,
      {
        id: `new-bowl-${Date.now()}`,
        playerId: '',
        overs: '0',
        maidens: '0',
        runsConceded: '0',
        wickets: '0',
        ballsBowled: '0',
        isNew: true,
      },
    ]);
  };

  const removeBatsmanRow = (id: string) => {
    setBatsmenRows(batsmenRows.filter(row => row.id !== id));
  };

  const removeBowlerRow = (id: string) => {
    setBowlerRows(bowlerRows.filter(row => row.id !== id));
  };

  const updateBatsmanRow = (id: string, field: keyof EditableBatsmanRow, value: string) => {
    setBatsmenRows(
      batsmenRows.map(row =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  const updateBowlerRow = (id: string, field: keyof EditableBowlerRow, value: string) => {
    setBowlerRows(
      bowlerRows.map(row =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  const saveBatsmanPerformance = async (row: EditableBatsmanRow) => {
    if (!row.playerId) {
      toast.error('Please select a player');
      return;
    }

    try {
      const performance: BatsmanPerformance = {
        playerId: BigInt(row.playerId),
        runs: BigInt(row.runs || 0),
        ballsFaced: BigInt(row.ballsFaced || 0),
        fours: BigInt(row.fours || 0),
        sixes: BigInt(row.sixes || 0),
        innings: BigInt(innings),
      };

      await addBatsmanMutation.mutateAsync({
        matchId: match.matchId,
        performance,
      });

      toast.success('Batsman performance saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save batsman performance');
    }
  };

  const saveBowlerPerformance = async (row: EditableBowlerRow) => {
    if (!row.playerId) {
      toast.error('Please select a player');
      return;
    }

    try {
      const performance: BowlerPerformance = {
        playerId: BigInt(row.playerId),
        overs: parseFloat(row.overs || '0'),
        maidens: BigInt(row.maidens || 0),
        runsConceded: BigInt(row.runsConceded || 0),
        wickets: BigInt(row.wickets || 0),
        ballsBowled: BigInt(row.ballsBowled || 0),
      };

      await updateBowlerMutation.mutateAsync({
        matchId: match.matchId,
        performance,
        innings: BigInt(innings),
      });

      toast.success('Bowler performance saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save bowler performance');
    }
  };

  const isSaving = addBatsmanMutation.isPending || updateBowlerMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Batting Performance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Batting Performance</CardTitle>
              <CardDescription>Innings {innings}</CardDescription>
            </div>
            <Button size="sm" onClick={addBatsmanRow} disabled={isSaving}>
              <Plus className="h-4 w-4 mr-1" />
              Add Batsman
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {batsmenRows.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No batting records for this innings. Click "Add Batsman" to create a new entry.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {batsmenRows.map((row) => (
                <div key={row.id} className="grid grid-cols-12 gap-2 items-center p-2 border rounded-md">
                  <div className="col-span-3">
                    <Select
                      value={row.playerId}
                      onValueChange={(value) => updateBatsmanRow(row.id, 'playerId', value)}
                      disabled={!row.isNew}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select player" />
                      </SelectTrigger>
                      <SelectContent>
                        {players.map((player) => (
                          <SelectItem key={player.id.toString()} value={player.id.toString()}>
                            {player.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      placeholder="Runs"
                      value={row.runs}
                      onChange={(e) => updateBatsmanRow(row.id, 'runs', e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      placeholder="Balls"
                      value={row.ballsFaced}
                      onChange={(e) => updateBatsmanRow(row.id, 'ballsFaced', e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      min="0"
                      placeholder="4s"
                      value={row.fours}
                      onChange={(e) => updateBatsmanRow(row.id, 'fours', e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      min="0"
                      placeholder="6s"
                      value={row.sixes}
                      onChange={(e) => updateBatsmanRow(row.id, 'sixes', e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="col-span-3 flex gap-1">
                    {row.isNew && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => saveBatsmanPerformance(row)}
                          disabled={isSaving}
                          className="h-8"
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeBatsmanRow(row.id)}
                          disabled={isSaving}
                          className="h-8"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {!row.isNew && (
                      <span className="text-xs text-muted-foreground px-2 py-1">
                        {getPlayerName(row.playerId)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bowling Performance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Bowling Performance</CardTitle>
              <CardDescription>Innings {innings}</CardDescription>
            </div>
            <Button size="sm" onClick={addBowlerRow} disabled={isSaving}>
              <Plus className="h-4 w-4 mr-1" />
              Add Bowler
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {bowlerRows.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No bowling records for this innings. Click "Add Bowler" to create a new entry.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {bowlerRows.map((row) => (
                <div key={row.id} className="grid grid-cols-12 gap-2 items-center p-2 border rounded-md">
                  <div className="col-span-3">
                    <Select
                      value={row.playerId}
                      onValueChange={(value) => updateBowlerRow(row.id, 'playerId', value)}
                      disabled={!row.isNew}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select player" />
                      </SelectTrigger>
                      <SelectContent>
                        {players.map((player) => (
                          <SelectItem key={player.id.toString()} value={player.id.toString()}>
                            {player.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="Overs"
                      value={row.overs}
                      onChange={(e) => updateBowlerRow(row.id, 'overs', e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      placeholder="Wickets"
                      value={row.wickets}
                      onChange={(e) => updateBowlerRow(row.id, 'wickets', e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      placeholder="Runs"
                      value={row.runsConceded}
                      onChange={(e) => updateBowlerRow(row.id, 'runsConceded', e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      min="0"
                      placeholder="M"
                      value={row.maidens}
                      onChange={(e) => updateBowlerRow(row.id, 'maidens', e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="col-span-3 flex gap-1">
                    {row.isNew && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => saveBowlerPerformance(row)}
                          disabled={isSaving}
                          className="h-8"
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeBowlerRow(row.id)}
                          disabled={isSaving}
                          className="h-8"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {!row.isNew && (
                      <span className="text-xs text-muted-foreground px-2 py-1">
                        {getPlayerName(row.playerId)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
