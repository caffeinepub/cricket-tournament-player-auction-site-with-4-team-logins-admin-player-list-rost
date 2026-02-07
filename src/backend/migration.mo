import Map "mo:core/Map";
import Nat "mo:core/Nat";

module {
  type OldActor = {
    playerToTeam : Map.Map<Nat, Nat>;
    // Other fields are not required since we only map new var
  };

  type NewActor = {
    playerAssignments : Map.Map<Nat, { teamId : Nat; soldAmount : Float }>;
  };

  public func run(old : OldActor) : NewActor {
    let mappedAssignments = old.playerToTeam.map<Nat, Nat, { teamId : Nat; soldAmount : Float }>(
      func(_playerId, teamId) {
        { teamId; soldAmount = 0.0 };
      }
    );
    { playerAssignments = mappedAssignments };
  };
};
