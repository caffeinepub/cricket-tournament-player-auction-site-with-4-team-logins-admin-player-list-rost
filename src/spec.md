# Specification

## Summary
**Goal:** Store and surface each assigned player’s final sold amount, and base team remaining purse calculations and bid validation on actual spend.

**Planned changes:**
- Persist a sold amount per player assignment (auction: winning bid; manual: default to player base price unless already recorded) and compute each team’s remaining purse from the sum of sold amounts of its assigned players.
- Update backend APIs/queries for the assignment listing to return assigned team id plus sold amount per assigned player (null/absent when unassigned), with authorization consistent with existing admin assignment views.
- Update Admin → Player Management assigned players table to add a “Sold For” column showing the stored sold amount using existing ₹ / Cr formatting, and ensure displayed team purse/remaining purse reflects the backend’s sold-amount-based calculation after refetch.

**User-visible outcome:** Admins can see a “Sold For” value for each assigned player, and team remaining purse (and bid acceptance) correctly reflects the actual amounts spent on assigned players.
