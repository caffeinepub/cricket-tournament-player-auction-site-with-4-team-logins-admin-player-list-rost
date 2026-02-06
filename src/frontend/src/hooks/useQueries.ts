import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Player, Team, TeamBudget, UserProfile } from '../backend';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Player Queries
export function useGetAllPlayers() {
  const { actor, isFetching } = useActor();

  return useQuery<Player[]>({
    queryKey: ['allPlayers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPlayers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPlayersForTeam(teamId?: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Player[]>({
    queryKey: ['teamPlayers', teamId?.toString()],
    queryFn: async () => {
      if (!actor || teamId === undefined) return [];
      return actor.getPlayersForTeam(teamId);
    },
    enabled: !!actor && !isFetching && teamId !== undefined,
  });
}

export function useCreatePlayer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, basePrice }: { name: string; basePrice: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createPlayer(name, basePrice);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPlayers'] });
    },
  });
}

export function useUpdatePlayer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playerId, name, basePrice }: { playerId: bigint; name: string; basePrice: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updatePlayer(playerId, name, basePrice);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPlayers'] });
      queryClient.invalidateQueries({ queryKey: ['teamPlayers'] });
      queryClient.invalidateQueries({ queryKey: ['teamBudgets'] });
    },
  });
}

export function useDeletePlayer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playerId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deletePlayer(playerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPlayers'] });
      queryClient.invalidateQueries({ queryKey: ['teamPlayers'] });
      queryClient.invalidateQueries({ queryKey: ['teamBudgets'] });
    },
  });
}

// Team Queries
export function useGetAllTeams() {
  const { actor, isFetching } = useActor();

  return useQuery<Team[]>({
    queryKey: ['allTeams'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTeams();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllTeamBudgets() {
  const { actor, isFetching } = useActor();

  return useQuery<TeamBudget[]>({
    queryKey: ['teamBudgets'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTeamBudgets();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetRemainingTeamPurse(teamId?: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ['remainingPurse', teamId?.toString()],
    queryFn: async () => {
      if (!actor || teamId === undefined) return 0;
      return actor.getRemainingTeamPurse(teamId);
    },
    enabled: !!actor && !isFetching && teamId !== undefined,
  });
}

export function useCreateTeam() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, totalPurse }: { name: string; totalPurse: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTeam(name, totalPurse);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTeams'] });
      queryClient.invalidateQueries({ queryKey: ['teamBudgets'] });
    },
  });
}

export function useUpdateTeamPurse() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, newPurse }: { teamId: bigint; newPurse: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTeamPurse(teamId, newPurse);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTeams'] });
      queryClient.invalidateQueries({ queryKey: ['teamBudgets'] });
      queryClient.invalidateQueries({ queryKey: ['remainingPurse'] });
    },
  });
}

// Player Assignment
export function useAddPlayerToTeam() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playerId, teamId }: { playerId: bigint; teamId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addPlayerToTeam(playerId, teamId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamPlayers'] });
      queryClient.invalidateQueries({ queryKey: ['teamBudgets'] });
      queryClient.invalidateQueries({ queryKey: ['remainingPurse'] });
    },
  });
}

export function useRemovePlayerFromTeam() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playerId, teamId }: { playerId: bigint; teamId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removePlayerFromTeam(playerId, teamId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamPlayers'] });
      queryClient.invalidateQueries({ queryKey: ['teamBudgets'] });
      queryClient.invalidateQueries({ queryKey: ['remainingPurse'] });
    },
  });
}
