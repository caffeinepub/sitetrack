# SiteTrack

## Current State

SiteTrack is a construction site management app with:
- Login via Internet Identity (email/phone equivalent)
- One site per free user with fields: name, client name, location, contract value, start date
- Dashboard showing financial summary (Total Received, Total Expense, Profit/Loss, Pending Amount)
- Site page with three tabs: Daily Log, Payments, Documents
- Daily Log: date, labour count, work done, material expense, photo upload (max 3)
- Payments: amount received, date, notes
- Documents: upload and list PDFs/images
- Backend in Motoko with full CRUD APIs for all entities
- Aggregates computed on the backend (`getSiteAggregates`)

## Requested Changes (Diff)

### Add
- "Generate Report" button on the SitePage header (next to the back button area)
- A PDF report modal/sheet that opens when tapped, showing a preview of what will be included
- Client-side PDF generation using jsPDF (no backend changes needed)
- The generated PDF includes:
  - Report title: Site name + "Site Report"
  - Generated date
  - Company name and user name (from profile)
  - Site details: client name, location, contract value, start date
  - Financial summary: Total Received, Total Expense, Profit/Loss, Pending Amount
  - Daily Logs table: date, labour count, work done, material expense
  - Payments table: date, amount received, notes
  - Documents list: document name, upload date
- Download button to trigger PDF save

### Modify
- SitePage.tsx: Add a "Generate Report" icon button in the header; wire it to open the report modal
- SitePage.tsx: Pass necessary data (site, aggregates, logs, payments, documents) to the report modal

### Remove
- Nothing removed

## Implementation Plan

1. Install jsPDF and jspdf-autotable packages in frontend
2. Create `SiteReportModal.tsx` component in `src/frontend/src/components/`
   - Accepts site, aggregates, dailyLogs, paymentEntries, documents, userProfile as props
   - Shows a dialog/sheet with a summary of what will be exported
   - Has "Download PDF" button that triggers jsPDF generation and file download
3. Update `SitePage.tsx`:
   - Add report button (FileText icon) in the header
   - Fetch required data: getDailyLogsForSite, getPaymentEntriesForSite, getDocumentsForSite, getSiteAggregates, getCallerUserProfile
   - Pass data into SiteReportModal
4. PDF content layout (via jsPDF):
   - Header with site name and report date
   - Site info section
   - Financial summary section
   - Daily logs table (autotable)
   - Payments table (autotable)
   - Documents list
