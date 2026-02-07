import { useState } from 'react';
import { useUpdateBallByBallData } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { MatchView, InningBallByBall, BallOutcome } from '../backend';

interface BallByBallEditorProps {
  match: MatchView;
}

export default function BallByBallEditor({ match }: BallByBallEditorProps) {
  const updateBallByBallMutation = useUpdateBallByBallData();
  
  const [selectedInnings, setSelectedInnings] = useState<number>(1);
  const [selectedOver, setSelectedOver] = useState<number>(1);
  const [selectedBall, setSelectedBall] = useState<number>(1);
  
  // Ball outcome form state
  const [batsman, setBatsman] = useState('');
  const [bowler, setBowler] = useState('');
  const [runs, setRuns] = useState('0');
  const [wicket, setWicket] = useState(false);
  const [dismissalType, setDismissalType] = useState('');

  // Initialize ball-by-ball data from match or create empty structure
  const [ballByBallData, setBallByBallData] = useState<InningBallByBall[]>(() => {
    if (match.ballByBallData) {
      return match.ballByBallData;
    }
    // Initialize empty structure for 2 innings, 10 overs each
    return [
      { inningNumber: BigInt(1), overNumber: BigInt(1), balls: [] },
      { inningNumber: BigInt(2), overNumber: BigInt(1), balls: [] },
    ];
  });

  const validateForm = (): string | null => {
    if (!batsman.trim()) return 'Please enter batsman name';
    if (!bowler.trim()) return 'Please enter bowler name';
    if (selectedOver < 1 || selectedOver > 10) return 'Over number must be between 1 and 10';
    if (selectedBall < 1 || selectedBall > 6) return 'Ball number must be between 1 and 6';
    const runsNum = parseInt(runs);
    if (isNaN(runsNum) || runsNum < 0) return 'Runs must be a non-negative number';
    return null;
  };

  const handleAddBall = () => {
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const newBall: BallOutcome = {
      batsman: batsman.trim(),
      bowler: bowler.trim(),
      runs: BigInt(runs),
      runsRemainingInOver: BigInt(0), // Placeholder
      runsRemainingInInnings: BigInt(0), // Placeholder
      wicket,
      wicketRemainingInOver: BigInt(0), // Placeholder
      wicketsRemainingInInnings: BigInt(0), // Placeholder
      typeOfDismissal: wicket && dismissalType.trim() ? dismissalType.trim() : undefined,
    };

    // Find or create the innings/over entry
    const updatedData = [...ballByBallData];
    let inningEntry = updatedData.find(
      (i) => Number(i.inningNumber) === selectedInnings && Number(i.overNumber) === selectedOver
    );

    if (!inningEntry) {
      // Create new over entry
      inningEntry = {
        inningNumber: BigInt(selectedInnings),
        overNumber: BigInt(selectedOver),
        balls: [],
      };
      updatedData.push(inningEntry);
    }

    // Check if we're editing an existing ball or adding a new one
    const existingBallIndex = inningEntry.balls.findIndex((_, idx) => idx + 1 === selectedBall);
    
    if (existingBallIndex >= 0) {
      // Update existing ball
      inningEntry.balls[existingBallIndex] = newBall;
    } else {
      // Add new ball (ensure we don't exceed 6 balls per over)
      if (inningEntry.balls.length >= 6) {
        toast.error('An over can have a maximum of 6 balls');
        return;
      }
      inningEntry.balls.push(newBall);
    }

    setBallByBallData(updatedData);
    
    // Clear form
    setBatsman('');
    setBowler('');
    setRuns('0');
    setWicket(false);
    setDismissalType('');
    
    // Auto-increment ball number
    if (selectedBall < 6) {
      setSelectedBall(selectedBall + 1);
    }
    
    toast.success('Ball data added successfully');
  };

  const handleSave = async () => {
    try {
      await updateBallByBallMutation.mutateAsync({
        matchId: match.matchId,
        ballByBallData,
      });
      toast.success('Ball-by-ball data saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save ball-by-ball data');
    }
  };

  // Get current over's balls for display
  const getCurrentOverBalls = () => {
    const inningEntry = ballByBallData.find(
      (i) => Number(i.inningNumber) === selectedInnings && Number(i.overNumber) === selectedOver
    );
    return inningEntry?.balls || [];
  };

  const currentOverBalls = getCurrentOverBalls();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ball-by-Ball Editor (10 Overs)</CardTitle>
        <CardDescription>
          Record detailed ball-by-ball data for each over
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Select innings, over (1-10), and ball (1-6) to add or edit ball-by-ball data. Click "Save All Data" when finished.
          </AlertDescription>
        </Alert>

        <Tabs value={selectedInnings.toString()} onValueChange={(v) => setSelectedInnings(parseInt(v))}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="1">Innings 1</TabsTrigger>
            <TabsTrigger value="2">Innings 2</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedInnings.toString()} className="space-y-4">
            {/* Over and Ball Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Over Number (1-10)</Label>
                <Select value={selectedOver.toString()} onValueChange={(v) => setSelectedOver(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((over) => (
                      <SelectItem key={over} value={over.toString()}>
                        Over {over}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Ball Number (1-6)</Label>
                <Select value={selectedBall.toString()} onValueChange={(v) => setSelectedBall(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 6 }, (_, i) => i + 1).map((ball) => (
                      <SelectItem key={ball} value={ball.toString()}>
                        Ball {ball}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ball Outcome Form */}
            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
              <h4 className="text-xs font-semibold">Ball Outcome</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Batsman</Label>
                  <Input
                    value={batsman}
                    onChange={(e) => setBatsman(e.target.value)}
                    placeholder="e.g., Player 1"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Bowler</Label>
                  <Input
                    value={bowler}
                    onChange={(e) => setBowler(e.target.value)}
                    placeholder="e.g., Player 5"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Runs</Label>
                  <Input
                    type="number"
                    value={runs}
                    onChange={(e) => setRuns(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1 flex items-end">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="wicket"
                      checked={wicket}
                      onCheckedChange={(checked) => setWicket(checked as boolean)}
                    />
                    <Label htmlFor="wicket" className="text-xs cursor-pointer">
                      Wicket
                    </Label>
                  </div>
                </div>
              </div>
              {wicket && (
                <div className="space-y-1">
                  <Label className="text-xs">Type of Dismissal (optional)</Label>
                  <Input
                    value={dismissalType}
                    onChange={(e) => setDismissalType(e.target.value)}
                    placeholder="e.g., Caught, Bowled, LBW"
                    className="h-8 text-xs"
                  />
                </div>
              )}
              <Button
                onClick={handleAddBall}
                size="sm"
                className="w-full"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add/Update Ball
              </Button>
            </div>

            {/* Current Over Summary */}
            {currentOverBalls.length > 0 && (
              <div className="space-y-2 p-3 border rounded-lg">
                <h4 className="text-xs font-semibold">
                  Over {selectedOver} - {currentOverBalls.length} ball(s) recorded
                </h4>
                <div className="space-y-1">
                  {currentOverBalls.map((ball, idx) => (
                    <div key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="font-medium">Ball {idx + 1}:</span>
                      <span>{ball.batsman} - {ball.runs.toString()} run(s)</span>
                      {ball.wicket && <span className="text-destructive font-medium">WICKET</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={updateBallByBallMutation.isPending}
          className="w-full"
          variant="default"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateBallByBallMutation.isPending ? 'Saving...' : 'Save All Ball-by-Ball Data'}
        </Button>
      </CardContent>
    </Card>
  );
}
