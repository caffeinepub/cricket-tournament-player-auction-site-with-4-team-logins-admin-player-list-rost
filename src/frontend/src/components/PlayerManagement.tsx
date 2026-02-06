import { useState } from 'react';
import { useGetAllPlayers, useCreatePlayer, useUpdatePlayer, useDeletePlayer } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import type { Player } from '../backend';

export default function PlayerManagement() {
  const { data: players, isLoading } = useGetAllPlayers();
  const createPlayer = useCreatePlayer();
  const updatePlayer = useUpdatePlayer();
  const deletePlayer = useDeletePlayer();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPrice, setNewPlayerPrice] = useState('');

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

  const openEditDialog = (player: Player) => {
    setEditingPlayer(player);
    setNewPlayerName(player.name);
    setNewPlayerPrice(player.basePrice.toString());
    setIsEditOpen(true);
  };

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
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : players && players.length > 0 ? (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Player Name</TableHead>
                  <TableHead className="font-semibold">Base Price</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow key={Number(player.id)} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{player.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-semibold">
                        ₹{player.basePrice.toLocaleString()} Cr
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
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
      </CardContent>
    </Card>
  );
}
