import Text "mo:core/Text";
import Float "mo:core/Float";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Auction data structures
  public type Player = {
    id : Nat;
    name : Text;
    basePrice : Float;
  };

  module Player {
    public func compare(player1 : Player, player2 : Player) : Order.Order {
      Nat.compare(player1.id, player2.id);
    };
  };

  public type Team = {
    id : Nat;
    name : Text;
    totalPurse : Float;
  };

  module Team {
    public func compare(team1 : Team, team2 : Team) : Order.Order {
      Nat.compare(team1.id, team2.id);
    };
  };

  public type TeamBudget = {
    team : Team;
    remainingPurse : Float;
  };

  module TeamBudget {
    public func compare(budget1 : TeamBudget, budget2 : TeamBudget) : Order.Order {
      Float.compare(budget1.remainingPurse, budget2.remainingPurse);
    };
  };

  // User Profile type
  public type UserProfile = {
    name : Text;
    teamId : ?Nat;
  };

  // Initialize persistent maps for players, teams, and team rosters
  let players = Map.empty<Nat, Player>();
  let teams = Map.empty<Nat, Team>();
  let teamRosters = Map.empty<Nat, [Nat]>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let principalToTeam = Map.empty<Principal, Nat>();

  // Persistent currentId for player and team management
  var nextPlayerId = 1;
  var nextTeamId = 1;

  // Authorization System Initialization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);

    // Update principal to team mapping if teamId is set
    switch (profile.teamId) {
      case (?teamId) {
        principalToTeam.add(caller, teamId);
      };
      case (null) {
        principalToTeam.remove(caller);
      };
    };
  };

  // Helper function to get team ID for a principal
  private func getTeamIdForPrincipal(principal : Principal) : ?Nat {
    principalToTeam.get(principal);
  };

  // Helper function to check if caller can access team data
  private func canAccessTeamData(caller : Principal, teamId : Nat) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };

    switch (getTeamIdForPrincipal(caller)) {
      case (?callerTeamId) { callerTeamId == teamId };
      case (null) { false };
    };
  };

  // Model Updates - Admin Only
  public shared ({ caller }) func createPlayer(name : Text, basePrice : Float) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create players");
    };
    let player = {
      id = nextPlayerId;
      name;
      basePrice;
    };
    players.add(nextPlayerId, player);
    nextPlayerId += 1;
  };

  public shared ({ caller }) func updatePlayer(playerId : Nat, name : Text, basePrice : Float) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update players");
    };

    if (not players.containsKey(playerId)) {
      Runtime.trap("Player does not exist");
    };

    let updatedPlayer = {
      id = playerId;
      name;
      basePrice;
    };
    players.add(playerId, updatedPlayer);
  };

  public shared ({ caller }) func deletePlayer(playerId : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete players");
    };

    if (not players.containsKey(playerId)) {
      Runtime.trap("Player does not exist");
    };

    // Remove player from all team rosters
    for (teamId in teamRosters.keys()) {
      let roster = switch (teamRosters.get(teamId)) {
        case (null) { [] };
        case (?players) { players };
      };

      let filteredRoster = roster.filter(func(id) { id != playerId });
      teamRosters.add(teamId, filteredRoster);
    };

    players.remove(playerId);
  };

  public shared ({ caller }) func createTeam(name : Text, totalPurse : Float) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create teams");
    };
    let team = {
      id = nextTeamId;
      name;
      totalPurse;
    };
    teams.add(nextTeamId, team);
    teamRosters.add(nextTeamId, []);
    nextTeamId += 1;
  };

  // Auction Logic - Admin Only
  public shared ({ caller }) func addPlayerToTeam(playerId : Nat, teamId : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can assign players to teams");
    };

    if (not players.containsKey(playerId)) {
      Runtime.trap("Player does not exist");
    };
    if (not teams.containsKey(teamId)) {
      Runtime.trap("Team does not exist");
    };

    let roster = switch (teamRosters.get(teamId)) {
      case (null) { [] };
      case (?players) { players };
    };

    if (roster.any(func(id) { id == playerId })) {
      Runtime.trap("Player already in team");
    };

    let updatedRoster = roster.concat([playerId]);
    teamRosters.add(teamId, updatedRoster);
  };

  public shared ({ caller }) func removePlayerFromTeam(playerId : Nat, teamId : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can remove players from teams");
    };

    if (not players.containsKey(playerId)) {
      Runtime.trap("Player does not exist");
    };
    if (not teams.containsKey(teamId)) {
      Runtime.trap("Team does not exist");
    };

    let roster = switch (teamRosters.get(teamId)) {
      case (null) { [] };
      case (?players) { players };
    };

    let filteredRoster = roster.filter(func(id) { id != playerId });

    if (roster.size() == filteredRoster.size()) {
      Runtime.trap("Player not in team");
    };

    teamRosters.add(teamId, filteredRoster);
  };

  public shared ({ caller }) func updateTeamPurse(teamId : Nat, newPurse : Float) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update team purse");
    };

    let team = switch (teams.get(teamId)) {
      case (null) { Runtime.trap("Team does not exist") };
      case (?t) { t };
    };

    let updatedTeam = {
      id = team.id;
      name = team.name;
      totalPurse = newPurse;
    };
    teams.add(teamId, updatedTeam);
  };

  // Computation - Team users can view their own team, admins can view any team
  public query ({ caller }) func getRemainingTeamPurse(teamId : Nat) : async Float {
    if (not canAccessTeamData(caller, teamId)) {
      Runtime.trap("Unauthorized: Can only view your own team's data");
    };

    switch (teams.get(teamId)) {
      case (null) { Runtime.trap("Team does not exist") };
      case (?team) {
        let roster = switch (teamRosters.get(teamId)) {
          case (null) { [] };
          case (?players) { players };
        };

        let totalSpent = roster.foldLeft(
          0.0,
          func(acc, playerId) {
            switch (players.get(playerId)) {
              case (null) { acc };
              case (?player) { acc + player.basePrice };
            };
          },
        );

        team.totalPurse - totalSpent;
      };
    };
  };

  // Admin-only: View all team budgets
  public query ({ caller }) func getAllTeamBudgets() : async [TeamBudget] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all team budgets");
    };

    teams.keys().toArray().map(
      func(teamId) {
        let remainingPurse = switch (teams.get(teamId)) {
          case (null) { 0.0 };
          case (?_) {
            let roster = switch (teamRosters.get(teamId)) {
              case (null) { [] };
              case (?players) { players };
            };

            let totalSpent = roster.foldLeft(
              0.0,
              func(acc, playerId) {
                switch (players.get(playerId)) {
                  case (null) { acc };
                  case (?player) { acc + player.basePrice };
                };
              },
            );

            switch (teams.get(teamId)) {
              case (null) { 0.0 };
              case (?team) { team.totalPurse - totalSpent };
            };
          };
        };

        let team = switch (teams.get(teamId)) {
          case (null) { Runtime.trap("Team does not exist") };
          case (?t) { t };
        };
        {
          team;
          remainingPurse;
        };
      }
    ).sort();
  };

  // Query - Team users can view their own roster, admins can view any roster
  public query ({ caller }) func getPlayersForTeam(teamId : Nat) : async [Player] {
    if (not canAccessTeamData(caller, teamId)) {
      Runtime.trap("Unauthorized: Can only view your own team's roster");
    };

    switch (teams.get(teamId)) {
      case (null) { Runtime.trap("Team does not exist") };
      case (?_) {
        let playerIds = switch (teamRosters.get(teamId)) {
          case (null) { [] };
          case (?players) { players };
        };

        playerIds.map(
          func(playerId) {
            switch (players.get(playerId)) {
              case (null) { Runtime.trap("Player not found") };
              case (?player) { player };
            };
          }
        );
      };
    };
  };

  // Admin-only: Get all players
  public query ({ caller }) func getAllPlayers() : async [Player] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all players");
    };

    players.values().toArray();
  };

  // Admin-only: Get all teams
  public query ({ caller }) func getAllTeams() : async [Team] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all teams");
    };

    teams.values().toArray();
  };

  // Admin-only: Associate a principal with a team
  public shared ({ caller }) func assignPrincipalToTeam(principal : Principal, teamId : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can assign principals to teams");
    };

    if (not teams.containsKey(teamId)) {
      Runtime.trap("Team does not exist");
    };

    principalToTeam.add(principal, teamId);
  };
};
