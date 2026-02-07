import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { deriveInningsContext, formatOverProgress, formatCompletedOvers } from '../utils/ballByBall';
import type { InningBallByBall } from '../backend';

interface PublicInningsContextCardProps {
  ballByBallData: InningBallByBall[] | undefined;
  inningsNumber: number;
  inningsLabel: string;
}

export default function PublicInningsContextCard({
  ballByBallData,
  inningsNumber,
  inningsLabel,
}: PublicInningsContextCardProps) {
  const context = deriveInningsContext(ballByBallData, inningsNumber);

  if (!context) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{inningsLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No ball-by-ball data available for this innings.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{inningsLabel}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Players */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Striker</p>
            <p className="font-semibold">{context.striker || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Non-Striker</p>
            <p className="font-semibold">{context.nonStriker || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Bowler</p>
            <p className="font-semibold">{context.currentBowler || 'N/A'}</p>
          </div>
        </div>

        {/* Over Progress */}
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Current Over</p>
            <Badge variant="outline" className="font-mono">
              {formatOverProgress(context.currentOver, context.ballsInCurrentOver)}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Overs Bowled</p>
            <Badge variant="secondary" className="font-mono">
              {formatCompletedOvers(context.completedOvers, context.ballsInCurrentOver)}
            </Badge>
          </div>
        </div>

        {/* Last Ball */}
        {context.lastBall && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">Last Ball</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default" className="font-mono">
                {context.lastBall.runs.toString()} run{Number(context.lastBall.runs) !== 1 ? 's' : ''}
              </Badge>
              {context.lastBall.wicket && (
                <Badge variant="destructive">
                  Wicket
                  {context.lastBall.typeOfDismissal && ` - ${context.lastBall.typeOfDismissal}`}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
