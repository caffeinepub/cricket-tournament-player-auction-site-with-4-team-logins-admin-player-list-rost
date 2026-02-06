import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetAllPlayers, useGetAllTeams, useGetAllTeamBudgets, useCreatePlayer, useUpdatePlayer, useDeletePlayer, useUpdateTeamPurse, useAddPlayerToTeam, useRemovePlayerFromTeam, useCreateTeam } from '../hooks/useQueries';
import AdminHeader from '../components/AdminHeader';
import PlayerManagement from '../components/PlayerManagement';
import TeamManagement from '../components/TeamManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboardPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;

  useEffect(() => {
    if (!isAuthenticated && !profileLoading) {
      navigate({ to: '/' });
    }
  }, [isAuthenticated, profileLoading, navigate]);

  useEffect(() => {
    if (userProfile && userProfile.teamId !== undefined && userProfile.teamId !== null) {
      // This is a team user, redirect to team dashboard
      navigate({ to: '/team' });
    }
  }, [userProfile, navigate]);

  if (profileLoading || !userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-emerald-950 dark:via-background dark:to-amber-950">
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-emerald-950 dark:via-background dark:to-amber-950">
      <AdminHeader adminName={userProfile.name} />
      
      <main className="container mx-auto p-6 space-y-6">
        <Tabs defaultValue="players" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>

          <TabsContent value="players">
            <PlayerManagement />
          </TabsContent>

          <TabsContent value="teams">
            <TeamManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
