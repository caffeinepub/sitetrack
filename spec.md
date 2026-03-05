# SiteTrack

## Current State

Full-stack construction site tracking app with: user login (Internet Identity), site creation, daily logs, payment entries, document vault, PDF reports, and an admin panel.

Two critical security bugs exist in the backend `access-control.mo`:

1. `isAdmin()` calls `getUserRole()` which calls `Runtime.trap("User is not registered")` for any caller not in the roles map. This means `isCallerAdmin()` throws a canister trap instead of returning `false` for unregistered users.

2. `hasPermission()` also calls `getUserRole()` which traps for unregistered users. This affects ALL protected endpoints including `getAllSites()`, `getDailyLogsForSite()`, etc.

Both bugs stem from the same root cause: `getUserRole` traps on unregistered callers instead of returning a safe default.

## Requested Changes (Diff)

### Add
- Nothing new.

### Modify
- Fix `isAdmin()` in `access-control.mo`: safely return `false` for callers not in the roles map or anonymous, without calling `getUserRole`.
- Fix `hasPermission()` in `access-control.mo`: safely return `false` for callers not in the roles map. Anonymous callers only pass `#guest` permission checks.
- Keep `getUserRole()` behavior unchanged.
- All other logic in `main.mo` stays identical (getAllSites filters by caller for non-admins, verifySiteOwnership enforces ownership).

### Remove
- Nothing.

## Implementation Plan

1. In `access-control.mo`, rewrite `isAdmin` to directly pattern-match `state.userRoles.get(caller)` and return `false` for `null` or non-admin roles, without calling `getUserRole`.
2. In `access-control.mo`, rewrite `hasPermission` to directly pattern-match `state.userRoles.get(caller)` safely: anonymous only passes `#guest`; not-in-map returns `false`; admin passes everything; user passes `#user` and `#guest`; guest passes only `#guest`.
3. Keep `getUserRole`, `initialize`, `assignRole` unchanged.
4. Keep all of `main.mo` unchanged.
