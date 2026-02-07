# Specification

## Summary
**Goal:** Add an optional fixed bid increment mode so auctions can enforce a +0.2 Cr step per bid when enabled at auction start.

**Planned changes:**
- Add a “Fixed increment (+0.2 Cr per bid)” option in the admin start-auction flow and persist this setting in auction state.
- Enforce server-side bidding rules: when fixed increment is enabled, only accept bids equal to currentHighestBid + 0.2 (within tolerance) and return a clear English error for invalid bids.
- Update the auction dialog bidding UI to support fixed-increment behavior (prefill/quick-raise to highestBid + 0.2 and replace any existing 0.5 step behavior only when this mode is enabled).
- Update React Query hooks and generated types/interfaces so startAuction can send the new option and the frontend can read fixed-increment configuration from AuctionState.

**User-visible outcome:** When starting an auction, admins can enable a fixed +0.2 Cr increment mode; for those auctions, bidders are guided to the next valid amount and invalid increments are rejected with a clear English error, while auctions without the mode continue to accept any higher bid.
