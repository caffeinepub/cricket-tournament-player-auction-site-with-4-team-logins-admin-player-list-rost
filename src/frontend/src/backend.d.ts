import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Player {
    id: bigint;
    name: string;
    basePrice: number;
}
export interface BowlerPerformance {
    maidens: bigint;
    overs: number;
    playerId: bigint;
    wickets: bigint;
    ballsBowled: bigint;
    runsConceded: bigint;
}
export interface TeamExtended {
    id: bigint;
    ownerPrincipals: Array<Principal>;
    name: string;
    totalPurse: number;
}
export interface BatsmanPerformance {
    fours: bigint;
    playerId: bigint;
    runs: bigint;
    sixes: bigint;
    innings: bigint;
    ballsFaced: bigint;
}
export interface TeamSummary {
    team: TeamExtended;
    remainingPurse: number;
    roster: Array<[Player, number]>;
}
export interface FielderPerformance {
    stumpings: bigint;
    playerId: bigint;
    dismissals: bigint;
    catches: bigint;
}
export interface AuctionState {
    isStopped: boolean;
    playerId: bigint;
    highestBid: number;
    isFinalized: boolean;
    highestBidTeamId?: bigint;
    isAssigning: boolean;
    fixedIncrement: boolean;
    startingBid: number;
}
export interface MatchView {
    bowlers: Array<BowlerPerformance>;
    awayTeamId: bigint;
    date: string;
    awayTeamWickets: bigint;
    awayTeamName: string;
    awayTeamRuns: bigint;
    homeTeamId: bigint;
    bowlersByInnings: Array<[bigint, Array<BowlerPerformance>]>;
    homeTeamWickets: bigint;
    matchId: bigint;
    homeTeamName: string;
    homeTeamRuns: bigint;
    fielders: Array<FielderPerformance>;
    batsmen: Array<BatsmanPerformance>;
    matchWinner: string;
    location: string;
}
export interface TeamBudget {
    team: Team;
    remainingPurse: number;
}
export interface UserProfile {
    name: string;
    teamId?: bigint;
}
export interface Team {
    id: bigint;
    name: string;
    totalPurse: number;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addBatsmanPerformance(matchId: bigint, performance: BatsmanPerformance): Promise<void>;
    addBowlerPerformance(matchId: bigint, performance: BowlerPerformance): Promise<void>;
    addBowlerPerformanceWithInnings(matchId: bigint, performance: BowlerPerformance, innings: bigint): Promise<void>;
    addFielderPerformance(matchId: bigint, performance: FielderPerformance): Promise<void>;
    addPlayerToTeam(playerId: bigint, teamId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignPlayerAfterAuction(playerId: bigint): Promise<void>;
    /**
     * / Change the name of an owner. Any authenticated user can set owner names.
     */
    changeOwnerName(owner: Principal, name: string): Promise<void>;
    /**
     * / Change the name of a team. Any authenticated user can change team names.
     */
    changeTeamName(teamId: bigint, name: string): Promise<void>;
    clearOwnerName(owner: Principal): Promise<void>;
    createMatch(homeTeamId: bigint, awayTeamId: bigint, homeTeamName: string, awayTeamName: string, date: string, location: string): Promise<bigint>;
    createPlayer(name: string, basePrice: number): Promise<void>;
    createTeam(name: string, totalPurse: number, ownerPrincipals: Array<Principal>): Promise<void>;
    deletePlayer(playerId: bigint): Promise<void>;
    generateFixtures(tournamentName: string, startDate: string): Promise<void>;
    getAllMatches(): Promise<Array<[bigint, MatchView]>>;
    getAllOwnerNames(): Promise<Array<[Principal, string]>>;
    getAllPlayers(): Promise<Array<Player>>;
    getAllTeamBudgets(): Promise<Array<TeamBudget>>;
    getAllTeamSummaries(): Promise<Array<TeamSummary>>;
    getAllTeams(): Promise<Array<TeamExtended>>;
    getAuctionState(playerId: bigint): Promise<AuctionState | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getExportData(): Promise<[Array<TeamSummary>, Array<TeamExtended>, Array<Player>]>;
    getMatchById(matchId: bigint): Promise<MatchView | null>;
    getOwnerName(owner: Principal): Promise<string | null>;
    getPlayerTeamAssignmentsWithSoldAmount(): Promise<Array<[bigint, bigint | null, number]>>;
    getPlayersForTeam(teamId: bigint): Promise<Array<Player>>;
    getRemainingTeamPurse(teamId: bigint): Promise<number>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    placeBid(playerId: bigint, teamId: bigint, bidAmount: number): Promise<void>;
    /**
     * / Self-registration: any authenticated (non-anonymous) principal can register as a user
     */
    registerAsUser(): Promise<void>;
    removePlayerFromTeam(playerId: bigint, teamId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    startAuction(playerId: bigint, startingBid: number, fixedIncrement: boolean): Promise<void>;
    stopAuction(playerId: bigint): Promise<void>;
    updateBowlerPerformance(matchId: bigint, performance: BowlerPerformance, innings: bigint): Promise<void>;
    updateBowlerPerformanceForUpdate(matchId: bigint, playerId: bigint, innings: bigint, updatedPerformance: BowlerPerformance): Promise<void>;
    updateInningsStart(matchId: bigint, innings: bigint): Promise<void>;
    updateMatchResults(matchId: bigint, homeTeamRuns: bigint, homeTeamWickets: bigint, awayTeamRuns: bigint, awayTeamWickets: bigint, matchWinner: string): Promise<void>;
    updatePlayer(playerId: bigint, name: string, basePrice: number): Promise<void>;
    updateTeamOwners(teamId: bigint, newOwnerPrincipals: Array<Principal>): Promise<void>;
    updateTeamPurse(teamId: bigint, newPurse: number): Promise<void>;
}
