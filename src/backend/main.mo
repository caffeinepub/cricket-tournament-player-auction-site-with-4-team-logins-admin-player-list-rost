import Array "mo:core/Array";
import Float "mo:core/Float";
import Iter "mo:core/Iter";
import Map "mo:core/Map";


import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";


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

  public type TeamBudget = {
    team : Team;
    remainingPurse : Float;
  };

  public type Match = {
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
    batsmen : [BatsmanPerformance];
    bowlers : [BowlerPerformance];
    fielders : [FielderPerformance];
    matchWinner : Text;
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

  public type BatsmanPerformance = {
    playerId : Nat;
    runs : Nat;
    ballsFaced : Nat;
    fours : Nat;
    sixes : Nat;
    innings : Nat;
  };

  public type BowlerPerformance = {
    playerId : Nat;
    overs : Float;
    maidens : Nat;
    runsConceded : Nat;
    wickets : Nat;
    ballsBowled : Nat;
  };

  public type FielderPerformance = {
    playerId : Nat;
    catches : Nat;
    stumpings : Nat;
    dismissals : Nat;
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

  // Persistent storage
  let players = Map.empty<Nat, Player>();
  let teams = Map.empty<Nat, Team>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let playerToTeam = Map.empty<Nat, Nat>();
  let matches = Map.empty<Nat, Match>();
  let auctions = Map.empty<Nat, AuctionState>();

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
        let totalSpent = players.values().toArray().filter(
          func(player) {
            let assignedTeam = playerToTeam.get(player.id);
            switch (assignedTeam) {
              case (?tId) { tId == teamId };
              case (null) { false };
            };
          }
        ).foldLeft(
          0.0,
          func(acc, player) {
            acc + player.basePrice;
          },
        );
        team.totalPurse - totalSpent;
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

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func createPlayer(name : Text, basePrice : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete players");
    };
    if (not players.containsKey(playerId)) {
      Runtime.trap("Player does not exist");
    };
    playerToTeam.remove(playerId);
    players.remove(playerId);
  };

  public shared ({ caller }) func createTeam(name : Text, totalPurse : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create teams");
    };
    let team = {
      id = nextTeamId;
      name;
      totalPurse;
    };
    teams.add(nextTeamId, team);
    nextTeamId += 1;
  };

  public shared ({ caller }) func addPlayerToTeam(playerId : Nat, teamId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add players to teams");
    };
    if (not players.containsKey(playerId)) {
      Runtime.trap("Player does not exist");
    };
    if (not teams.containsKey(teamId)) {
      Runtime.trap("Team does not exist");
    };
    let currentTeam = playerToTeam.get(playerId);
    switch (currentTeam) {
      case (?existingTeam) {
        if (existingTeam == teamId) {
          Runtime.trap("Player already in this team");
        };
      };
      case (null) {};
    };
    playerToTeam.add(playerId, teamId);
  };

  public shared ({ caller }) func removePlayerFromTeam(playerId : Nat, teamId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can remove players from teams");
    };
    if (not players.containsKey(playerId)) {
      Runtime.trap("Player does not exist");
    };
    if (not teams.containsKey(teamId)) {
      Runtime.trap("Team does not exist");
    };
    let currentTeam = playerToTeam.get(playerId);
    switch (currentTeam) {
      case (?existingTeam) {
        if (existingTeam == teamId) {
          playerToTeam.remove(playerId);
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create matches");
    };
    if (homeTeamId == awayTeamId) {
      Runtime.trap("A team cannot play against itself");
    };
    let match = {
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
      fielders = [];
      matchWinner = "";
    };
    let matchId = nextMatchId;
    matches.add(matchId, match);
    nextMatchId += 1;
    matchId;
  };

  public query ({ caller }) func getAllMatches() : async [Match] {
    matches.values().toArray().sort(
      compareMatch
    );
  };

  public query ({ caller }) func getMatchById(matchId : Nat) : async ?Match {
    matches.get(matchId);
  };

  public shared ({ caller }) func addBatsmanPerformance(matchId : Nat, performance : BatsmanPerformance) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add batsman performance");
    };
    switch (matches.get(matchId)) {
      case (null) { Runtime.trap("Match with given ID does not exist") };
      case (?match) {
        let batsmanArray = match.batsmen.concat([performance]);
        let updatedMatch = {
          match with
          batsmen = batsmanArray;
        };
        matches.add(matchId, updatedMatch);
      };
    };
  };

  public shared ({ caller }) func addBowlerPerformance(matchId : Nat, performance : BowlerPerformance) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add bowler performance");
    };
    switch (matches.get(matchId)) {
      case (null) { Runtime.trap("Match with given ID does not exist") };
      case (?match) {
        let bowlerArray = match.bowlers.concat([performance]);
        let updatedMatch = {
          match with
          bowlers = bowlerArray;
        };
        matches.add(matchId, updatedMatch);
      };
    };
  };

  public shared ({ caller }) func addFielderPerformance(matchId : Nat, performance : FielderPerformance) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add fielder performance");
    };
    switch (matches.get(matchId)) {
      case (null) { Runtime.trap("Match with given ID does not exist") };
      case (?match) {
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update match results");
    };
    switch (matches.get(matchId)) {
      case (null) { Runtime.trap("Match with given ID does not exist") };
      case (?match) {
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can start auctions");
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can place bids");
    };

    // Verify the caller is associated with the team they're bidding for
    switch (userProfiles.get(caller)) {
      case (null) {
        Runtime.trap("User profile not found. Please create a profile first");
      };
      case (?profile) {
        switch (profile.teamId) {
          case (null) {
            Runtime.trap("User is not associated with any team");
          };
          case (?userTeamId) {
            if (userTeamId != teamId) {
              Runtime.trap("User can only place bids for their own team");
            };
          };
        };
      };
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
          Runtime.trap("Bid must be exactly 0.2 Cr higher than current bid.");
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can stop auctions");
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

  // Complete the assignment AFTER stopping the bidding, for admin only
  public shared ({ caller }) func assignPlayerAfterAuction(playerId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can finalize auctions");
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
            playerToTeam.add(playerId, teamId);
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

  public query ({ caller }) func getAllTeams() : async [Team] {
    teams.values().toArray();
  };

  public query ({ caller }) func getAllTeamBudgets() : async [TeamBudget] {
    teams.keys().toArray().map(
      func(teamId) {
        let remainingPurse = calculateRemainingPurse(teamId);
        let team = switch (teams.get(teamId)) {
          case (null) { Runtime.trap("Team does not exist") };
          case (?t) { t };
        };
        {
          team;
          remainingPurse;
        };
      }
    ).sort(
      compareTeamBudget
    );
  };

  public query ({ caller }) func getPlayerTeamAssignments() : async [(Nat, ?Nat)] {
    players.keys().toArray().map(
      func(playerId) {
        let teamId = playerToTeam.get(playerId);
        (playerId, teamId);
      }
    );
  };

  public query ({ caller }) func getPlayersForTeam(teamId : Nat) : async [Player] {
    switch (teams.get(teamId)) {
      case (null) { Runtime.trap("Team does not exist") };
      case (?_) {
        players.values().toArray().filter(
          func(player) {
            let assignedTeam = playerToTeam.get(player.id);
            switch (assignedTeam) {
              case (?tId) { tId == teamId };
              case (null) { false };
            };
          }
        );
      };
    };
  };
};

