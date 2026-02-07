import { useState } from 'react';
import { useGetAllTeams, useCreateTeam, useUpdateTeamPurse, useAddPlayerToTeam, useRemovePlayerFromTeam } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, DollarSign, Users, AlertCircle } from 'lucide-react';
import TeamBoughtPlayersSection from './TeamBoughtPlayersSection';
import TeamOwnersManagement from './TeamOwnersManagement';
import { Principal } from '@dfinity/principal';

export default function TeamManagement() {
  const { data: teams, isLoading } = useGetAllTeams();
  const createTeamMutation = useCreateTeam();
  const updatePurseMutation = useUpdateTeamPurse();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamPurse, setNewTeamPurse] = useState('');

  const [selectedTeamForOwners, setSelectedTeamForOwners] = useState<bigint | null>(null);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || !newTeamPurse) {
      toast.error('Please fill in all fields');
      return;
    }

    const purseValue = parseFloat(newTeamPurse);
    if (isNaN(purseValue) || purseValue <= 0) {
      toast.error('Please enter a valid purse amount');
      return;
    }

    try {
      await createTeamMutation.mutateAsync({
        name: newTeamName,
        totalPurse: purseValue,
        ownerPrincipals: [],
      });
      toast.success('Team created successfully');
      setNewTeamName('');
      setNewTeamPurse('');
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create team');
    }
  };

  const [editingPurse, setEditingPurse] = useState<{ teamId: bigint; value: string } | null>(null);

  const handleUpdatePurse = async (teamId: bigint) => {
    if (!editingPurse || editingPurse.teamId !== teamId) return;

    const newPurse = parseFloat(editingPurse.value);
    if (isNaN(newPurse) || newPurse <= 0) {
      toast.error('Please enter a valid purse amount');
      return;
    }

    try {
      await updatePurseMutation.mutateAsync({ teamId, newPurse });
      toast.success('Purse updated successfully');
      setEditingPurse(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update purse');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Management</h2>
          <p className="text-muted-foreground">Create and manage teams</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>Add a new team to the auction</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
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
                  step="0.1"
                  placeholder="e.g., 100"
                  value={newTeamPurse}
                  onChange={(e) => setNewTeamPurse(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTeam} disabled={createTeamMutation.isPending}>
                {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!teams || teams.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No teams created yet. Create your first team to get started.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map((team) => (
            <div key={team.id.toString()} className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{team.name}</CardTitle>
                      <CardDescription>Team ID: {team.id.toString()}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <Users className="w-3 h-3" />
                      {team.ownerPrincipals.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Total Purse</Label>
                    <div className="flex gap-2">
                      {editingPurse?.teamId === team.id ? (
                        <>
                          <Input
                            type="number"
                            step="0.1"
                            value={editingPurse.value}
                            onChange={(e) =>
                              setEditingPurse({ teamId: team.id, value: e.target.value })
                            }
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleUpdatePurse(team.id)}
                            disabled={updatePurseMutation.isPending}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingPurse(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/30">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <span className="font-semibold">₹ {team.totalPurse.toFixed(2)} Cr</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setEditingPurse({ teamId: team.id, value: team.totalPurse.toString() })
                            }
                          >
                            Edit
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSelectedTeamForOwners(
                          selectedTeamForOwners === team.id ? null : team.id
                        )
                      }
                      className="w-full"
                    >
                      {selectedTeamForOwners === team.id ? 'Hide' : 'Manage'} Owners
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {selectedTeamForOwners === team.id && (
                <TeamOwnersManagement team={team} />
              )}

              <TeamBoughtPlayersSection teamId={team.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
