import { useState } from 'react';
import { Principal } from '@dfinity/principal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateTeamOwners, useGetAllOwnerNames, useChangeOwnerName } from '../hooks/useQueries';
import type { TeamExtended } from '../backend';

interface TeamOwnersManagementProps {
  team: TeamExtended;
}

export default function TeamOwnersManagement({ team }: TeamOwnersManagementProps) {
  const updateTeamOwners = useUpdateTeamOwners();
  const { data: ownerNamesArray } = useGetAllOwnerNames();
  const changeOwnerName = useChangeOwnerName();

  const [addOwnerDialogOpen, setAddOwnerDialogOpen] = useState(false);
  const [editNameDialogOpen, setEditNameDialogOpen] = useState(false);
  const [newOwnerPrincipal, setNewOwnerPrincipal] = useState('');
  const [editingPrincipal, setEditingPrincipal] = useState<Principal | null>(null);
  const [editingName, setEditingName] = useState('');

  // Convert array to Map for easier lookup
  const ownerNamesMap = new Map(ownerNamesArray?.map(([principal, name]) => [principal.toString(), name]) || []);

  const handleAddOwner = async () => {
    if (!newOwnerPrincipal.trim()) {
      toast.error('Please enter a principal ID');
      return;
    }

    try {
      const principal = Principal.fromText(newOwnerPrincipal.trim());
      const updatedOwners = [...team.ownerPrincipals, principal];

      await updateTeamOwners.mutateAsync({
        teamId: team.id,
        newOwnerPrincipals: updatedOwners,
      });

      toast.success('Owner added successfully');
      setAddOwnerDialogOpen(false);
      setNewOwnerPrincipal('');
    } catch (error: any) {
      if (error.message?.includes('Invalid principal')) {
        toast.error('Invalid principal ID format');
      } else {
        toast.error(error.message || 'Failed to add owner');
      }
    }
  };

  const handleRemoveOwner = async (principal: Principal) => {
    try {
      const updatedOwners = team.ownerPrincipals.filter(
        (p) => p.toString() !== principal.toString()
      );

      await updateTeamOwners.mutateAsync({
        teamId: team.id,
        newOwnerPrincipals: updatedOwners,
      });

      toast.success('Owner removed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove owner');
    }
  };

  const handleEditName = (principal: Principal) => {
    setEditingPrincipal(principal);
    const principalStr = principal.toString();
    setEditingName(ownerNamesMap.get(principalStr) || '');
    setEditNameDialogOpen(true);
  };

  const handleSaveName = async () => {
    if (!editingPrincipal) return;

    try {
      await changeOwnerName.mutateAsync({
        owner: editingPrincipal,
        name: editingName.trim(),
      });

      toast.success('Owner name updated successfully');
      setEditNameDialogOpen(false);
      setEditingPrincipal(null);
      setEditingName('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update owner name');
    }
  };

  const getDisplayName = (principal: Principal): string => {
    const principalStr = principal.toString();
    return ownerNamesMap.get(principalStr) || principalStr;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Team Owners</CardTitle>
            <CardDescription>Manage principals who can control this team</CardDescription>
          </div>
          <Dialog open={addOwnerDialogOpen} onOpenChange={setAddOwnerDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Owner
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Team Owner</DialogTitle>
                <DialogDescription>
                  Enter the principal ID of the user you want to add as an owner
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="principal">Principal ID</Label>
                  <Input
                    id="principal"
                    placeholder="e.g., aaaaa-aa..."
                    value={newOwnerPrincipal}
                    onChange={(e) => setNewOwnerPrincipal(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOwnerDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddOwner} disabled={updateTeamOwners.isPending}>
                  {updateTeamOwners.isPending ? 'Adding...' : 'Add Owner'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {team.ownerPrincipals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No owners assigned to this team
          </p>
        ) : (
          <div className="space-y-2">
            {team.ownerPrincipals.map((principal) => {
              const principalStr = principal.toString();
              const hasCustomName = ownerNamesMap.has(principalStr);
              const displayName = getDisplayName(principal);

              return (
                <div
                  key={principalStr}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {displayName}
                      </p>
                      {hasCustomName && (
                        <Badge variant="secondary" className="text-xs">
                          Custom Name
                        </Badge>
                      )}
                    </div>
                    {hasCustomName && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {principalStr}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditName(principal)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOwner(principal)}
                      disabled={updateTeamOwners.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit Name Dialog */}
        <Dialog open={editNameDialogOpen} onOpenChange={setEditNameDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Owner Display Name</DialogTitle>
              <DialogDescription>
                Set a custom display name for this owner
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="ownerName">Display Name</Label>
                <Input
                  id="ownerName"
                  placeholder="Enter display name"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                />
              </div>
              {editingPrincipal && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Principal ID</Label>
                  <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                    {editingPrincipal.toString()}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditNameDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveName} disabled={changeOwnerName.isPending}>
                {changeOwnerName.isPending ? 'Saving...' : 'Save Name'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
