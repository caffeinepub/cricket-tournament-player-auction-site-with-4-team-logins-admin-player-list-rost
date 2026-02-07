# Specification

## Summary
**Goal:** Prevent blank-screen failures on the deployed site by adding a clear crash fallback, startup diagnostics, and more robust boot-time error capture.

**Planned changes:**
- Add a top-level Error Boundary with a styled, English fallback screen that explains the app failed to load, prompts refresh, and can reveal technical error details (message/stack).
- Add a hash-routed diagnostic page at `#/debug` showing URL/origin details, detected canister host/origin, build/version identifier, backend actor creation status, and results of at least one backend call.
- Capture and handle global errors and unhandled promise rejections during startup so they surface in the crash fallback (when feasible) and are logged to the console with route/origin context.
- Update `frontend/DEPLOYMENT.md` with a “Blank screen / site not loading” checklist referencing `#/debug` and steps to verify `index.html` and bundled assets return 200 on the deployed canister.

**User-visible outcome:** If the app fails to load, users see a helpful error screen instead of a blank page, and anyone can visit `#/debug` to view runtime diagnostics and backend connectivity signals without using developer tools.
