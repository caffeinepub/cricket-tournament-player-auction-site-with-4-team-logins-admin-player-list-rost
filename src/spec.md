# Specification

## Summary
**Goal:** Enable editing and saving per-innings scorecards (Innings 1 / Innings 2) with selectable player names, backed by per-innings storage and update APIs.

**Planned changes:**
- Update backend match performance schema to store/query bowling (and other scorecard items needed by the UI) per innings, including adding an `innings` field to bowler performance records.
- Add backend per-innings scorecard upsert/update APIs for batsman and bowler performance, allowing corrections to player selection (`playerId`) and numeric values with existing match-modification authorization.
- Add/extend backend state migration so existing canister data upgrades cleanly and existing records get deterministic default innings values.
- Implement an editable per-innings scorecard editor in the match edit dialog that supports selecting players by name and editing values independently for Innings 1 and Innings 2, with authenticated-only editing.
- Update frontend bindings/types and React Query hooks to use the new APIs/fields and refresh displayed scorecards after saves (cache invalidation/refetch).

**User-visible outcome:** Authenticated users can edit Innings 1 and Innings 2 scorecards independently (including choosing player names for each row) and save corrections; unauthenticated users see a read-only scorecard with a clear login-required message.
