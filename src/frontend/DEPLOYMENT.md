# HPL Deployment Guide

## Overview
This guide covers deployment of the Hostel Premier League (HPL) application to the Internet Computer.

## Routing Behavior

### Path-Based Routing (Production)
The application uses **path-based routing** for production deployments:
- Valid routes: `/` (Login), `/team`, `/admin`, `/s/<shareId>`, `/debug`
- Deep links work directly: Opening `/team` in the browser loads the Team Dashboard
- Refreshing on any valid route maintains the current page
- Unknown routes automatically redirect to home (`/`)

### SPA Hosting Requirements
For path-based routing to work correctly in production:
1. The hosting environment must serve the app entry file (`index.html`) for all routes
2. The `.ic-assets.json5` configuration handles this for Internet Computer deployments
3. Deep links and page refreshes will work as expected

### Legacy Hash URL Compatibility
The app automatically upgrades legacy hash-based URLs (e.g., `#/team`) to path-based URLs (e.g., `/team`) on initial load to prevent routing mismatches.

## Blank Screen Troubleshooting

If you encounter a blank screen after deployment, follow these steps:

### Step 1: Access Diagnostics Page
Navigate to the `/debug` route to view diagnostic information:
