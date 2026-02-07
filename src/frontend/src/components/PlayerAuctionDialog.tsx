import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Gavel, TrendingUp, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { useGetAuctionState, useStartAuction, usePlaceBid, useFinalizeAuction } from '../hooks/useQueries';
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
  const finalizeAuction = useFinalizeAuction();

  const [bidAmount, setBidAmount] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [fixedIncrement, setFixedIncrement] = useState(false);

  // Determine the increment value based on auction state
  const incrementValue = auctionState?.fixedIncrement ? 0.2 : 0.5;

  // Reset form when dialog opens/closes or auction state changes
  useEffect(() => {
    if (open && auctionState) {
      setBidAmount((auctionState.highestBid + incrementValue).toFixed(1));
    } else {
      setBidAmount('');
      setSelectedTeamId('');
      setFixedIncrement(false);
    }
  }, [open, auctionState, incrementValue]);

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

    const bidValue = parseFloat(bidAmount);
    if (isNaN(bidValue) || bidValue <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }

    if (auctionState && bidValue <= auctionState.highestBid) {
      toast.error(`Bid must be greater than current bid of ₹${auctionState.highestBid} Cr`);
      return;
    }

    try {
      await placeBid.mutateAsync({
        playerId: player.id,
        teamId: BigInt(selectedTeamId),
        bidAmount: bidValue,
      });
      toast.success('Bid placed successfully');
      setBidAmount((bidValue + incrementValue).toFixed(1));
    } catch (error: any) {
      const message = error?.message || String(error);
      // Display backend error message directly for fixed increment violations
      if (message.includes('exactly 0.2 Cr higher')) {
        toast.error(message);
      } else if (message.includes('not higher')) {
        toast.error('Bid must be higher than the current highest bid');
      } else if (message.includes('does not exist')) {
        toast.error('Auction has not been started yet');
      } else if (message.includes('finalized')) {
        toast.error('Auction has already been finalized');
      } else {
        toast.error(message || 'Failed to place bid');
      }
    }
  };

  const handleFinalizeAuction = async () => {
    if (!auctionState?.highestBidTeamId) {
      toast.error('Cannot finalize auction without any bids');
      return;
    }

    try {
      await finalizeAuction.mutateAsync(player.id);
      toast.success(`Player ${player.name} assigned to winning team`);
      onOpenChange(false);
    } catch (error: any) {
      const message = error?.message || String(error);
      if (message.includes('already finalized')) {
        toast.error('Auction has already been finalized');
      } else if (message.includes('does not exist')) {
        toast.error('Auction has not been started yet');
      } else {
        toast.error(message || 'Failed to finalize auction');
      }
    }
  };

  const getHighestBiddingTeamName = (): string => {
    if (!auctionState?.highestBidTeamId) return 'No bids yet';
    const team = teams.find((t) => t.id === auctionState.highestBidTeamId);
    return team?.name || 'Unknown Team';
  };

  const isAuctionActive = auctionState && !auctionState.isFinalized;
  const canFinalize = isAuctionActive && auctionState.highestBidTeamId !== undefined;

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
                <Badge variant={isAuctionActive ? 'default' : 'secondary'} className="font-semibold">
                  {auctionState ? (auctionState.isFinalized ? 'Finalized' : 'Active') : 'Not Started'}
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

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Highest Bidder</span>
                    <Badge variant="outline" className="font-medium">
                      {getHighestBiddingTeamName()}
                    </Badge>
                  </div>

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
                        <Label htmlFor="bid-amount" className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Raise Bid (Crore)
                        </Label>
                        <Input
                          id="bid-amount"
                          type="number"
                          step={incrementValue}
                          placeholder="Enter bid amount"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                        />
                        {auctionState.fixedIncrement && (
                          <p className="text-xs text-muted-foreground">
                            Next valid bid: ₹{(auctionState.highestBid + 0.2).toFixed(1)} Cr
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bidding-team">Bidding Team</Label>
                        <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                          <SelectTrigger id="bidding-team">
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map((team) => (
                              <SelectItem key={Number(team.id)} value={team.id.toString()}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        onClick={handlePlaceBid}
                        disabled={placeBid.isPending || !selectedTeamId || !bidAmount}
                        className="w-full bg-amber-600 hover:bg-amber-700"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        {placeBid.isPending ? 'Placing Bid...' : 'Place Bid'}
                      </Button>
                    </div>
                  )}

                  <Button
                    onClick={handleFinalizeAuction}
                    disabled={finalizeAuction.isPending || !canFinalize}
                    variant={canFinalize ? 'default' : 'secondary'}
                    className={canFinalize ? 'w-full bg-emerald-600 hover:bg-emerald-700' : 'w-full'}
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    {finalizeAuction.isPending ? 'Finalizing...' : 'Finalize & Assign'}
                  </Button>

                  {!canFinalize && isAuctionActive && (
                    <p className="text-xs text-center text-muted-foreground">
                      At least one bid is required to finalize
                    </p>
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
