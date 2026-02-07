# Deployment Guide - Cricket Auction Platform

## Publishing Draft Version 15 to Production

This document outlines the steps to deploy the current Draft Version 15 build to the live/production environment.

### Pre-Deployment Checklist

- [ ] Verify all code changes are committed and pushed to the main branch
- [ ] Confirm Draft Version 15 has been tested and approved
- [ ] Ensure backend canister is deployed and stable
- [ ] Review environment configuration in `frontend/env.json`

### Build Process

1. **Generate Backend Bindings**
   ```bash
   dfx generate backend
   ```

2. **Build Frontend**
   ```bash
   cd frontend
   pnpm build
   ```

3. **Verify Build Output**
   - Check `frontend/dist` directory contains all assets
   - Confirm `env.json` is copied to dist folder

### Deployment Steps

1. **Deploy Backend (if not already deployed)**
   ```bash
   dfx deploy backend --network ic
   ```

2. **Deploy Frontend**
   ```bash
   dfx deploy frontend --network ic
   ```

3. **Verify Canister URLs**
   ```bash
   dfx canister --network ic id frontend
   dfx canister --network ic id backend
   ```

### Post-Deployment Smoke Tests

#### Critical User Flows to Test

1. **Landing Page (`/`)**
   - [ ] Page loads without errors
   - [ ] Login button is visible and functional
   - [ ] Navigation to /admin and /team works
   - [ ] Internet Identity authentication flow completes successfully

2. **Team Dashboard (`/team`)**
   - [ ] Page loads for authenticated and anonymous users
   - [ ] Team selector appears for non-team users
   - [ ] Overview tab displays team information correctly
   - [ ] Matches tab shows match schedules and scorecards
   - [ ] Team purse displays correctly in crore

3. **Admin Dashboard (`/admin`)**
   - [ ] Page loads for all users (shows "Guest" for anonymous)
   - [ ] Players tab displays player list with assignment status
   - [ ] Teams tab shows all teams with purse information
   - [ ] Matches tab allows match creation and scorecard updates
   - [ ] Auction functionality works (start, bid, stop, assign)

4. **Auction Feature (Critical)**
   - [ ] Auction dialog opens from player management
   - [ ] Leading team highlight animation is visible and smooth
   - [ ] Animated gradient banner with pulse and glow effects displays correctly
   - [ ] Crown icons appear in team selector for leading team
   - [ ] "Leading" badges show throughout the UI
   - [ ] Bid placement updates leading team in real-time
   - [ ] Stop auction and assign player flow completes successfully

5. **Authentication & Profile**
   - [ ] Login/logout flow works correctly
   - [ ] Profile setup modal appears only for new authenticated users
   - [ ] User profile persists across sessions
   - [ ] Authorization checks prevent unauthorized actions

### Visual Verification

- [ ] Cricket-themed color palette (emerald greens, amber/gold accents) displays correctly
- [ ] Dark mode is enabled by default
- [ ] Responsive design works on mobile, tablet, and desktop
- [ ] All animations are smooth (leading-pulse, leading-glow)
- [ ] Icons render correctly (lucide-react and react-icons)

### Performance Checks

- [ ] Initial page load time is acceptable (< 3 seconds)
- [ ] React Query caching works correctly
- [ ] No console errors in browser developer tools
- [ ] Backend query/update calls complete successfully

### Rollback Plan

If issues are discovered post-deployment:

1. **Identify the Issue**
   - Check browser console for errors
   - Review canister logs: `dfx canister --network ic logs frontend`
   - Verify backend canister status

2. **Quick Fixes**
   - For frontend-only issues, rebuild and redeploy frontend
   - For backend issues, may need to redeploy backend canister

3. **Full Rollback**
   - Revert to previous canister version if available
   - Restore from backup if necessary

### Important Notes

- **No Code Changes**: This deployment publishes the exact Draft Version 15 code without modifications
- **Asset Integrity**: All static assets and generated images are included in the build
- **Animation Preservation**: The leading-team/bid highlight animation from Draft Version 15 remains intact
- **Environment**: Ensure production environment variables are correctly configured

### Support & Monitoring

- Monitor canister cycles to ensure sufficient resources
- Check error logs regularly for the first 24 hours post-deployment
- Have team members test critical flows immediately after deployment

### Deployment Confirmation

After completing all steps:

- [ ] All smoke tests passed
- [ ] Visual verification completed
- [ ] Performance checks acceptable
- [ ] No critical errors in logs
- [ ] Team notified of successful deployment

---

**Deployment Date**: _________________

**Deployed By**: _________________

**Canister IDs**:
- Frontend: _________________
- Backend: _________________

**Notes**: _________________
