import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Gavel, TrendingUp, Trophy, StopCircle, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useGetAuctionState, useStartAuction, usePlaceBid, useAssignPlayerAfterAuction, useStopAuction } from '../hooks/useQueries';
import LeadingTeamIndicator from './LeadingTeamIndicator';
import type { Player, Team } from '../backend';

interface PlayerAuctionDialogProps {
  player: Player;
  teams: Team[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PlayerAuctionDialog({ player, teams, open, onOpenChange }: PlayerAuctionDialogProps) {
  const { data: auctionState, isLoading: auctionLoading } = useGetAuctionState(player.id);
  const startAuction = useStartAuction();
  const placeBid = usePlaceBid();
  const assignPlayerAfterAuction = useAssignPlayerAfterAuction();
  const stopAuction = useStopAuction();

  const [incrementAmount, setIncrementAmount] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [fixedIncrement, setFixedIncrement] = useState(false);

  // Determine the default increment value based on auction state
  const defaultIncrement = auctionState?.fixedIncrement ? 0.2 : 0.5;

  // Reset form when dialog opens/closes or auction state changes
  useEffect(() => {
    if (open && auctionState) {
      // For fixed increment, lock to 0.2; otherwise suggest default
      setIncrementAmount(defaultIncrement.toFixed(1));
    } else {
      setIncrementAmount('');
      setSelectedTeamId('');
      setFixedIncrement(false);
    }
  }, [open, auctionState, defaultIncrement]);

  const handleStartAuction = async () => {
    try {
      await startAuction.mutateAsync({
        playerId: player.id,
        startingBid: player.basePrice,
        fixedIncrement,
      });
      toast.success(`Auction started for ${player.name}${fixedIncrement ? ' with fixed +0.2 Cr increments' : ''}`);
    } catch (error: any) {
      const message = error?.message || String(error);
      if (message.includes('already exists')) {
        toast.error('Auction for this player already exists');
      } else if (message.includes('Unauthorized')) {
        toast.error('You do not have permission to start auctions');
      } else {
        toast.error(message || 'Failed to start auction');
      }
    }
  };

  const handlePlaceBid = async () => {
    if (!selectedTeamId) {
      toast.error('Please select a team');
      return;
    }

    if (!auctionState) {
      toast.error('Auction has not been started yet');
      return;
    }

    const increment = parseFloat(incrementAmount);
    if (isNaN(increment) || increment <= 0) {
      toast.error('Please enter a valid increment amount');
      return;
    }

    // Calculate the new bid as current highest + increment
    const newBid = auctionState.highestBid + increment;

    // Validate for fixed increment mode
    if (auctionState.fixedIncrement && Math.abs(increment - 0.2) > 0.001) {
      toast.error('Increment must be exactly 0.2 Cr in fixed increment mode');
      return;
    }

    try {
      await placeBid.mutateAsync({
        playerId: player.id,
        teamId: BigInt(selectedTeamId),
        bidAmount: newBid,
      });
      
      const teamName = teams.find(t => t.id.toString() === selectedTeamId)?.name || 'Team';
      toast.success(`${teamName} bid ₹${newBid.toFixed(1)} Cr (+₹${increment.toFixed(1)} Cr)`);
      
      // Reset increment to default for next bid
      setIncrementAmount(defaultIncrement.toFixed(1));
    } catch (error: any) {
      const message = error?.message || String(error);
      if (message.includes('exactly 0.2 Cr higher')) {
        toast.error(message);
      } else if (message.includes('not higher')) {
        toast.error('Bid must be higher than the current highest bid');
      } else if (message.includes('does not exist')) {
        toast.error('Auction has not been started yet');
      } else if (message.includes('finalized')) {
        toast.error('Auction has already been finalized');
      } else if (message.includes('stopped')) {
        toast.error('Auction has been stopped, no more bids are accepted');
      } else if (message.includes('Insufficient team budget')) {
        toast.error('Team does not have sufficient budget for this bid');
      } else {
        toast.error(message || 'Failed to place bid');
      }
    }
  };

  const handleStopAuction = async () => {
    try {
      await stopAuction.mutateAsync(player.id);
      toast.success(`Auction stopped for ${player.name}`);
    } catch (error: any) {
      const message = error?.message || String(error);
      if (message.includes('already been stopped')) {
        toast.error('Auction has already been stopped');
      } else if (message.includes('does not exist')) {
        toast.error('Auction has not been started yet');
      } else if (message.includes('Unauthorized')) {
        toast.error('You do not have permission to stop auctions');
      } else {
        toast.error(message || 'Failed to stop auction');
      }
    }
  };

  const handleAssignPlayer = async () => {
    if (!auctionState?.highestBidTeamId) {
      toast.error('Cannot assign player without any bids');
      return;
    }

    try {
      await assignPlayerAfterAuction.mutateAsync(player.id);
      const winningTeam = teams.find((t) => t.id === auctionState.highestBidTeamId);
      toast.success(
        `${player.name} assigned to ${winningTeam?.name || 'winning team'} for ₹${auctionState.highestBid} Cr`
      );
      onOpenChange(false);
    } catch (error: any) {
      const message = error?.message || String(error);
      if (message.includes('already finalized')) {
        toast.error('Auction has already been finalized');
      } else if (message.includes('not in assigning state')) {
        toast.error('Auction must be stopped before assignment');
      } else if (message.includes('does not exist')) {
        toast.error('Auction has not been started yet');
      } else if (message.includes('Unauthorized')) {
        toast.error('You do not have permission to assign players');
      } else if (message.includes('Insufficient')) {
        toast.error('Winning team has insufficient budget');
      } else {
        toast.error(message || 'Failed to assign player');
      }
    }
  };

  const getHighestBiddingTeamName = (): string => {
    if (!auctionState?.highestBidTeamId) return 'No bids yet';
    const team = teams.find((t) => t.id === auctionState.highestBidTeamId);
    return team?.name || 'Unknown Team';
  };

  const getLeadingTeam = (): Team | null => {
    if (!auctionState?.highestBidTeamId) return null;
    return teams.find((t) => t.id === auctionState.highestBidTeamId) || null;
  };

  const isAuctionActive = auctionState && !auctionState.isFinalized && !auctionState.isStopped;
  const isAuctionStopped = auctionState?.isStopped && !auctionState.isFinalized;
  const canAssign = isAuctionStopped && auctionState.highestBidTeamId !== undefined;
  const leadingTeam = getLeadingTeam();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Gavel className="w-5 h-5 text-amber-600" />
            Auction: {player.name}
          </DialogTitle>
          <DialogDescription>
            Manage the auction for this player
          </DialogDescription>
        </DialogHeader>

        {auctionLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading auction details...</div>
        ) : (
          <div className="space-y-6">
            {/* Auction Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Status</span>
                <Badge 
                  variant={isAuctionActive ? 'default' : 'secondary'} 
                  className="font-semibold"
                >
                  {auctionState 
                    ? (auctionState.isStopped 
                        ? (auctionState.isFinalized ? 'Finalized' : 'Stopped')
                        : 'Active')
                    : 'Not Started'
                  }
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Base Price</span>
                <Badge variant="outline" className="font-semibold">
                  ₹{player.basePrice.toLocaleString()} Cr
                </Badge>
              </div>

              {auctionState && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Current Bid</span>
                    <Badge variant="secondary" className="font-semibold text-amber-700">
                      ₹{auctionState.highestBid.toLocaleString()} Cr
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                    <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                      Highest Bidder
                    </span>
                    <Badge variant="default" className="font-bold bg-emerald-600 hover:bg-emerald-700">
                      {getHighestBiddingTeamName()}
                    </Badge>
                  </div>

                  {/* Leading Team Indicator - Prominent Display with Animation */}
                  {leadingTeam && (
                    <div className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-2 border-amber-300 dark:border-amber-700 shadow-sm animate-leading-pulse motion-reduce:animate-none">
                      <div className="flex items-center justify-center gap-2">
                        <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-leading-glow motion-reduce:animate-none" />
                        <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                          Currently Leading:
                        </span>
                        <span className="text-lg font-bold text-amber-700 dark:text-amber-300">
                          {leadingTeam.name}
                        </span>
                      </div>
                    </div>
                  )}

                  {!leadingTeam && (
                    <div className="p-3 rounded-lg bg-muted/50 border border-dashed text-center">
                      <p className="text-sm text-muted-foreground">
                        No bids placed yet
                      </p>
                    </div>
                  )}

                  {auctionState.fixedIncrement && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Bid Increment</span>
                      <Badge variant="secondary" className="font-semibold">
                        Fixed +0.2 Cr
                      </Badge>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-4 pt-2 border-t">
              {!auctionState ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="space-y-0.5">
                      <Label htmlFor="fixed-increment" className="text-sm font-medium">
                        Fixed Increment Mode
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Require bids to increase by exactly +0.2 Cr
                      </p>
                    </div>
                    <Switch
                      id="fixed-increment"
                      checked={fixedIncrement}
                      onCheckedChange={setFixedIncrement}
                    />
                  </div>

                  <Button
                    onClick={handleStartAuction}
                    disabled={startAuction.isPending}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Gavel className="w-4 h-4 mr-2" />
                    {startAuction.isPending ? 'Starting...' : 'Start Auction'}
                  </Button>
                </div>
              ) : (
                <>
                  {isAuctionActive && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="increment-amount" className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Bid Increment (Crore)
                        </Label>
                        <Input
                          id="increment-amount"
                          type="number"
                          step={auctionState.fixedIncrement ? '0.2' : '0.1'}
                          placeholder="Enter increment"
                          value={incrementAmount}
                          onChange={(e) => setIncrementAmount(e.target.value)}
                          disabled={auctionState.fixedIncrement}
                        />
                        <p className="text-xs text-muted-foreground">
                          {auctionState.fixedIncrement 
                            ? `Fixed increment: +₹0.2 Cr (Next bid: ₹${(auctionState.highestBid + 0.2).toFixed(1)} Cr)`
                            : `Current bid: ₹${auctionState.highestBid.toFixed(1)} Cr → New bid: ₹${(auctionState.highestBid + (parseFloat(incrementAmount) || 0)).toFixed(1)} Cr`
                          }
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bidding-team">
                          Bidding Team
                          {!leadingTeam && (
                            <span className="ml-2 text-xs text-muted-foreground">(No current leader)</span>
                          )}
                        </Label>
                        <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                          <SelectTrigger id="bidding-team">
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map((team) => {
                              const isLeading = leadingTeam && team.id === leadingTeam.id;
                              return (
                                <SelectItem 
                                  key={Number(team.id)} 
                                  value={team.id.toString()}
                                  className={isLeading ? 'bg-amber-50 dark:bg-amber-950/30 font-semibold' : ''}
                                >
                                  <div className="flex items-center gap-2">
                                    {isLeading && <Crown className="w-3.5 h-3.5 text-amber-600" />}
                                    <span>{team.name}</span>
                                    {isLeading && (
                                      <Badge variant="secondary" className="ml-1 text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
                                        Leading
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        onClick={handlePlaceBid}
                        disabled={placeBid.isPending || !selectedTeamId || !incrementAmount}
                        className="w-full bg-amber-600 hover:bg-amber-700"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        {placeBid.isPending ? 'Placing Bid...' : 'Place Bid'}
                      </Button>
                    </div>
                  )}

                  {isAuctionActive && (
                    <Button
                      onClick={handleStopAuction}
                      disabled={stopAuction.isPending}
                      variant="destructive"
                      className="w-full"
                    >
                      <StopCircle className="w-4 h-4 mr-2" />
                      {stopAuction.isPending ? 'Stopping...' : 'Stop Auction'}
                    </Button>
                  )}

                  {isAuctionStopped && (
                    <>
                      <Button
                        onClick={handleAssignPlayer}
                        disabled={assignPlayerAfterAuction.isPending || !canAssign}
                        variant={canAssign ? 'default' : 'secondary'}
                        className={canAssign ? 'w-full bg-emerald-600 hover:bg-emerald-700' : 'w-full'}
                      >
                        <Trophy className="w-4 h-4 mr-2" />
                        {assignPlayerAfterAuction.isPending ? 'Assigning...' : 'Assign Player'}
                      </Button>

                      {!canAssign && (
                        <p className="text-xs text-center text-muted-foreground">
                          No bids were placed - cannot assign player
                        </p>
                      )}

                      {leadingTeam && (
                        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                          <div className="flex items-center justify-center gap-2">
                            <Trophy className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                              Winner: {leadingTeam.name} at ₹{auctionState.highestBid} Cr
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {auctionState.isFinalized && (
                    <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-300 dark:border-emerald-700">
                      <div className="flex items-center justify-center gap-2">
                        <Trophy className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                          Auction Finalized
                        </span>
                      </div>
                      {leadingTeam && (
                        <p className="text-center text-sm text-emerald-700 dark:text-emerald-300 mt-2">
                          {player.name} assigned to {leadingTeam.name} for ₹{auctionState.highestBid} Cr
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
