import { useGetPlayersForTeam } from '../hooks/useQueries';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';

interface TeamBoughtPlayersSectionProps {
  teamId: bigint;
}

export default function TeamBoughtPlayersSection({ teamId }: TeamBoughtPlayersSectionProps) {
  const { data: players, isLoading, isError } = useGetPlayersForTeam(teamId);

  return (
    <div className="mt-3 pt-3 border-t">
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Bought Players</span>
      </div>
      
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">Failed to load players</p>
      ) : !players || players.length === 0 ? (
        <p className="text-sm text-muted-foreground">No players bought yet</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {players.map((player) => (
            <Badge key={player.id.toString()} variant="secondary">
              {player.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
