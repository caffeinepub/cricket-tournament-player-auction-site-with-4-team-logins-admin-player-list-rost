import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { groupBallsByInningsAndOver, getLatestBallKey } from '../utils/ballByBall';
import type { InningBallByBall } from '../backend';

interface PublicBallByBallFeedProps {
  ballByBallData: InningBallByBall[] | undefined;
}

export default function PublicBallByBallFeed({ ballByBallData }: PublicBallByBallFeedProps) {
  const groups = groupBallsByInningsAndOver(ballByBallData);
  const latestBallKey = getLatestBallKey(ballByBallData);

  if (groups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ball-by-Ball</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No ball-by-ball data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ball-by-Ball</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {groups.map((group) => (
          <div key={`${group.inningsNumber}-${group.overNumber}`} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Innings {group.inningsNumber}</Badge>
              <Badge variant="secondary">Over {group.overNumber}</Badge>
            </div>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Ball</TableHead>
                    <TableHead>Batsman</TableHead>
                    <TableHead>Bowler</TableHead>
                    <TableHead className="text-right">Runs</TableHead>
                    <TableHead>Outcome</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.balls.map((ball, idx) => {
                    const ballKey = `${group.inningsNumber}-${group.overNumber}-${idx}`;
                    const isLatest = ballKey === latestBallKey;

                    return (
                      <TableRow
                        key={idx}
                        className={isLatest ? 'bg-primary/5 border-l-4 border-l-primary' : ''}
                      >
                        <TableCell className="font-mono text-xs">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{ball.batsman}</TableCell>
                        <TableCell>{ball.bowler}</TableCell>
                        <TableCell className="text-right font-mono">
                          {ball.runs.toString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {ball.wicket && (
                              <Badge variant="destructive" className="text-xs">
                                Wicket
                                {ball.typeOfDismissal && ` - ${ball.typeOfDismissal}`}
                              </Badge>
                            )}
                            {!ball.wicket && Number(ball.runs) === 0 && (
                              <Badge variant="outline" className="text-xs">
                                Dot
                              </Badge>
                            )}
                            {!ball.wicket && Number(ball.runs) === 4 && (
                              <Badge variant="default" className="text-xs bg-blue-600">
                                Four
                              </Badge>
                            )}
                            {!ball.wicket && Number(ball.runs) === 6 && (
                              <Badge variant="default" className="text-xs bg-purple-600">
                                Six
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
