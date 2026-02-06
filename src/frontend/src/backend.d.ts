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
    addPlayerToTeam(playerId: bigint, teamId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignPrincipalToTeam(principal: Principal, teamId: bigint): Promise<void>;
    createPlayer(name: string, basePrice: number): Promise<void>;
    createTeam(name: string, totalPurse: number): Promise<void>;
    deletePlayer(playerId: bigint): Promise<void>;
    getAllPlayers(): Promise<Array<Player>>;
    getAllTeamBudgets(): Promise<Array<TeamBudget>>;
    getAllTeams(): Promise<Array<Team>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getPlayersForTeam(teamId: bigint): Promise<Array<Player>>;
    getRemainingTeamPurse(teamId: bigint): Promise<number>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    removePlayerFromTeam(playerId: bigint, teamId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updatePlayer(playerId: bigint, name: string, basePrice: number): Promise<void>;
    updateTeamPurse(teamId: bigint, newPurse: number): Promise<void>;
}
