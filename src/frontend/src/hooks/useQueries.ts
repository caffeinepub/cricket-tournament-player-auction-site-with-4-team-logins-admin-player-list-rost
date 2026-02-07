import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Player, Team, TeamExtended, TeamBudget, UserProfile, Match, BatsmanPerformance, BowlerPerformance, FielderPerformance, AuctionState, TeamSummary } from '../backend';
import { Principal } from '@dfinity/principal';

// Helper to check if error is an authorization error
function isAuthorizationError(error: any): boolean {
  const message = error?.message || String(error);
  return message.includes('Unauthorized') || message.includes('trap');
}

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getCallerUserProfile();
      } catch (error) {
        // If authorization error, return null (user not set up yet or not authorized)
        if (isAuthorizationError(error)) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: (failureCount, error) => {
      // Don't retry on authorization errors
      if (isAuthorizationError(error)) {
        return false;
      }
      return failureCount < 3;
    },
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
      try {
        return await actor.getAllPlayers();
      } catch (error) {
        if (isAuthorizationError(error)) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error) => {
      if (isAuthorizationError(error)) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useGetPlayersForTeam(teamId?: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Player[]>({
    queryKey: ['teamPlayers', teamId?.toString()],
    queryFn: async () => {
      if (!actor || teamId === undefined) return [];
      try {
        return await actor.getPlayersForTeam(teamId);
      } catch (error) {
        if (isAuthorizationError(error)) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && teamId !== undefined,
    retry: (failureCount, error) => {
      if (isAuthorizationError(error)) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useGetPlayerTeamAssignmentsWithSoldAmount() {
  const { actor, isFetching } = useActor();

  return useQuery<Map<string, { teamId: bigint | null; soldAmount: number }>>({
    queryKey: ['playerTeamAssignmentsWithSoldAmount'],
    queryFn: async () => {
      if (!actor) return new Map();
      try {
        const assignments = await actor.getPlayerTeamAssignmentsWithSoldAmount();
        const map = new Map<string, { teamId: bigint | null; soldAmount: number }>();
        assignments.forEach(([playerId, teamId, soldAmount]) => {
          map.set(playerId.toString(), { teamId, soldAmount });
        });
        return map;
      } catch (error) {
        if (isAuthorizationError(error)) {
          return new Map();
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error) => {
      if (isAuthorizationError(error)) {
        return false;
      }
      return failureCount < 3;
    },
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
      queryClient.invalidateQueries({ queryKey: ['playerTeamAssignmentsWithSoldAmount'] });
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
      queryClient.invalidateQueries({ queryKey: ['playerTeamAssignmentsWithSoldAmount'] });
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
      queryClient.invalidateQueries({ queryKey: ['playerTeamAssignmentsWithSoldAmount'] });
    },
  });
}

// Team Queries
export function useGetAllTeams() {
  const { actor, isFetching } = useActor();

  return useQuery<TeamExtended[]>({
    queryKey: ['allTeams'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllTeams();
      } catch (error) {
        if (isAuthorizationError(error)) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error) => {
      if (isAuthorizationError(error)) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useGetAllTeamBudgets() {
  const { actor, isFetching } = useActor();

  return useQuery<TeamBudget[]>({
    queryKey: ['teamBudgets'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllTeamBudgets();
      } catch (error) {
        if (isAuthorizationError(error)) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error) => {
      if (isAuthorizationError(error)) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useGetRemainingTeamPurse(teamId?: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ['remainingPurse', teamId?.toString()],
    queryFn: async () => {
      if (!actor || teamId === undefined) return 0;
      try {
        return await actor.getRemainingTeamPurse(teamId);
      } catch (error) {
        if (isAuthorizationError(error)) {
          return 0;
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && teamId !== undefined,
    retry: (failureCount, error) => {
      if (isAuthorizationError(error)) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useCreateTeam() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, totalPurse, ownerPrincipals }: { name: string; totalPurse: number; ownerPrincipals: Principal[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTeam(name, totalPurse, ownerPrincipals);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTeams'] });
      queryClient.invalidateQueries({ queryKey: ['teamBudgets'] });
      queryClient.invalidateQueries({ queryKey: ['teamSummaries'] });
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
      queryClient.invalidateQueries({ queryKey: ['teamSummaries'] });
    },
  });
}

export function useUpdateTeamOwners() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, ownerPrincipals }: { teamId: bigint; ownerPrincipals: Principal[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTeamOwners(teamId, ownerPrincipals);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTeams'] });
      queryClient.invalidateQueries({ queryKey: ['teamSummaries'] });
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
      queryClient.invalidateQueries({ queryKey: ['allPlayers'] });
      queryClient.invalidateQueries({ queryKey: ['teamPlayers'] });
      queryClient.invalidateQueries({ queryKey: ['teamBudgets'] });
      queryClient.invalidateQueries({ queryKey: ['remainingPurse'] });
      queryClient.invalidateQueries({ queryKey: ['playerTeamAssignmentsWithSoldAmount'] });
      queryClient.invalidateQueries({ queryKey: ['teamSummaries'] });
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
      queryClient.invalidateQueries({ queryKey: ['allPlayers'] });
      queryClient.invalidateQueries({ queryKey: ['teamPlayers'] });
      queryClient.invalidateQueries({ queryKey: ['teamBudgets'] });
      queryClient.invalidateQueries({ queryKey: ['remainingPurse'] });
      queryClient.invalidateQueries({ queryKey: ['playerTeamAssignmentsWithSoldAmount'] });
      queryClient.invalidateQueries({ queryKey: ['teamSummaries'] });
    },
  });
}

// Auction Queries
export function useGetAuctionState(playerId?: bigint, options?: { enablePolling?: boolean }) {
  const { actor, isFetching } = useActor();

  return useQuery<AuctionState | null>({
    queryKey: ['auctionState', playerId?.toString()],
    queryFn: async () => {
      if (!actor || playerId === undefined) return null;
      try {
        return await actor.getAuctionState(playerId);
      } catch (error) {
        if (isAuthorizationError(error)) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && playerId !== undefined,
    refetchInterval: options?.enablePolling ? 3000 : false, // Poll every 3 seconds when enabled
    retry: (failureCount, error) => {
      if (isAuthorizationError(error)) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useStartAuction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playerId, startingBid, fixedIncrement }: { playerId: bigint; startingBid: number; fixedIncrement: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.startAuction(playerId, startingBid, fixedIncrement);
    },
    onSuccess: async (_, variables) => {
      // Immediate refetch
      await queryClient.refetchQueries({ queryKey: ['auctionState', variables.playerId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['allPlayers'] });
    },
  });
}

export function usePlaceBid() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playerId, teamId, bidAmount }: { playerId: bigint; teamId: bigint; bidAmount: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.placeBid(playerId, teamId, bidAmount);
    },
    onSuccess: async (_, variables) => {
      // Immediate refetch to show updated state
      await queryClient.refetchQueries({ queryKey: ['auctionState', variables.playerId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['teamBudgets'] });
      queryClient.invalidateQueries({ queryKey: ['remainingPurse'] });
    },
    onError: async (_, variables) => {
      // Refetch even on error to show current backend state (e.g., if someone else bid first)
      await queryClient.refetchQueries({ queryKey: ['auctionState', variables.playerId.toString()] });
    },
  });
}

export function useStopAuction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playerId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.stopAuction(playerId);
    },
    onSuccess: async (_, playerId) => {
      await queryClient.refetchQueries({ queryKey: ['auctionState', playerId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['allPlayers'] });
    },
  });
}

export function useAssignPlayerAfterAuction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playerId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignPlayerAfterAuction(playerId);
    },
    onSuccess: async (_, playerId) => {
      await queryClient.refetchQueries({ queryKey: ['auctionState', playerId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['allPlayers'] });
      queryClient.invalidateQueries({ queryKey: ['playerTeamAssignmentsWithSoldAmount'] });
      queryClient.invalidateQueries({ queryKey: ['teamPlayers'] });
      queryClient.invalidateQueries({ queryKey: ['teamBudgets'] });
      queryClient.invalidateQueries({ queryKey: ['remainingPurse'] });
      queryClient.invalidateQueries({ queryKey: ['teamSummaries'] });
    },
  });
}

// Team Summary Queries
export function useGetAllTeamSummaries() {
  const { actor, isFetching } = useActor();

  return useQuery<TeamSummary[]>({
    queryKey: ['teamSummaries'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllTeamSummaries();
      } catch (error) {
        if (isAuthorizationError(error)) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error) => {
      if (isAuthorizationError(error)) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Match Queries
export function useGetAllMatches() {
  const { actor, isFetching } = useActor();

  return useQuery<Match[]>({
    queryKey: ['allMatches'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllMatches();
      } catch (error) {
        if (isAuthorizationError(error)) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    retry: (failureCount, error) => {
      if (isAuthorizationError(error)) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useGetMatchById(matchId?: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Match | null>({
    queryKey: ['match', matchId?.toString()],
    queryFn: async () => {
      if (!actor || matchId === undefined) return null;
      try {
        return await actor.getMatchById(matchId);
      } catch (error) {
        if (isAuthorizationError(error)) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && matchId !== undefined,
    retry: (failureCount, error) => {
      if (isAuthorizationError(error)) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useCreateMatch() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      homeTeamId,
      awayTeamId,
      homeTeamName,
      awayTeamName,
      date,
      location,
    }: {
      homeTeamId: bigint;
      awayTeamId: bigint;
      homeTeamName: string;
      awayTeamName: string;
      date: string;
      location: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createMatch(homeTeamId, awayTeamId, homeTeamName, awayTeamName, date, location);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allMatches'] });
    },
  });
}

export function useUpdateMatchResults() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matchId,
      homeTeamRuns,
      homeTeamWickets,
      awayTeamRuns,
      awayTeamWickets,
      matchWinner,
    }: {
      matchId: bigint;
      homeTeamRuns: bigint;
      homeTeamWickets: bigint;
      awayTeamRuns: bigint;
      awayTeamWickets: bigint;
      matchWinner: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateMatchResults(matchId, homeTeamRuns, homeTeamWickets, awayTeamRuns, awayTeamWickets, matchWinner);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allMatches'] });
      queryClient.invalidateQueries({ queryKey: ['match'] });
    },
  });
}

export function useAddBatsmanPerformance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ matchId, performance }: { matchId: bigint; performance: BatsmanPerformance }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addBatsmanPerformance(matchId, performance);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allMatches'] });
      queryClient.invalidateQueries({ queryKey: ['match'] });
    },
  });
}

export function useAddBowlerPerformance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ matchId, performance }: { matchId: bigint; performance: BowlerPerformance }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addBowlerPerformance(matchId, performance);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allMatches'] });
      queryClient.invalidateQueries({ queryKey: ['match'] });
    },
  });
}

export function useAddFielderPerformance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ matchId, performance }: { matchId: bigint; performance: FielderPerformance }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addFielderPerformance(matchId, performance);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allMatches'] });
      queryClient.invalidateQueries({ queryKey: ['match'] });
    },
  });
}

// Tournament Fixtures
export function useGenerateFixtures() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tournamentName, startDate }: { tournamentName: string; startDate: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.generateFixtures(tournamentName, startDate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allMatches'] });
    },
  });
}

// Register as user
export function useRegisterAsUser() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.registerAsUser();
    },
  });
}
