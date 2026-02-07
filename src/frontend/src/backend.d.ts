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
export interface BatsmanPerformance {
    fours: bigint;
    playerId: bigint;
    runs: bigint;
    sixes: bigint;
    innings: bigint;
    ballsFaced: bigint;
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
export interface Match {
    bowlers: Array<BowlerPerformance>;
    awayTeamId: bigint;
    date: string;
    awayTeamWickets: bigint;
    awayTeamName: string;
    awayTeamRuns: bigint;
    homeTeamId: bigint;
    homeTeamWickets: bigint;
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
    addFielderPerformance(matchId: bigint, performance: FielderPerformance): Promise<void>;
    addPlayerToTeam(playerId: bigint, teamId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignPlayerAfterAuction(playerId: bigint): Promise<void>;
    createMatch(homeTeamId: bigint, awayTeamId: bigint, homeTeamName: string, awayTeamName: string, date: string, location: string): Promise<bigint>;
    createPlayer(name: string, basePrice: number): Promise<void>;
    createTeam(name: string, totalPurse: number): Promise<void>;
    deletePlayer(playerId: bigint): Promise<void>;
    getAllMatches(): Promise<Array<Match>>;
    getAllPlayers(): Promise<Array<Player>>;
    getAllTeamBudgets(): Promise<Array<TeamBudget>>;
    getAllTeams(): Promise<Array<Team>>;
    getAuctionState(playerId: bigint): Promise<AuctionState | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMatchById(matchId: bigint): Promise<Match | null>;
    getPlayerTeamAssignments(): Promise<Array<[bigint, bigint | null]>>;
    getPlayersForTeam(teamId: bigint): Promise<Array<Player>>;
    getRemainingTeamPurse(teamId: bigint): Promise<number>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    placeBid(playerId: bigint, teamId: bigint, bidAmount: number): Promise<void>;
    removePlayerFromTeam(playerId: bigint, teamId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    startAuction(playerId: bigint, startingBid: number, fixedIncrement: boolean): Promise<void>;
    stopAuction(playerId: bigint): Promise<void>;
    updateMatchResults(matchId: bigint, homeTeamRuns: bigint, homeTeamWickets: bigint, awayTeamRuns: bigint, awayTeamWickets: bigint, matchWinner: string): Promise<void>;
    updatePlayer(playerId: bigint, name: string, basePrice: number): Promise<void>;
    updateTeamPurse(teamId: bigint, newPurse: number): Promise<void>;
}
