import { useState } from 'react';
import { useGetAllPlayers, useGetPlayerTeamAssignmentsWithSoldAmount, useCreatePlayer, useUpdatePlayer, useDeletePlayer, useGetAllTeams, useAddPlayerToTeam, useRemovePlayerFromTeam } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, UserPlus, UserMinus, Gavel, AlertCircle } from 'lucide-react';
import PlayerAuctionDialog from './PlayerAuctionDialog';
import type { Player } from '../backend';

export default function PlayerManagement() {
  const { data: players, isLoading: playersLoading } = useGetAllPlayers();
  const { data: assignments, isLoading: assignmentsLoading } = useGetPlayerTeamAssignmentsWithSoldAmount();
  const { data: teams } = useGetAllTeams();
  const createPlayerMutation = useCreatePlayer();
  const updatePlayerMutation = useUpdatePlayer();
  const deletePlayerMutation = useDeletePlayer();
  const addPlayerToTeamMutation = useAddPlayerToTeam();
  const removePlayerFromTeamMutation = useRemovePlayerFromTeam();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isAuctionDialogOpen, setIsAuctionDialogOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPrice, setNewPlayerPrice] = useState('');

  const [editPlayerName, setEditPlayerName] = useState('');
  const [editPlayerPrice, setEditPlayerPrice] = useState('');

  const handleCreatePlayer = async () => {
    if (!newPlayerName.trim() || !newPlayerPrice) {
      toast.error('Please fill in all fields');
      return;
    }

    const price = parseFloat(newPlayerPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      await createPlayerMutation.mutateAsync({ name: newPlayerName, basePrice: price });
      toast.success('Player created successfully');
      setNewPlayerName('');
      setNewPlayerPrice('');
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create player');
    }
  };

  const handleEditPlayer = async () => {
    if (!selectedPlayer || !editPlayerName.trim() || !editPlayerPrice) {
      toast.error('Please fill in all fields');
      return;
    }

    const price = parseFloat(editPlayerPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      await updatePlayerMutation.mutateAsync({
        playerId: selectedPlayer.id,
        name: editPlayerName,
        basePrice: price,
      });
      toast.success('Player updated successfully');
      setIsEditDialogOpen(false);
      setSelectedPlayer(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update player');
    }
  };

  const handleDeletePlayer = async (playerId: bigint) => {
    if (!confirm('Are you sure you want to delete this player?')) return;

    try {
      await deletePlayerMutation.mutateAsync(playerId);
      toast.success('Player deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete player');
    }
  };

  const handleAssignPlayer = async () => {
    if (!selectedPlayer || !selectedTeamId) {
      toast.error('Please select a team');
      return;
    }

    try {
      await addPlayerToTeamMutation.mutateAsync({
        playerId: selectedPlayer.id,
        teamId: BigInt(selectedTeamId),
      });
      toast.success('Player assigned successfully');
      setIsAssignDialogOpen(false);
      setSelectedPlayer(null);
      setSelectedTeamId('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign player');
    }
  };

  const handleRemovePlayer = async (playerId: bigint, teamId: bigint) => {
    if (!confirm('Are you sure you want to remove this player from the team?')) return;

    try {
      await removePlayerFromTeamMutation.mutateAsync({ playerId, teamId });
      toast.success('Player removed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove player');
    }
  };

  const openEditDialog = (player: Player) => {
    setSelectedPlayer(player);
    setEditPlayerName(player.name);
    setEditPlayerPrice(player.basePrice.toString());
    setIsEditDialogOpen(true);
  };

  const openAssignDialog = (player: Player) => {
    setSelectedPlayer(player);
    setSelectedTeamId('');
    setIsAssignDialogOpen(true);
  };

  const openAuctionDialog = (player: Player) => {
    setSelectedPlayer(player);
    setIsAuctionDialogOpen(true);
  };

  if (playersLoading || assignmentsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Partition players into unassigned and assigned
  const unassignedPlayers = players?.filter(p => !assignments?.get(p.id.toString())?.teamId) || [];
  const assignedPlayers = players?.filter(p => assignments?.get(p.id.toString())?.teamId) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Player Management</h2>
          <p className="text-muted-foreground">Create and manage players</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Player
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Player</DialogTitle>
              <DialogDescription>Add a new player to the auction</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="player-name">Player Name</Label>
                <Input
                  id="player-name"
                  placeholder="Enter player name"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="player-price">Base Price (Crore)</Label>
                <Input
                  id="player-price"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 2.5"
                  value={newPlayerPrice}
                  onChange={(e) => setNewPlayerPrice(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePlayer} disabled={createPlayerMutation.isPending}>
                {createPlayerMutation.isPending ? 'Creating...' : 'Create Player'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!players || players.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No players created yet. Create your first player to get started.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {/* Unassigned Players */}
          <Card>
            <CardHeader>
              <CardTitle>Unassigned Players ({unassignedPlayers.length})</CardTitle>
              <CardDescription>Players available for auction or assignment</CardDescription>
            </CardHeader>
            <CardContent>
              {unassignedPlayers.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>All players have been assigned to teams</AlertDescription>
                </Alert>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player Name</TableHead>
                        <TableHead>Base Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unassignedPlayers.map((player) => (
                        <TableRow key={player.id.toString()}>
                          <TableCell className="font-medium">{player.name}</TableCell>
                          <TableCell>₹ {player.basePrice.toFixed(2)} Cr</TableCell>
                          <TableCell>
                            <Badge variant="outline">Unassigned</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openAuctionDialog(player)}
                                className="gap-1"
                              >
                                <Gavel className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openAssignDialog(player)}
                                className="gap-1"
                              >
                                <UserPlus className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(player)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePlayer(player.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Players */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Players ({assignedPlayers.length})</CardTitle>
              <CardDescription>Players currently assigned to teams</CardDescription>
            </CardHeader>
            <CardContent>
              {assignedPlayers.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No players have been assigned yet</AlertDescription>
                </Alert>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player Name</TableHead>
                        <TableHead>Base Price</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Sold For</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedPlayers.map((player) => {
                        const assignment = assignments?.get(player.id.toString());
                        const teamId = assignment?.teamId;
                        const soldAmount = assignment?.soldAmount || 0;
                        const team = teams?.find(t => t.id === teamId);
                        return (
                          <TableRow key={player.id.toString()}>
                            <TableCell className="font-medium">{player.name}</TableCell>
                            <TableCell>₹ {player.basePrice.toFixed(2)} Cr</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{team?.name || 'Unknown'}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-primary">
                                ₹ {soldAmount.toFixed(2)} Cr
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(player)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {teamId && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemovePlayer(player.id, teamId)}
                                    className="gap-1"
                                  >
                                    <UserMinus className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
            <DialogDescription>Update player information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-player-name">Player Name</Label>
              <Input
                id="edit-player-name"
                value={editPlayerName}
                onChange={(e) => setEditPlayerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-player-price">Base Price (Crore)</Label>
              <Input
                id="edit-player-price"
                type="number"
                step="0.1"
                value={editPlayerPrice}
                onChange={(e) => setEditPlayerPrice(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPlayer} disabled={updatePlayerMutation.isPending}>
              {updatePlayerMutation.isPending ? 'Updating...' : 'Update Player'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Player to Team</DialogTitle>
            <DialogDescription>
              Select a team for {selectedPlayer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="team-select">Select Team</Label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger id="team-select">
                  <SelectValue placeholder="Choose a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams?.map((team) => (
                    <SelectItem key={team.id.toString()} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignPlayer} disabled={addPlayerToTeamMutation.isPending}>
              {addPlayerToTeamMutation.isPending ? 'Assigning...' : 'Assign Player'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auction Dialog */}
      {selectedPlayer && (
        <PlayerAuctionDialog
          player={selectedPlayer}
          teams={teams || []}
          open={isAuctionDialogOpen}
          onOpenChange={setIsAuctionDialogOpen}
        />
      )}
    </div>
  );
}
