import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Player, Team, TeamExtended, TeamBudget, UserProfile, MatchView, BatsmanPerformance, BowlerPerformance, FielderPerformance, AuctionState, TeamSummary } from '../backend';
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
      queryClient.invalidateQueries({ queryKey: ['allMatches'] });
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
      queryClient.invalidateQueries({ queryKey: ['playerAssignments'] });
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
    queryKey: ['allTeamBudgets'],
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
    queryKey: ['remainingTeamPurse', teamId?.toString()],
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
      queryClient.invalidateQueries({ queryKey: ['allTeamBudgets'] });
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
      queryClient.invalidateQueries({ queryKey: ['allTeamBudgets'] });
    },
  });
}

export function useUpdateTeamOwners() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, newOwnerPrincipals }: { teamId: bigint; newOwnerPrincipals: Principal[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTeamOwners(teamId, newOwnerPrincipals);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTeams'] });
    },
  });
}

export function useAddPlayerToTeam() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playerId, teamId }: { playerId: bigint; teamId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addPlayerToTeam(playerId, teamId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['allTeamBudgets'] });
      queryClient.invalidateQueries({ queryKey: ['teamPlayers'] });
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
      queryClient.invalidateQueries({ queryKey: ['playerAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['allTeamBudgets'] });
      queryClient.invalidateQueries({ queryKey: ['teamPlayers'] });
    },
  });
}

// Match Queries
export function useGetAllMatches() {
  const { actor, isFetching } = useActor();

  return useQuery<MatchView[]>({
    queryKey: ['allMatches'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const matchesArray = await actor.getAllMatches();
        // Convert the array of [bigint, MatchView] to MatchView[]
        return matchesArray.map(([_, match]) => match);
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
    },
  });
}

// Per-innings scorecard mutations
export function useAddBatsmanPerformance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matchId,
      performance,
    }: {
      matchId: bigint;
      performance: BatsmanPerformance;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addBatsmanPerformance(matchId, performance);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allMatches'] });
    },
    onError: (error: any) => {
      if (isAuthorizationError(error)) {
        throw new Error('You are not authorized to modify this match. Only admins or team owners can edit match data.');
      }
      throw error;
    },
  });
}

export function useUpdateBowlerPerformance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matchId,
      performance,
      innings,
    }: {
      matchId: bigint;
      performance: BowlerPerformance;
      innings: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateBowlerPerformance(matchId, performance, innings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allMatches'] });
    },
    onError: (error: any) => {
      if (isAuthorizationError(error)) {
        throw new Error('You are not authorized to modify this match. Only admins or team owners can edit match data.');
      }
      throw error;
    },
  });
}

export function useUpdateBowlerPerformanceForUpdate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matchId,
      playerId,
      innings,
      updatedPerformance,
    }: {
      matchId: bigint;
      playerId: bigint;
      innings: bigint;
      updatedPerformance: BowlerPerformance;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateBowlerPerformanceForUpdate(matchId, playerId, innings, updatedPerformance);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allMatches'] });
    },
    onError: (error: any) => {
      if (isAuthorizationError(error)) {
        throw new Error('You are not authorized to modify this match. Only admins or team owners can edit match data.');
      }
      throw error;
    },
  });
}

// Auction Queries
export function useGetAuctionState(playerId?: bigint) {
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
    refetchInterval: 3000, // Poll every 3 seconds
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auctionState', variables.playerId.toString()] });
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auctionState', variables.playerId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['allTeamBudgets'] });
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
    onSuccess: (_, playerId) => {
      queryClient.invalidateQueries({ queryKey: ['auctionState', playerId.toString()] });
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
    onSuccess: (_, playerId) => {
      queryClient.invalidateQueries({ queryKey: ['auctionState', playerId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['playerAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['allTeamBudgets'] });
      queryClient.invalidateQueries({ queryKey: ['teamPlayers'] });
    },
  });
}

// Player Assignment Queries
export function useGetPlayerAssignments() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[bigint, bigint | null, number]>>({
    queryKey: ['playerAssignments'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getPlayerTeamAssignmentsWithSoldAmount();
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

export function useGetPlayerTeamAssignmentsWithSoldAmount() {
  return useGetPlayerAssignments();
}

// Team Summary Queries
export function useGetAllTeamSummaries() {
  const { actor, isFetching } = useActor();

  return useQuery<TeamSummary[]>({
    queryKey: ['allTeamSummaries'],
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

// Tournament Queries
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

// Team Name Change
export function useChangeTeamName() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, name }: { teamId: bigint; name: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.changeTeamName(teamId, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTeams'] });
      queryClient.invalidateQueries({ queryKey: ['allTeamBudgets'] });
      queryClient.invalidateQueries({ queryKey: ['allTeamSummaries'] });
      queryClient.invalidateQueries({ queryKey: ['allMatches'] });
    },
  });
}

// Owner Name Management
export function useChangeOwnerName() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ owner, name }: { owner: Principal; name: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.changeOwnerName(owner, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerNames'] });
    },
  });
}

export function useGetOwnerName(owner?: Principal) {
  const { actor, isFetching } = useActor();

  return useQuery<string | null>({
    queryKey: ['ownerName', owner?.toString()],
    queryFn: async () => {
      if (!actor || !owner) return null;
      try {
        return await actor.getOwnerName(owner);
      } catch (error) {
        if (isAuthorizationError(error)) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !!owner,
    retry: (failureCount, error) => {
      if (isAuthorizationError(error)) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useGetAllOwnerNames() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[Principal, string]>>({
    queryKey: ['ownerNames'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllOwnerNames();
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

export function useClearOwnerName() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (owner: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.clearOwnerName(owner);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerNames'] });
    },
  });
}

// User Registration
export function useRegisterAsUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.registerAsUser();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}
