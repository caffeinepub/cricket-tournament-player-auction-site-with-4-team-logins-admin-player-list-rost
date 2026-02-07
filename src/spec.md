# Specification

## Summary
**Goal:** Fix SPA client-side routing so internal pages reliably load in production (including deep links and refresh) and prevent the full-screen Not Found page from appearing during normal usage.

**Planned changes:**
- Update frontend route handling so in-app navigation and direct URL entry correctly resolve to valid routes: / (Login), /team, /admin, /s/<shareId>, /debug.
- Adjust fallback/unknown-route behavior to stop showing the current NotFoundPage UI and instead redirect unknown routes to the home/login route, while keeping /debug accessible.

**User-visible outcome:** Users can navigate to internal pages, open deep links, and refresh on valid routes without landing on a Not Found page; unknown URLs safely redirect to the login/home page and /debug remains available.
