import Float "mo:core/Float";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Array "mo:core/Array";
import AccessControl "authorization/access-control";

import MixinAuthorization "authorization/MixinAuthorization";

import FielderPerformance "FielderPerformance";
import BatsmanPerformance "BatsmanPerformance";
import BowlerPerformance "BowlerPerformance";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type Player = {
    id : Nat;
    name : Text;
    basePrice : Float;
  };

  public type Team = {
    id : Nat;
    name : Text;
    totalPurse : Float;
  };

  public type TeamExtended = {
    id : Nat;
    name : Text;
    totalPurse : Float;
    ownerPrincipals : [Principal];
  };

  public type TeamBudget = {
    team : Team;
    remainingPurse : Float;
  };

  public type Match = {
    matchId : Nat;
    homeTeamId : Nat;
    awayTeamId : Nat;
    homeTeamName : Text;
    awayTeamName : Text;
    homeTeamRuns : Nat;
    homeTeamWickets : Nat;
    awayTeamRuns : Nat;
    awayTeamWickets : Nat;
    date : Text;
    location : Text;
    batsmen : [BatsmanPerformance.BatsmanPerformance];
    bowlers : [BowlerPerformance.BowlerPerformance];
    bowlersByInnings : Map.Map<Nat, [BowlerPerformance.BowlerPerformance]>;
    fielders : [FielderPerformance.FielderPerformance];
    matchWinner : Text;
    isPublished : Bool;
    shareableId : ?Text;
    ballByBallData : ?[InningBallByBall];
  };

  public type InningBallByBall = {
    inningNumber : Nat;
    overNumber : Nat;
    balls : [BallOutcome];
  };

  public type BallOutcome = {
    batsman : Text;
    bowler : Text;
    runs : Nat;
    runsRemainingInOver : Nat;
    runsRemainingInInnings : Nat;
    wicket : Bool;
    wicketRemainingInOver : Nat;
    wicketsRemainingInInnings : Nat;
    typeOfDismissal : ?Text;
  };

  public type MatchView = {
    matchId : Nat;
    homeTeamId : Nat;
    awayTeamId : Nat;
    homeTeamName : Text;
    awayTeamName : Text;
    homeTeamRuns : Nat;
    homeTeamWickets : Nat;
    awayTeamRuns : Nat;
    awayTeamWickets : Nat;
    date : Text;
    location : Text;
    batsmen : [BatsmanPerformance.BatsmanPerformance];
    bowlers : [BowlerPerformance.BowlerPerformance];
    bowlersByInnings : [(Nat, [BowlerPerformance.BowlerPerformance])];
    fielders : [FielderPerformance.FielderPerformance];
    matchWinner : Text;
    ballByBallData : ?[InningBallByBall];
  };

  public type Scorecard = {
    runs : Nat;
    wickets : Nat;
    bowlOvers : Float;
    maidens : Nat;
    runsConceded : Nat;
    ballsBowled : Nat;
    innings : Nat;
    dismissals : Nat;
    catches : Nat;
    stumpings : Nat;
  };

  public type UserProfile = {
    name : Text;
    teamId : ?Nat;
  };

  public type AuctionState = {
    playerId : Nat;
    startingBid : Float;
    highestBid : Float;
    highestBidTeamId : ?Nat;
    isFinalized : Bool;
    isStopped : Bool;
    isAssigning : Bool;
    fixedIncrement : Bool;
  };

  public type PlayerAssignment = {
    teamId : Nat;
    soldAmount : Float;
  };

  public type TeamSummary = {
    team : TeamExtended;
    remainingPurse : Float;
    roster : [(Player, Float)];
  };

  public type MatchListView = {
    matchId : Nat;
    homeTeamId : Nat;
    awayTeamId : Nat;
    homeTeamName : Text;
    awayTeamName : Text;
    homeTeamRuns : Nat;
    homeTeamWickets : Nat;
    awayTeamRuns : Nat;
    awayTeamWickets : Nat;
    date : Text;
    location : Text;
    batsmen : [BatsmanPerformance.BatsmanPerformance];
    bowlers : [BowlerPerformance.BowlerPerformance];
    bowlersByInnings : [(Nat, [BowlerPerformance.BowlerPerformance])];
    fielders : [FielderPerformance.FielderPerformance];
    matchWinner : Text;
    ballByBallData : ?[InningBallByBall];
    isPublished : Bool;
    shareableId : ?Text;
  };

  // Persistent storage
  let players = Map.empty<Nat, Player>();
  let teams = Map.empty<Nat, TeamExtended>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let playerToTeam = Map.empty<Nat, Nat>();
  let matches = Map.empty<Nat, Match>();
  let auctions = Map.empty<Nat, AuctionState>();
  let playerAssignments = Map.empty<Nat, PlayerAssignment>();
  let ownerNames = Map.empty<Principal, Text>();

  var nextPlayerId = 1;
  var nextTeamId = 1;
  var nextMatchId = 1;

  func comparePlayer(player1 : Player, player2 : Player) : Order.Order {
    Nat.compare(player1.id, player2.id);
  };
  func compareTeam(team1 : Team, team2 : Team) : Order.Order {
    Nat.compare(team1.id, team2.id);
  };
  func compareTeamBudget(budget1 : TeamBudget, budget2 : TeamBudget) : Order.Order {
    Float.compare(budget1.remainingPurse, budget2.remainingPurse);
  };
  func compareMatch(match1 : Match, match2 : Match) : Order.Order {
    Text.compare(match1.date, match2.date);
  };

  func calculateRemainingPurse(teamId : Nat) : Float {
    switch (teams.get(teamId)) {
      case (null) { 0.0 };
      case (?team) {
        let totalSpent = playerAssignments.values().toArray().filter(
          func(assignment) {
            assignment.teamId == teamId;
          }
        ).foldLeft(
          0.0,
          func(acc, assignment) {
            acc + assignment.soldAmount;
          },
        );
        team.totalPurse - totalSpent;
      };
    };
  };

  func arrayContains<T>(array : [T], value : T, equal : (T, T) -> Bool) : Bool {
    for (item in array.values()) {
      if (equal(item, value)) { return true };
    };
    false;
  };

  func isTeamOwner(caller : Principal, teamId : Nat) : Bool {
    switch (teams.get(teamId)) {
      case (null) { false };
      case (?team) {
        arrayContains<Principal>(
          team.ownerPrincipals,
          caller,
          func(x, y) { x == y },
        );
      };
    };
  };

  func canModifyMatch(caller : Principal, match : Match) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };
    isTeamOwner(caller, match.homeTeamId) or isTeamOwner(caller, match.awayTeamId);
  };

  func canCreateMatchForTeams(caller : Principal, homeTeamId : Nat, awayTeamId : Nat) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };
    isTeamOwner(caller, homeTeamId) or isTeamOwner(caller, awayTeamId);
  };

  func filterTeamOwners(caller : Principal, team : TeamExtended) : TeamExtended {
    if (
      AccessControl.isAdmin(accessControlState, caller) or arrayContains<Principal>(team.ownerPrincipals, caller, func(x, y) { x == y })
    ) {
      team;
    } else {
      {
        team with
        ownerPrincipals = [];
      };
    };
  };

  /// Self-registration: any authenticated (non-anonymous) principal can register as a user
  public shared ({ caller }) func registerAsUser() : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot register as users");
    };

    // Check if already has user or admin role
    let currentRole = AccessControl.getUserRole(accessControlState, caller);
    switch (currentRole) {
      case (#admin) { return };
      case (#user) { return };
      case (#guest) {
        AccessControl.assignRole(accessControlState, caller, caller, #user);
      };
    };
  };

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

  public shared ({ caller }) func saveCallerUserProfile(
    profile : UserProfile,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func createPlayer(name : Text, basePrice : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create players");
    };
    let player = { id = nextPlayerId; name; basePrice };
    players.add(nextPlayerId, player);
    nextPlayerId += 1;
  };

  public shared ({ caller }) func updatePlayer(playerId : Nat, name : Text, basePrice : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update players");
    };
    if (not players.containsKey(playerId)) {
      Runtime.trap("Player does not exist");
    };
    let updatedPlayer = { id = playerId; name; basePrice };
    players.add(playerId, updatedPlayer);
  };

  public shared ({ caller }) func deletePlayer(playerId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete players");
    };
    if (not players.containsKey(playerId)) {
      Runtime.trap("Player does not exist");
    };
    playerAssignments.remove(playerId);
    players.remove(playerId);
  };

  public shared ({ caller }) func createTeam(name : Text, totalPurse : Float, ownerPrincipals : [Principal]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create teams");
    };
    let team = {
      id = nextTeamId;
      name;
      totalPurse;
      ownerPrincipals;
    };
    teams.add(nextTeamId, team);
    nextTeamId += 1;
  };

  public shared ({ caller }) func updateTeamOwners(teamId : Nat, newOwnerPrincipals : [Principal]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update team owners");
    };
    let team = switch (teams.get(teamId)) {
      case (null) { Runtime.trap("Team does not exist") };
      case (?t) { t };
    };
    let updatedTeam = {
      id = team.id;
      name = team.name;
      totalPurse = team.totalPurse;
      ownerPrincipals = newOwnerPrincipals;
    };
    teams.add(teamId, updatedTeam);
  };

  public shared ({ caller }) func addPlayerToTeam(playerId : Nat, teamId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add players to teams");
    };
    if (not players.containsKey(playerId)) {
      Runtime.trap("Player does not exist");
    };
    if (not teams.containsKey(teamId)) {
      Runtime.trap("Team does not exist");
    };
    let currentTeam = switch (playerAssignments.get(playerId)) {
      case (null) { null };
      case (?assignment) { ?assignment.teamId };
    };
    switch (currentTeam) {
      case (?existingTeam) {
        if (existingTeam == teamId) {
          Runtime.trap("Player already in this team");
        };
      };
      case (null) {};
    };

    // Use base price as sold amount for manual assignment
    switch (players.get(playerId)) {
      case (null) { Runtime.trap("Player does not exist") };
      case (?player) {
        playerAssignments.add(playerId, { teamId; soldAmount = player.basePrice });
      };
    };
  };

  public shared ({ caller }) func removePlayerFromTeam(playerId : Nat, teamId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove players from teams");
    };
    if (not players.containsKey(playerId)) {
      Runtime.trap("Player does not exist");
    };
    if (not teams.containsKey(teamId)) {
      Runtime.trap("Team does not exist");
    };
    let currentTeam = switch (playerAssignments.get(playerId)) {
      case (null) { null };
      case (?assignment) { ?assignment.teamId };
    };
    switch (currentTeam) {
      case (?existingTeam) {
        if (existingTeam == teamId) {
          playerAssignments.remove(playerId);
        } else {
          Runtime.trap("Player is not in the specified team");
        };
      };
      case (null) {
        Runtime.trap("Player is not assigned to any team");
      };
    };
  };

  public shared ({ caller }) func updateTeamPurse(teamId : Nat, newPurse : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update team purse");
    };
    let team = switch (teams.get(teamId)) {
      case (null) { Runtime.trap("Team does not exist") };
      case (?t) { t };
    };
    let updatedTeam = {
      id = team.id;
      name = team.name;
      totalPurse = newPurse;
      ownerPrincipals = team.ownerPrincipals;
    };
    teams.add(teamId, updatedTeam);
  };

  public query ({ caller }) func getRemainingTeamPurse(teamId : Nat) : async Float {
    switch (teams.get(teamId)) {
      case (null) { Runtime.trap("Team does not exist") };
      case (?team) {
        calculateRemainingPurse(teamId);
      };
    };
  };

  public shared ({ caller }) func createMatch(
    homeTeamId : Nat,
    awayTeamId : Nat,
    homeTeamName : Text,
    awayTeamName : Text,
    date : Text,
    location : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create matches");
    };
    if (homeTeamId == awayTeamId) {
      Runtime.trap("A team cannot play against itself");
    };
    if (not canCreateMatchForTeams(caller, homeTeamId, awayTeamId)) {
      Runtime.trap("Unauthorized: Only admins or team owners can create matches for their teams");
    };
    let match = {
      matchId = nextMatchId;
      homeTeamId;
      awayTeamId;
      homeTeamName;
      awayTeamName;
      homeTeamRuns = 0;
      homeTeamWickets = 0;
      awayTeamRuns = 0;
      awayTeamWickets = 0;
      date;
      location;
      batsmen = [];
      bowlers = [];
      bowlersByInnings = Map.empty<Nat, [BowlerPerformance.BowlerPerformance]>();
      fielders = [];
      matchWinner = "";
      isPublished = false; // default is unpublished
      shareableId = null;
      ballByBallData = null;
    };
    let matchId = nextMatchId;
    matches.add(matchId, match);
    nextMatchId += 1;
    matchId;
  };

  public shared ({ caller }) func publishScorecard(matchId : Nat, shareableId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can publish scorecards");
    };
    switch (matches.get(matchId)) {
      case (null) { Runtime.trap("Match with given ID does not exist") };
      case (?match) {
        if (not canModifyMatch(caller, match)) {
          Runtime.trap("Unauthorized: Only admins or team owners can publish scorecards");
        };
        // Ensure shareableId is unique
        let matchesArr = matches.values().toArray();
        if (
          matchesArr.any(
            func(existingMatch) {
              existingMatch.isPublished and existingMatch.shareableId == ?shareableId
            }
          )
        ) {
          Runtime.trap("ShareableId must be unique");
        };

        let updatedMatch = {
          match with
          isPublished = true;
          shareableId = ?shareableId;
        };
        matches.add(matchId, updatedMatch);
      };
    };
  };

  public shared ({ caller }) func unpublishScorecard(matchId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unpublish scorecards");
    };
    switch (matches.get(matchId)) {
      case (null) { Runtime.trap("Match with given ID does not exist") };
      case (?match) {
        if (not canModifyMatch(caller, match)) {
          Runtime.trap("Unauthorized: Only admins or team owners can unpublish scorecards");
        };
        let updatedMatch = {
          match with
          isPublished = false;
          shareableId = null;
        };
        matches.add(matchId, updatedMatch);
      };
    };
  };

  public query ({ caller }) func getAllMatches() : async [(Nat, MatchView)] {
    matches.toArray().map(func((k, v)) { (k, toMatchView(v)) });
  };

  public query ({ caller }) func getMatchById(matchId : Nat) : async ?MatchView {
    switch (matches.get(matchId)) {
      case (null) { null };
      case (?match) { ?toMatchView(match) };
    };
  };

  // Public endpoint: Anyone (including anonymous guests) can view published scorecards via shareable link
  public query ({ caller }) func getPublishedScorecardByShareableId(shareableId : Text) : async ?MatchView {
    // No authorization check - this is intentionally public for anonymous access
    let matchesArr = matches.values().toArray();
    let matching = matchesArr.find(
      func(match) {
        match.isPublished and match.shareableId == ?shareableId;
      }
    );
    switch (matching) {
      case (null) { null };
      case (?match) { ?toMatchView(match) };
    };
  };

  public query ({ caller }) func getAllMatchesWithMetadata() : async [MatchListView] {
    matches.values().toArray().map<Match, MatchListView>(
      func(v) {
        let bowlersByInningsArray = v.bowlersByInnings.toArray();
        {
          matchId = v.matchId;
          homeTeamId = v.homeTeamId;
          awayTeamId = v.awayTeamId;
          homeTeamName = v.homeTeamName;
          awayTeamName = v.awayTeamName;
          homeTeamRuns = v.homeTeamRuns;
          homeTeamWickets = v.homeTeamWickets;
          awayTeamRuns = v.awayTeamRuns;
          awayTeamWickets = v.awayTeamWickets;
          date = v.date;
          location = v.location;
          batsmen = v.batsmen;
          bowlers = v.bowlers;
          bowlersByInnings = bowlersByInningsArray;
          fielders = v.fielders;
          matchWinner = v.matchWinner;
          ballByBallData = v.ballByBallData;
          isPublished = v.isPublished;
          shareableId = v.shareableId;
        };
      }
    );
  };

  public shared ({ caller }) func addBatsmanPerformance(matchId : Nat, performance : BatsmanPerformance.BatsmanPerformance) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can modify match performance data");
    };
    switch (matches.get(matchId)) {
      case (null) { Runtime.trap("Match with given ID does not exist") };
      case (?match) {
        if (not canModifyMatch(caller, match)) {
          Runtime.trap("Unauthorized: Only admins or team owners can modify match performance data");
        };
        let batsmanArray = match.batsmen.concat([performance]);
        let updatedMatch = {
          match with
          batsmen = batsmanArray;
        };
        matches.add(matchId, updatedMatch);
      };
    };
  };

  public shared ({ caller }) func addBowlerPerformance(matchId : Nat, performance : BowlerPerformance.BowlerPerformance) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can modify match performance data");
    };
    switch (matches.get(matchId)) {
      case (null) { Runtime.trap("Match with given ID does not exist") };
      case (?match) {
        if (not canModifyMatch(caller, match)) {
          Runtime.trap("Unauthorized: Only admins or team owners can modify match performance data");
        };

        let bowlers = match.bowlers.concat([performance]);
        let updatedMatch = { match with bowlers };
        matches.add(matchId, updatedMatch);
      };
    };
  };

  public shared ({ caller }) func addBowlerPerformanceWithInnings(matchId : Nat, performance : BowlerPerformance.BowlerPerformance, innings : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can modify match performance data");
    };
    switch (matches.get(matchId)) {
      case (null) { Runtime.trap("Match with given ID does not exist") };
      case (?match) {
        if (not canModifyMatch(caller, match)) {
          Runtime.trap("Unauthorized: Only admins or team owners can modify match performance data");
        };

        let newOverArray = [performance];
        let updatedBowlersByInnings = Map.empty<Nat, [BowlerPerformance.BowlerPerformance]>();
        updatedBowlersByInnings.add(innings, newOverArray);
        let updatedMatch = { match with bowlersByInnings = updatedBowlersByInnings };
        matches.add(matchId, updatedMatch);
      };
    };
  };

  public shared ({ caller }) func updateBowlerPerformance(matchId : Nat, performance : BowlerPerformance.BowlerPerformance, innings : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can modify match performance data");
    };
    switch (matches.get(matchId)) {
      case (null) { Runtime.trap("Match with given ID does not exist") };
      case (?match) {
        if (not canModifyMatch(caller, match)) {
          Runtime.trap("Unauthorized: Only admins or team owners can modify match performance data");
        };

        let existingOvr = switch (match.bowlersByInnings.get(innings)) {
          case (null) {
            let newOverArray = [performance];
            let updatedMatch = {
              match with
              bowlersByInnings = match.bowlersByInnings;
            };
            updatedMatch.bowlersByInnings.add(innings, newOverArray);
            matches.add(matchId, updatedMatch);
            return;
          };
          case (?ovrs) { ovrs };
        };

        let updatedOvr = existingOvr.concat([performance]);
        let updatedMatch = {
          match with
          bowlersByInnings = match.bowlersByInnings;
        };
        updatedMatch.bowlersByInnings.add(innings, updatedOvr);
        matches.add(matchId, updatedMatch);
      };
    };
  };

  public shared ({ caller }) func updateBowlerPerformanceForUpdate(matchId : Nat, playerId : Nat, innings : Nat, updatedPerformance : BowlerPerformance.BowlerPerformance) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can modify match performance data");
    };
    if (innings == 0) {
      Runtime.trap("Invalid innings. Please provide a valid innings number greater than zero.");
    };

    switch (matches.get(matchId)) {
      case (null) { Runtime.trap("Match with given ID does not exist") };
      case (?match) {
        if (not canModifyMatch(caller, match)) {
          Runtime.trap("Unauthorized: Only admins or team owners can modify match performance data");
        };

        let existingPerformances = switch (match.bowlersByInnings.get(innings)) {
          case (null) { [] };
          case (?performances) { performances };
        };

        let updatedPerformances = existingPerformances.map(
          func(entry) {
            if (entry.playerId == playerId) {
              updatedPerformance;
            } else {
              entry;
            };
          }
        );

        let updatedMatch = {
          match with
          bowlersByInnings = match.bowlersByInnings;
        };
        updatedMatch.bowlersByInnings.add(innings, updatedPerformances);
        matches.add(matchId, updatedMatch);
      };
    };
  };

  public shared ({ caller }) func updateInningsStart(matchId : Nat, innings : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update innings start");
    };
    switch (matches.get(matchId)) {
      case (null) { Runtime.trap("Match with given ID does not exist") };
      case (?match) {
        if (not canModifyMatch(caller, match)) {
          Runtime.trap("Unauthorized: Only admins or team owners can update innings start");
        };

        let updatedMatch = {
          match with
          homeTeamRuns = 0;
          homeTeamWickets = 0;
          awayTeamRuns = 0;
          awayTeamWickets = 0;
        };
        matches.add(matchId, updatedMatch);
      };
    };
  };

  public shared ({ caller }) func addFielderPerformance(matchId : Nat, performance : FielderPerformance.FielderPerformance) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can modify match performance data");
    };
    switch (matches.get(matchId)) {
      case (null) { Runtime.trap("Match with given ID does not exist") };
      case (?match) {
        if (not canModifyMatch(caller, match)) {
          Runtime.trap("Unauthorized: Only admins or team owners can modify match performance data");
        };
        let fielderArray = match.fielders.concat([performance]);
        let updatedMatch = {
          match with
          fielders = fielderArray;
        };
        matches.add(matchId, updatedMatch);
      };
    };
  };

  public shared ({ caller }) func updateMatchResults(
    matchId : Nat,
    homeTeamRuns : Nat,
    homeTeamWickets : Nat,
    awayTeamRuns : Nat,
    awayTeamWickets : Nat,
    matchWinner : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update match results");
    };
    switch (matches.get(matchId)) {
      case (null) { Runtime.trap("Match with given ID does not exist") };
      case (?match) {
        if (not canModifyMatch(caller, match)) {
          Runtime.trap("Unauthorized: Only admins or team owners can update match results");
        };
        let updatedMatch = {
          match with
          homeTeamRuns;
          homeTeamWickets;
          awayTeamRuns;
          awayTeamWickets;
          matchWinner;
        };
        matches.add(matchId, updatedMatch);
      };
    };
  };

  // Auction Logic
  public shared ({ caller }) func startAuction(playerId : Nat, startingBid : Float, fixedIncrement : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can start auctions");
    };
    if (not players.containsKey(playerId)) {
      Runtime.trap("Player does not exist");
    };

    if (auctions.containsKey(playerId)) {
      Runtime.trap("Auction for this player already exists");
    };

    let newAuction : AuctionState = {
      playerId;
      startingBid;
      highestBid = startingBid;
      highestBidTeamId = null;
      isFinalized = false;
      isStopped = false;
      isAssigning = false;
      fixedIncrement;
    };

    auctions.add(playerId, newAuction);
  };

  public shared ({ caller }) func placeBid(playerId : Nat, teamId : Nat, bidAmount : Float) : async () {
    // Any authenticated user can place bids
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can place bids");
    };

    // Validate player and team existence
    if (not players.containsKey(playerId)) {
      Runtime.trap("Player does not exist");
    };
    if (not teams.containsKey(teamId)) {
      Runtime.trap("Team does not exist");
    };

    // Check if team has sufficient budget
    let remainingPurse = calculateRemainingPurse(teamId);
    if (bidAmount > remainingPurse) {
      Runtime.trap("Insufficient team budget for this bid");
    };

    // Validate auction existence and state
    switch (auctions.get(playerId)) {
      case (null) {
        Runtime.trap("Auction does not exist");
      };
      case (?auctionState) {
        if (auctionState.isStopped) {
          Runtime.trap("Auction has been stopped, no more bids are accepted for this player");
        };

        if (auctionState.isFinalized) {
          Runtime.trap("Auction is finalized, you cannot bid");
        };

        if (bidAmount <= auctionState.highestBid) {
          Runtime.trap("Bid is not higher than the current highest bid");
        };

        // Check the fixed increment scenario
        if (auctionState.fixedIncrement and not Float.equal(bidAmount, auctionState.highestBid + 0.2, 0.000_01)) {
          Runtime.trap("Bid must be exactly 0.2 Cr higher than current bid. ");
        };

        // Update the auction state
        let updatedAuction = {
          auctionState with
          highestBid = bidAmount;
          highestBidTeamId = ?teamId;
        };

        auctions.add(playerId, updatedAuction);
      };
    };
  };

  public shared ({ caller }) func stopAuction(playerId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can stop auctions");
    };
    switch (auctions.get(playerId)) {
      case (null) {
        Runtime.trap("Auction does not exist for this player");
      };
      case (?auctionState) {
        if (auctionState.isStopped) {
          Runtime.trap("Auction has already been stopped");
        };

        let stoppedAuction = {
          auctionState with
          isStopped = true;
          isAssigning = true; // Now ready for assignment
        };
        auctions.add(playerId, stoppedAuction);
      };
    };
  };

  // Complete the assignment AFTER stopping the bidding
  public shared ({ caller }) func assignPlayerAfterAuction(playerId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can assign players after auction");
    };
    switch (auctions.get(playerId)) {
      case (null) {
        Runtime.trap("Auction does not exist");
      };
      case (?auctionState) {
        if (not auctionState.isAssigning) {
          Runtime.trap("Auction is not in assigning state");
        };

        // Verify winning team has sufficient budget before finalizing
        switch (auctionState.highestBidTeamId) {
          case (null) {};
          case (?teamId) {
            let remainingPurse = calculateRemainingPurse(teamId);
            if (auctionState.highestBid > remainingPurse) {
              Runtime.trap("Winning team has insufficient budget to finalize auction");
            };
          };
        };

        let finalizedAuction = {
          auctionState with
          isFinalized = true;
          isAssigning = false; // No longer in assigning mode
        };

        auctions.add(playerId, finalizedAuction);

        // Assign player to winning team if there is one
        switch (auctionState.highestBidTeamId) {
          case (null) {};
          case (?teamId) {
            playerAssignments.add(playerId, { teamId; soldAmount = auctionState.highestBid });
          };
        };
      };
    };
  };

  public query ({ caller }) func getAuctionState(playerId : Nat) : async ?AuctionState {
    auctions.get(playerId);
  };

  public query ({ caller }) func getAllPlayers() : async [Player] {
    players.values().toArray();
  };

  public query ({ caller }) func getAllTeams() : async [TeamExtended] {
    teams.values().toArray().map(
      func(team) {
        filterTeamOwners(caller, team);
      }
    );
  };

  public query ({ caller }) func getAllTeamBudgets() : async [TeamBudget] {
    teams.keys().toArray().map(
      func(teamId) {
        let remainingPurse = calculateRemainingPurse(teamId);
        let team = switch (teams.get(teamId)) {
          case (null) { Runtime.trap("Team does not exist") };
          case (?t) { { id = t.id; name = t.name; totalPurse = t.totalPurse } };
        };
        {
          team;
          remainingPurse;
        };
      }
    );
  };

  public query ({ caller }) func getPlayerTeamAssignmentsWithSoldAmount() : async [(Nat, ?Nat, Float)] {
    players.keys().toArray().map(
      func(playerId) {
        let teamId = playerAssignments.get(playerId);
        switch (teamId) {
          case (null) { (playerId, null, 0.0) };
          case (?assignment) { (playerId, ?assignment.teamId, assignment.soldAmount) };
        };
      }
    );
  };

  public query ({ caller }) func getPlayersForTeam(teamId : Nat) : async [Player] {
    switch (teams.get(teamId)) {
      case (null) { Runtime.trap("Team does not exist") };
      case (?_) {
        players.values().toArray().filter(
          func(player) {
            let assignment = playerAssignments.get(player.id);
            switch (assignment) {
              case (?a) { a.teamId == teamId };
              case (null) { false };
            };
          }
        );
      };
    };
  };

  public query ({ caller }) func getAllTeamSummaries() : async [TeamSummary] {
    teams.keys().toArray().filter(
      func(teamId) {
        teams.containsKey(teamId);
      }
    ).map(
      func(teamId) {
        let team = switch (teams.get(teamId)) {
          case (null) { Runtime.trap("Team does not exist") };
          case (?t) { t };
        };
        let filteredTeam = filterTeamOwners(caller, team);
        let playersWithPrices = players.values().toArray().filter(
          func(player) {
            switch (playerAssignments.get(player.id)) {
              case (?a) { a.teamId == teamId };
              case (null) { false };
            };
          }
        ).map(
          func(player) {
            let finalPrice = switch (playerAssignments.get(player.id)) {
              case (null) { 0.0 };
              case (?assignment) { assignment.soldAmount };
            };
            (player, finalPrice);
          }
        );

        ?{
          team = filteredTeam;
          remainingPurse = calculateRemainingPurse(teamId);
          roster = playersWithPrices;
        };
      }
    ).filter(
      func(summary) { summary != null }
    ).map(
      func(summary) { switch (summary) { case (?s) { s }; case (null) { Runtime.trap("Should never happen") } } }
    );
  };

  public query ({ caller }) func getExportData() : async ([TeamSummary], [TeamExtended], [Player]) {
    let teamSummaries = getAllTeamSummariesInternal(caller);
    let _teams = teams.values().toArray().map(
      func(team) {
        filterTeamOwners(caller, team);
      }
    );
    let _players = players.values().toArray();
    (teamSummaries, _teams, _players);
  };

  func getAllTeamSummariesInternal(caller : Principal) : [TeamSummary] {
    teams.keys().toArray().filter(
      func(teamId) {
        teams.containsKey(teamId);
      }
    ).map(
      func(teamId) {
        let team = switch (teams.get(teamId)) {
          case (null) { Runtime.trap("Team does not exist") };
          case (?t) { t };
        };
        let filteredTeam = filterTeamOwners(caller, team);
        let playersWithPrices = players.values().toArray().filter(
          func(player) {
            switch (playerAssignments.get(player.id)) {
              case (?a) { a.teamId == teamId };
              case (null) { false };
            };
          }
        ).map(
          func(player) {
            let finalPrice = switch (playerAssignments.get(player.id)) {
              case (null) { 0.0 };
              case (?assignment) { assignment.soldAmount };
            };
            (player, finalPrice);
          }
        );

        {
          team = filteredTeam;
          remainingPurse = calculateRemainingPurse(teamId);
          roster = playersWithPrices;
        };
      }
    );
  };

  public shared ({ caller }) func generateFixtures(tournamentName : Text, startDate : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can generate fixtures");
    };

    let teamList = teams.values().toArray();

    for (i in Nat.range(0, teamList.size())) {
      for (j in Nat.range(i + 1, teamList.size())) {
        if (j >= 0 and j < teamList.size()) {
          // Ensure valid index for j
          let homeTeam = teamList[i];
          let awayTeam = teamList[j];

          // Check authorization for fixture generation
          if (not canCreateMatchForTeams(caller, homeTeam.id, awayTeam.id)) {
            Runtime.trap("Unauthorized: Only admins or team owners can generate fixtures for their teams");
          };

          let match = {
            matchId = nextMatchId;
            homeTeamId = homeTeam.id;
            awayTeamId = awayTeam.id;
            homeTeamName = homeTeam.name;
            awayTeamName = awayTeam.name;
            homeTeamRuns = 0;
            homeTeamWickets = 0;
            awayTeamRuns = 0;
            awayTeamWickets = 0;
            date = startDate;
            location = tournamentName;
            batsmen = [];
            bowlers = [];
            bowlersByInnings = Map.empty<Nat, [BowlerPerformance.BowlerPerformance]>();
            fielders = [];
            matchWinner = "";
            isPublished = false;
            shareableId = null;
            ballByBallData = null;
          };
          let matchId = nextMatchId;
          matches.add(matchId, match);
          nextMatchId += 1;
        };
      };
    };
  };

  public shared ({ caller }) func updateBallByBallData(matchId : Nat, ballByBallData : [InningBallByBall]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update ball-by-ball data");
    };
    switch (matches.get(matchId)) {
      case (null) {
        Runtime.trap("Match with given ID does not exist");
      };
      case (?match) {
        if (not canModifyMatch(caller, match)) {
          Runtime.trap("Unauthorized: Only admins or team owners can update ball-by-ball data");
        };

        if (not isValidBallByBallData(ballByBallData)) {
          Runtime.trap("Invalid ball-by-ball data structure");
        };

        let updatedMatch = {
          match with
          ballByBallData = ?ballByBallData;
        };
        matches.add(matchId, updatedMatch);
      };
    };
  };

  func isValidBallByBallData(ballByBallData : [InningBallByBall]) : Bool {
    let validOverCount = ballByBallData.all(
      func(inning) {
        inning.overNumber >= 0 and inning.overNumber <= 10
      }
    );
    let ballsPerOverValid = ballByBallData.all(
      func(inning) {
        inning.balls.size() <= 6
      }
    );
    validOverCount and ballsPerOverValid;
  };

  /// Change the name of a team. Any authenticated user can change team names.
  public shared ({ caller }) func changeTeamName(teamId : Nat, name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can change team names");
    };
    let team = switch (teams.get(teamId)) {
      case (null) { Runtime.trap("Team does not exist") };
      case (?t) { t };
    };
    let updatedTeam = {
      id = team.id;
      name;
      totalPurse = team.totalPurse;
      ownerPrincipals = team.ownerPrincipals;
    };
    teams.add(teamId, updatedTeam);
  };

  public shared ({ caller }) func changeOwnerName(owner : Principal, name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can change owner names");
    };
    ownerNames.add(owner, name);
  };

  public query ({ caller }) func getOwnerName(owner : Principal) : async ?Text {
    ownerNames.get(owner);
  };

  public shared ({ caller }) func clearOwnerName(owner : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear owner names");
    };
    ownerNames.remove(owner);
  };

  public query ({ caller }) func getAllOwnerNames() : async [(Principal, Text)] {
    ownerNames.toArray();
  };

  func toMatchView(match : Match) : MatchView {
    let bowlersByInningsArray = match.bowlersByInnings.toArray();
    {
      matchId = match.matchId;
      homeTeamId = match.homeTeamId;
      awayTeamId = match.awayTeamId;
      homeTeamName = match.homeTeamName;
      awayTeamName = match.awayTeamName;
      homeTeamRuns = match.homeTeamRuns;
      homeTeamWickets = match.homeTeamWickets;
      awayTeamRuns = match.awayTeamRuns;
      awayTeamWickets = match.awayTeamWickets;
      date = match.date;
      location = match.location;
      batsmen = match.batsmen;
      bowlers = match.bowlers;
      bowlersByInnings = bowlersByInningsArray;
      fielders = match.fielders;
      matchWinner = match.matchWinner;
      ballByBallData = match.ballByBallData;
    };
  };
};
