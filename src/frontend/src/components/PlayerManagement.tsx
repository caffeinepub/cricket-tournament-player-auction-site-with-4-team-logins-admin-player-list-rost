import { useState, useMemo } from 'react';
import { useGetAllPlayers, useCreatePlayer, useUpdatePlayer, useDeletePlayer, useGetPlayerTeamAssignments, useGetAllTeams, useAddPlayerToTeam } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, UserPlus, Gavel } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import PlayerAuctionDialog from './PlayerAuctionDialog';
import type { Player } from '../backend';

export default function PlayerManagement() {
  const { data: players, isLoading } = useGetAllPlayers();
  const { data: assignments, isLoading: assignmentsLoading } = useGetPlayerTeamAssignments();
  const { data: teams } = useGetAllTeams();
  const createPlayer = useCreatePlayer();
  const updatePlayer = useUpdatePlayer();
  const deletePlayer = useDeletePlayer();
  const addPlayerToTeam = useAddPlayerToTeam();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPrice, setNewPlayerPrice] = useState('');

  const [assigningPlayerId, setAssigningPlayerId] = useState<bigint | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  const [auctionPlayer, setAuctionPlayer] = useState<Player | null>(null);

  // Partition players into unassigned and assigned
  const { unassignedPlayers, assignedPlayers } = useMemo(() => {
    if (!players || !assignments) {
      return { unassignedPlayers: [], assignedPlayers: [] };
    }

    const unassigned: Player[] = [];
    const assigned: Player[] = [];

    players.forEach((player) => {
      const teamId = assignments.get(player.id.toString());
      if (teamId === null || teamId === undefined) {
        unassigned.push(player);
      } else {
        assigned.push(player);
      }
    });

    return { unassignedPlayers: unassigned, assignedPlayers: assigned };
  }, [players, assignments]);

  // Helper to get team name by ID
  const getTeamName = (playerId: bigint): string => {
    if (!assignments || !teams) return 'Unknown';
    const teamId = assignments.get(playerId.toString());
    if (!teamId) return 'Unassigned';
    const team = teams.find((t) => t.id === teamId);
    return team?.name || 'Unknown';
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim() || !newPlayerPrice) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await createPlayer.mutateAsync({
        name: newPlayerName.trim(),
        basePrice: parseFloat(newPlayerPrice),
      });
      toast.success('Player created successfully');
      setIsCreateOpen(false);
      setNewPlayerName('');
      setNewPlayerPrice('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create player');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer || !newPlayerName.trim() || !newPlayerPrice) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await updatePlayer.mutateAsync({
        playerId: editingPlayer.id,
        name: newPlayerName.trim(),
        basePrice: parseFloat(newPlayerPrice),
      });
      toast.success('Player updated successfully');
      setIsEditOpen(false);
      setEditingPlayer(null);
      setNewPlayerName('');
      setNewPlayerPrice('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update player');
    }
  };

  const handleDelete = async (playerId: bigint) => {
    try {
      await deletePlayer.mutateAsync(playerId);
      toast.success('Player deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete player');
    }
  };

  const handleAssignPlayer = async () => {
    if (!assigningPlayerId || !selectedTeamId) {
      toast.error('Please select a team');
      return;
    }

    try {
      await addPlayerToTeam.mutateAsync({
        playerId: assigningPlayerId,
        teamId: BigInt(selectedTeamId),
      });
      toast.success('Player assigned to team successfully');
      setAssigningPlayerId(null);
      setSelectedTeamId('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign player');
    }
  };

  const openEditDialog = (player: Player) => {
    setEditingPlayer(player);
    setNewPlayerName(player.name);
    setNewPlayerPrice(player.basePrice.toString());
    setIsEditOpen(true);
  };

  const openAssignDialog = (playerId: bigint) => {
    setAssigningPlayerId(playerId);
    setSelectedTeamId('');
  };

  const openAuctionDialog = (player: Player) => {
    setAuctionPlayer(player);
  };

  const renderPlayerTable = (playerList: Player[], title: string, showAssignment: boolean) => (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {playerList.length > 0 ? (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Player Name</TableHead>
                <TableHead className="font-semibold">Base Price</TableHead>
                {showAssignment && <TableHead className="font-semibold">Team</TableHead>}
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playerList.map((player) => (
                <TableRow key={Number(player.id)} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-semibold">
                      ₹{player.basePrice.toLocaleString()} Cr
                    </Badge>
                  </TableCell>
                  {showAssignment && (
                    <TableCell>
                      <Badge variant="outline" className="font-medium">
                        {getTeamName(player.id)}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!showAssignment && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            onClick={() => openAuctionDialog(player)}
                          >
                            <Gavel className="w-4 h-4" />
                          </Button>
                          <Dialog
                            open={assigningPlayerId === player.id}
                            onOpenChange={(open) => {
                              if (!open) {
                                setAssigningPlayerId(null);
                                setSelectedTeamId('');
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-emerald-600 hover:text-emerald-700"
                                onClick={() => openAssignDialog(player.id)}
                              >
                                <UserPlus className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Assign Player to Team</DialogTitle>
                                <DialogDescription>
                                  Select a team for {player.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Select Team</Label>
                                  <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choose a team" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {teams?.map((team) => (
                                        <SelectItem key={Number(team.id)} value={team.id.toString()}>
                                          {team.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  onClick={handleAssignPlayer}
                                  className="w-full"
                                  disabled={addPlayerToTeam.isPending || !selectedTeamId}
                                >
                                  {addPlayerToTeam.isPending ? 'Assigning...' : 'Assign to Team'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}
                      {showAssignment && (
                        <Dialog
                          open={assigningPlayerId === player.id}
                          onOpenChange={(open) => {
                            if (!open) {
                              setAssigningPlayerId(null);
                              setSelectedTeamId('');
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-amber-600 hover:text-amber-700"
                              onClick={() => openAssignDialog(player.id)}
                            >
                              <UserPlus className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Move Player to Team</DialogTitle>
                              <DialogDescription>
                                Select a new team for {player.name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Select Team</Label>
                                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose a team" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {teams?.map((team) => (
                                      <SelectItem key={Number(team.id)} value={team.id.toString()}>
                                        {team.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                onClick={handleAssignPlayer}
                                className="w-full"
                                disabled={addPlayerToTeam.isPending || !selectedTeamId}
                              >
                                {addPlayerToTeam.isPending ? 'Moving...' : 'Move to Team'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(player)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Player</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {player.name}? This will remove them from all teams.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(player.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
          No {title.toLowerCase()} yet.
        </div>
      )}
    </div>
  );

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Player Management</CardTitle>
            <CardDescription>Create, edit, and manage players in the auction</CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Player
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Player</DialogTitle>
                <DialogDescription>Add a new player to the auction</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name">Player Name</Label>
                  <Input
                    id="create-name"
                    placeholder="Enter player name"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-price">Base Price (Crore)</Label>
                  <Input
                    id="create-price"
                    type="number"
                    step="0.01"
                    placeholder="Enter base price in crore"
                    value={newPlayerPrice}
                    onChange={(e) => setNewPlayerPrice(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createPlayer.isPending}>
                  {createPlayer.isPending ? 'Creating...' : 'Create Player'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading || assignmentsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : players && players.length > 0 ? (
          <div className="space-y-6">
            {renderPlayerTable(unassignedPlayers, 'Unassigned Players', false)}
            {renderPlayerTable(assignedPlayers, 'Assigned Players', true)}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No players created yet. Click "Add Player" to get started.
          </div>
        )}

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Player</DialogTitle>
              <DialogDescription>Update player information</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Player Name</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter player name"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">Base Price (Crore)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  placeholder="Enter base price in crore"
                  value={newPlayerPrice}
                  onChange={(e) => setNewPlayerPrice(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={updatePlayer.isPending}>
                {updatePlayer.isPending ? 'Updating...' : 'Update Player'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {auctionPlayer && teams && (
          <PlayerAuctionDialog
            player={auctionPlayer}
            teams={teams}
            open={!!auctionPlayer}
            onOpenChange={(open) => {
              if (!open) setAuctionPlayer(null);
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
