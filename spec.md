# SiteTrack

## Current State
Full-stack construction site management app with:
- Email/Internet Identity login with profile setup (name, company)
- Site creation (1 per free user) with contract value, client, location, start date
- Dashboard showing financial summary (received, expense, profit/loss, pending)
- Daily log entry with labour count, work done, material expense, photo upload
- Payment entries that auto-update financials
- Document vault for uploading PDFs/images
- PDF site report generation
- Admin panel (view all users/sites, platform stats, delete users/sites)
- Authorization component with role-based access control
- Blob storage for file uploads

**Current Bug:** `becomeFirstAdmin()` calls `AccessControl.assignRole(accessControlState, caller, caller, #admin)` which internally checks `isAdmin(state, caller)` and traps because the caller is not yet admin. This causes "Failed to claim admin access".

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- Fix `becomeFirstAdmin()` to directly mutate `accessControlState.userRoles` and `accessControlState.adminAssigned` instead of going through `AccessControl.assignRole`. The function must: check if caller is anonymous (return false), check if `accessControlState.adminAssigned` is already true (return false), check if caller has a profile (return false if not), then directly set the role and mark admin as assigned (return true).

### Remove
- The redundant local `var adminAssigned` variable; rely solely on `accessControlState.adminAssigned`

## Implementation Plan
1. Regenerate backend keeping all existing types and functions identical
2. Only change: `becomeFirstAdmin()` directly writes to `accessControlState.userRoles` map and sets `accessControlState.adminAssigned := true` without calling `AccessControl.assignRole`
