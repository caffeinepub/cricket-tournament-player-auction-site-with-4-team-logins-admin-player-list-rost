import { useState } from 'react';
import { Principal } from '@dfinity/principal';
import { useUpdateTeamOwners } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserPlus, X, AlertCircle } from 'lucide-react';
import type { TeamExtended } from '../backend';

interface TeamOwnersManagementProps {
  team: TeamExtended;
}

export default function TeamOwnersManagement({ team }: TeamOwnersManagementProps) {
  const [principalInput, setPrincipalInput] = useState('');
  const [validationError, setValidationError] = useState('');
  const updateOwnersMutation = useUpdateTeamOwners();

  const handleAddOwner = async () => {
    setValidationError('');
    
    if (!principalInput.trim()) {
      setValidationError('Please enter a Principal ID');
      return;
    }

    try {
      const newPrincipal = Principal.fromText(principalInput.trim());
      
      // Check if already exists
      if (team.ownerPrincipals.some(p => p.toString() === newPrincipal.toString())) {
        setValidationError('This Principal is already an owner');
        return;
      }

      const updatedOwners = [...team.ownerPrincipals, newPrincipal];
      
      await updateOwnersMutation.mutateAsync({
        teamId: team.id,
        ownerPrincipals: updatedOwners,
      });

      toast.success('Owner added successfully');
      setPrincipalInput('');
    } catch (error: any) {
      if (error.message?.includes('Invalid principal')) {
        setValidationError('Invalid Principal ID format');
      } else {
        toast.error(error.message || 'Failed to add owner');
      }
    }
  };

  const handleRemoveOwner = async (principalToRemove: Principal) => {
    try {
      const updatedOwners = team.ownerPrincipals.filter(
        p => p.toString() !== principalToRemove.toString()
      );

      await updateOwnersMutation.mutateAsync({
        teamId: team.id,
        ownerPrincipals: updatedOwners,
      });

      toast.success('Owner removed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove owner');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Owners</CardTitle>
        <CardDescription>
          Manage who can place bids for {team.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="principal-input">Add Owner by Principal ID</Label>
          <div className="flex gap-2">
            <Input
              id="principal-input"
              placeholder="Enter Principal ID (e.g., aaaaa-aa)"
              value={principalInput}
              onChange={(e) => {
                setPrincipalInput(e.target.value);
                setValidationError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddOwner();
                }
              }}
            />
            <Button
              onClick={handleAddOwner}
              disabled={updateOwnersMutation.isPending}
              className="gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add
            </Button>
          </div>
          {validationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-2">
          <Label>Current Owners ({team.ownerPrincipals.length})</Label>
          {team.ownerPrincipals.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No owners assigned. Add owners to allow bidding for this team.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {team.ownerPrincipals.map((principal) => (
                <div
                  key={principal.toString()}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                >
                  <Badge variant="secondary" className="font-mono text-xs">
                    {principal.toString()}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveOwner(principal)}
                    disabled={updateOwnersMutation.isPending}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
