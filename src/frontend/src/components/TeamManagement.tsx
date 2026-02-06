import { useState } from 'react';
import { useGetAllTeams, useGetAllTeamBudgets, useGetAllPlayers, useUpdateTeamPurse, useAddPlayerToTeam, useRemovePlayerFromTeam, useCreateTeam } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, DollarSign, Users, UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function TeamManagement() {
  const { data: teams, isLoading: teamsLoading } = useGetAllTeams();
  const { data: teamBudgets, isLoading: budgetsLoading } = useGetAllTeamBudgets();
  const { data: allPlayers } = useGetAllPlayers();
  const updateTeamPurse = useUpdateTeamPurse();
  const addPlayerToTeam = useAddPlayerToTeam();
  const removePlayerFromTeam = useRemovePlayerFromTeam();
  const createTeam = useCreateTeam();

  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamPurse, setNewTeamPurse] = useState('');

  const [isPurseDialogOpen, setIsPurseDialogOpen] = useState(false);
  const [selectedTeamForPurse, setSelectedTeamForPurse] = useState<bigint | null>(null);
  const [newPurseAmount, setNewPurseAmount] = useState('');

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedTeamForAssign, setSelectedTeamForAssign] = useState<string>('');
  const [selectedPlayerToAssign, setSelectedPlayerToAssign] = useState<string>('');

  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [selectedTeamForRemove, setSelectedTeamForRemove] = useState<string>('');
  const [selectedPlayerToRemove, setSelectedPlayerToRemove] = useState<string>('');

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !newTeamPurse) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await createTeam.mutateAsync({
        name: newTeamName.trim(),
        totalPurse: parseFloat(newTeamPurse),
      });
      toast.success('Team created successfully');
      setIsCreateTeamOpen(false);
      setNewTeamName('');
      setNewTeamPurse('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create team');
    }
  };

  const handleUpdatePurse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamForPurse || !newPurseAmount) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await updateTeamPurse.mutateAsync({
        teamId: selectedTeamForPurse,
        newPurse: parseFloat(newPurseAmount),
      });
      toast.success('Team purse updated successfully');
      setIsPurseDialogOpen(false);
      setSelectedTeamForPurse(null);
      setNewPurseAmount('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update purse');
    }
  };

  const handleAssignPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamForAssign || !selectedPlayerToAssign) {
      toast.error('Please select both team and player');
      return;
    }

    try {
      await addPlayerToTeam.mutateAsync({
        playerId: BigInt(selectedPlayerToAssign),
        teamId: BigInt(selectedTeamForAssign),
      });
      toast.success('Player assigned to team successfully');
      setIsAssignDialogOpen(false);
      setSelectedTeamForAssign('');
      setSelectedPlayerToAssign('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign player');
    }
  };

  const handleRemovePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamForRemove || !selectedPlayerToRemove) {
      toast.error('Please select both team and player');
      return;
    }

    try {
      await removePlayerFromTeam.mutateAsync({
        playerId: BigInt(selectedPlayerToRemove),
        teamId: BigInt(selectedTeamForRemove),
      });
      toast.success('Player removed from team successfully');
      setIsRemoveDialogOpen(false);
      setSelectedTeamForRemove('');
      setSelectedPlayerToRemove('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove player');
    }
  };

  const openPurseDialog = (teamId: bigint, currentPurse: number) => {
    setSelectedTeamForPurse(teamId);
    setNewPurseAmount(currentPurse.toString());
    setIsPurseDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Team Management</CardTitle>
              <CardDescription>Manage teams, budgets, and player assignments</CardDescription>
            </div>
            <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
              <DialogTrigger asChild>
                <Button className="bg-amber-600 hover:bg-amber-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Team
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Team</DialogTitle>
                  <DialogDescription>Add a new team to the auction</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateTeam} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="team-name">Team Name</Label>
                    <Input
                      id="team-name"
                      placeholder="Enter team name"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-purse">Total Purse (Crore)</Label>
                    <Input
                      id="team-purse"
                      type="number"
                      step="0.01"
                      placeholder="Enter total purse in crore"
                      value={newTeamPurse}
                      onChange={(e) => setNewTeamPurse(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createTeam.isPending}>
                    {createTeam.isPending ? 'Creating...' : 'Create Team'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {teamsLoading || budgetsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : teamBudgets && teamBudgets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamBudgets.map((budget) => (
                <Card key={Number(budget.team.id)} className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{budget.team.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Purse:</span>
                      <Badge variant="secondary" className="font-semibold">
                        ₹{budget.team.totalPurse.toLocaleString()} Cr
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Remaining:</span>
                      <Badge variant="default" className="font-semibold bg-emerald-600">
                        ₹{budget.remainingPurse.toLocaleString()} Cr
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => openPurseDialog(budget.team.id, budget.team.totalPurse)}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Update Purse
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No teams created yet. Click "Create Team" to get started.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Player Assignment</CardTitle>
          <CardDescription>Assign or remove players from teams</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <UserPlus className="w-8 h-8 text-emerald-600" />
                  <span>Assign Player to Team</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Player to Team</DialogTitle>
                  <DialogDescription>Select a team and player to assign</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAssignPlayer} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Team</Label>
                    <Select value={selectedTeamForAssign} onValueChange={setSelectedTeamForAssign}>
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
                  <div className="space-y-2">
                    <Label>Select Player</Label>
                    <Select value={selectedPlayerToAssign} onValueChange={setSelectedPlayerToAssign}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a player" />
                      </SelectTrigger>
                      <SelectContent>
                        {allPlayers?.map((player) => (
                          <SelectItem key={Number(player.id)} value={player.id.toString()}>
                            {player.name} (₹{player.basePrice.toLocaleString()} Cr)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={addPlayerToTeam.isPending}>
                    {addPlayerToTeam.isPending ? 'Assigning...' : 'Assign Player'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <UserMinus className="w-8 h-8 text-destructive" />
                  <span>Remove Player from Team</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Remove Player from Team</DialogTitle>
                  <DialogDescription>Select a team and player to remove</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleRemovePlayer} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Team</Label>
                    <Select value={selectedTeamForRemove} onValueChange={setSelectedTeamForRemove}>
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
                  <div className="space-y-2">
                    <Label>Select Player</Label>
                    <Select value={selectedPlayerToRemove} onValueChange={setSelectedPlayerToRemove}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a player" />
                      </SelectTrigger>
                      <SelectContent>
                        {allPlayers?.map((player) => (
                          <SelectItem key={Number(player.id)} value={player.id.toString()}>
                            {player.name} (₹{player.basePrice.toLocaleString()} Cr)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={removePlayerFromTeam.isPending}>
                    {removePlayerFromTeam.isPending ? 'Removing...' : 'Remove Player'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isPurseDialogOpen} onOpenChange={setIsPurseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Team Purse</DialogTitle>
            <DialogDescription>Set a new total purse amount for the team</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePurse} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purse-amount">New Total Purse (Crore)</Label>
              <Input
                id="purse-amount"
                type="number"
                step="0.01"
                placeholder="Enter new purse amount in crore"
                value={newPurseAmount}
                onChange={(e) => setNewPurseAmount(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={updateTeamPurse.isPending}>
              {updateTeamPurse.isPending ? 'Updating...' : 'Update Purse'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
