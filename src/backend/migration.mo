import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

import FielderPerformance "FielderPerformance";
import BatsmanPerformance "BatsmanPerformance";
import BowlerPerformance "BowlerPerformance";

module {
  type OldMatch = {
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
    fielders : [FielderPerformance.FielderPerformance];
    matchWinner : Text;
  };

  type OldActor = {
    players : Map.Map<Nat, { id : Nat; name : Text; basePrice : Float }>;
    teams : Map.Map<Nat, { id : Nat; name : Text; totalPurse : Float; ownerPrincipals : [Principal] }>;
    userProfiles : Map.Map<Principal, { name : Text; teamId : ?Nat }>;
    playerToTeam : Map.Map<Nat, Nat>;
    matches : Map.Map<Nat, OldMatch>;
    auctions : Map.Map<Nat, { playerId : Nat; startingBid : Float; highestBid : Float; highestBidTeamId : ?Nat; isFinalized : Bool; isStopped : Bool; isAssigning : Bool; fixedIncrement : Bool }>;
    playerAssignments : Map.Map<Nat, { teamId : Nat; soldAmount : Float }>;
    ownerNames : Map.Map<Principal, Text>;
    nextPlayerId : Nat;
    nextTeamId : Nat;
    nextMatchId : Nat;
  };

  type NewMatch = {
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
  };

  type NewActor = {
    players : Map.Map<Nat, { id : Nat; name : Text; basePrice : Float }>;
    teams : Map.Map<Nat, { id : Nat; name : Text; totalPurse : Float; ownerPrincipals : [Principal] }>;
    userProfiles : Map.Map<Principal, { name : Text; teamId : ?Nat }>;
    playerToTeam : Map.Map<Nat, Nat>;
    matches : Map.Map<Nat, NewMatch>;
    auctions : Map.Map<Nat, { playerId : Nat; startingBid : Float; highestBid : Float; highestBidTeamId : ?Nat; isFinalized : Bool; isStopped : Bool; isAssigning : Bool; fixedIncrement : Bool }>;
    playerAssignments : Map.Map<Nat, { teamId : Nat; soldAmount : Float }>;
    ownerNames : Map.Map<Principal, Text>;
    nextPlayerId : Nat;
    nextTeamId : Nat;
    nextMatchId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let newMatches = old.matches.map<Nat, OldMatch, NewMatch>(
      func(_id, oldMatch) {
        { oldMatch with bowlersByInnings = Map.empty<Nat, [BowlerPerformance.BowlerPerformance]>() };
      }
    );
    { old with matches = newMatches };
  };
};
