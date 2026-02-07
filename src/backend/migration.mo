import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  type OldAuctionState = {
    playerId : Nat;
    startingBid : Float;
    highestBid : Float;
    highestBidTeamId : ?Nat;
    isFinalized : Bool;
  };

  type OldActor = {
    players : Map.Map<Nat, { id : Nat; name : Text; basePrice : Float }>;
    teams : Map.Map<Nat, { id : Nat; name : Text; totalPurse : Float }>;
    userProfiles : Map.Map<Principal, { name : Text; teamId : ?Nat }>;
    playerToTeam : Map.Map<Nat, Nat>;
    matches : Map.Map<Nat, { homeTeamId : Nat; awayTeamId : Nat; homeTeamName : Text; awayTeamName : Text; homeTeamRuns : Nat; homeTeamWickets : Nat; awayTeamRuns : Nat; awayTeamWickets : Nat; date : Text; location : Text; batsmen : [{ playerId : Nat; runs : Nat; ballsFaced : Nat; fours : Nat; sixes : Nat; innings : Nat }]; bowlers : [{ playerId : Nat; overs : Float; maidens : Nat; runsConceded : Nat; wickets : Nat; ballsBowled : Nat }]; fielders : [{ playerId : Nat; catches : Nat; stumpings : Nat; dismissals : Nat }]; matchWinner : Text }>;
    auctions : Map.Map<Nat, OldAuctionState>;
    nextPlayerId : Nat;
    nextTeamId : Nat;
    nextMatchId : Nat;
  };

  type NewAuctionState = {
    playerId : Nat;
    startingBid : Float;
    highestBid : Float;
    highestBidTeamId : ?Nat;
    isFinalized : Bool;
    fixedIncrement : Bool;
  };

  type NewActor = {
    players : Map.Map<Nat, { id : Nat; name : Text; basePrice : Float }>;
    teams : Map.Map<Nat, { id : Nat; name : Text; totalPurse : Float }>;
    userProfiles : Map.Map<Principal, { name : Text; teamId : ?Nat }>;
    playerToTeam : Map.Map<Nat, Nat>;
    matches : Map.Map<Nat, { homeTeamId : Nat; awayTeamId : Nat; homeTeamName : Text; awayTeamName : Text; homeTeamRuns : Nat; homeTeamWickets : Nat; awayTeamRuns : Nat; awayTeamWickets : Nat; date : Text; location : Text; batsmen : [{ playerId : Nat; runs : Nat; ballsFaced : Nat; fours : Nat; sixes : Nat; innings : Nat }]; bowlers : [{ playerId : Nat; overs : Float; maidens : Nat; runsConceded : Nat; wickets : Nat; ballsBowled : Nat }]; fielders : [{ playerId : Nat; catches : Nat; stumpings : Nat; dismissals : Nat }]; matchWinner : Text }>;
    auctions : Map.Map<Nat, NewAuctionState>;
    nextPlayerId : Nat;
    nextTeamId : Nat;
    nextMatchId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let newAuctions = old.auctions.map<Nat, OldAuctionState, NewAuctionState>(
      func(_id, oldAuction) {
        { oldAuction with fixedIncrement = false };
      }
    );
    { old with auctions = newAuctions };
  };
};
