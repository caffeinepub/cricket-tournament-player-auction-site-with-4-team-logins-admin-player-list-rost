import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type {
  Player,
  Team,
  TeamExtended,
  TeamBudget,
  AuctionState,
  UserProfile,
  MatchView,
  MatchListView,
  BatsmanPerformance,
  BowlerPerformance,
  FielderPerformance,
  TeamSummary,
  InningBallByBall,
  UserRole,
} from '../backend';
import { Principal } from '@dfinity/principal';

// User Role Query
export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ['currentUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

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
      await actor.registerAsUser();
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
    queryKey: ['players'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPlayers();
    },
    enabled: !!actor && !isFetching,
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
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['playerAssignments'] });
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
      queryClient.invalidateQueries({ queryKey: ['players'] });
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
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['playerAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['teamSummaries'] });
    },
  });
}

// Team Queries
export function useGetAllTeams() {
  const { actor, isFetching } = useActor();

  return useQuery<TeamExtended[]>({
    queryKey: ['teams'],
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

export function useGetRemainingTeamPurse(teamId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ['teamPurse', teamId?.toString()],
    queryFn: async () => {
      if (!actor || !teamId) return 0;
      return actor.getRemainingTeamPurse(teamId);
    },
    enabled: !!actor && !isFetching && !!teamId,
  });
}

export function useCreateTeam() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      totalPurse,
      ownerPrincipals,
    }: {
      name: string;
      totalPurse: number;
      ownerPrincipals: Principal[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTeam(name, totalPurse, ownerPrincipals);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
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
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['teamBudgets'] });
    },
  });
}

export function useChangeTeamName() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, name }: { teamId: bigint; name: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.changeTeamName(teamId, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['teamSummaries'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
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
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

// Player Assignment Queries
export function useGetPlayerTeamAssignmentsWithSoldAmount() {
  const { actor, isFetching } = useActor();

  return useQuery<[bigint, bigint | null, number][]>({
    queryKey: ['playerAssignments'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPlayerTeamAssignmentsWithSoldAmount();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPlayersForTeam(teamId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Player[]>({
    queryKey: ['teamPlayers', teamId?.toString()],
    queryFn: async () => {
      if (!actor || !teamId) return [];
      return actor.getPlayersForTeam(teamId);
    },
    enabled: !!actor && !isFetching && !!teamId,
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
      queryClient.invalidateQueries({ queryKey: ['teamBudgets'] });
      queryClient.invalidateQueries({ queryKey: ['teamSummaries'] });
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
      queryClient.invalidateQueries({ queryKey: ['teamBudgets'] });
      queryClient.invalidateQueries({ queryKey: ['teamSummaries'] });
      queryClient.invalidateQueries({ queryKey: ['teamPlayers'] });
    },
  });
}

// Auction Queries
export function useGetAuctionState(playerId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<AuctionState | null>({
    queryKey: ['auction', playerId.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAuctionState(playerId);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 3000,
  });
}

export function useStartAuction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playerId,
      startingBid,
      fixedIncrement,
    }: {
      playerId: bigint;
      startingBid: number;
      fixedIncrement: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.startAuction(playerId, startingBid, fixedIncrement);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auction', variables.playerId.toString()] });
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
      queryClient.invalidateQueries({ queryKey: ['auction', variables.playerId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['teamBudgets'] });
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
      queryClient.invalidateQueries({ queryKey: ['auction', playerId.toString()] });
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
      queryClient.invalidateQueries({ queryKey: ['auction', playerId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['playerAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['teamBudgets'] });
      queryClient.invalidateQueries({ queryKey: ['teamSummaries'] });
      queryClient.invalidateQueries({ queryKey: ['teamPlayers'] });
    },
  });
}

// Match Queries
export function useGetAllMatches() {
  const { actor, isFetching } = useActor();

  return useQuery<MatchListView[]>({
    queryKey: ['matches'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMatchesWithMetadata();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMatchById(matchId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<MatchView | null>({
    queryKey: ['match', matchId.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMatchById(matchId);
    },
    enabled: !!actor && !isFetching,
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
      queryClient.invalidateQueries({ queryKey: ['matches'] });
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['match', variables.matchId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['publishedScorecard'] });
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['match', variables.matchId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['publishedScorecard'] });
    },
  });
}

export function useAddBowlerPerformance() {
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['match', variables.matchId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['publishedScorecard'] });
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['match', variables.matchId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['publishedScorecard'] });
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['match', variables.matchId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['publishedScorecard'] });
    },
  });
}

export function usePublishScorecard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ matchId, shareableId }: { matchId: bigint; shareableId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.publishScorecard(matchId, shareableId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useUnpublishScorecard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (matchId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.unpublishScorecard(matchId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useGetPublishedScorecard(shareableId: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<MatchView | null>({
    queryKey: ['publishedScorecard', shareableId],
    queryFn: async () => {
      if (!actor || !shareableId) return null;
      return actor.getPublishedScorecardByShareableId(shareableId);
    },
    enabled: !!actor && !isFetching && !!shareableId,
    refetchInterval: (query) => {
      return query.state.data ? 3000 : false;
    },
    refetchIntervalInBackground: true,
  });
}

export function useUpdateBallByBallData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ matchId, ballByBallData }: { matchId: bigint; ballByBallData: InningBallByBall[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateBallByBallData(matchId, ballByBallData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['match', variables.matchId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['publishedScorecard'] });
    },
  });
}

export function useGetAllTeamSummaries() {
  const { actor, isFetching } = useActor();

  return useQuery<TeamSummary[]>({
    queryKey: ['teamSummaries'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTeamSummaries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGenerateFixtures() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tournamentName, startDate }: { tournamentName: string; startDate: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.generateFixtures(tournamentName, startDate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

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
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useGetOwnerName(owner: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<string | null>({
    queryKey: ['ownerName', owner?.toString()],
    queryFn: async () => {
      if (!actor || !owner) return null;
      return actor.getOwnerName(owner);
    },
    enabled: !!actor && !isFetching && !!owner,
  });
}

export function useGetAllOwnerNames() {
  const { actor, isFetching } = useActor();

  return useQuery<[Principal, string][]>({
    queryKey: ['ownerNames'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllOwnerNames();
    },
    enabled: !!actor && !isFetching,
  });
}
