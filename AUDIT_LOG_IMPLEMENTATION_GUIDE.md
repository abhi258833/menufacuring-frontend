# Audit Log Implementation Guide

This document explains how audit logs are implemented in this project so you can replicate the same feature in another project.

## 1. Files Involved

- `src/pages/AuditTrailLogs.tsx` - full audit log UI, filtering, table, pagination, export.
- `src/routing/AppRoutes.tsx` - route registration for audit log page.
- `src/data/data.ts` - sidebar navigation entry (`Audit Logs`).

## 2. High-Level Architecture

The implementation is a React page component that:

1. Stores filter criteria in component state.
2. Calls backend audit APIs using `axios`.
3. Renders paged results in a Material UI table.
4. Dynamically hides columns that have no data.
5. Supports Excel export with current filter criteria.

## 3. Data Contract (Frontend Model)

The page expects each audit record to match this shape:

```ts
interface AuditDTO {
  id: string;
  userId: string | null;
  userEmail: string | null;
  operation: string | null;
  entityName: string | null;
  entityId: string | null;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
  ipAddress: string | null;
}
```

List API response contract:

```ts
{
  content: AuditDTO[];
  totalPages: number;
}
```

## 4. API Endpoints Used

Base URL currently hardcoded in page:

- `http://localhost:8080/server`

Endpoints:

1. List logs:
   - `GET /api/audits`
2. Export logs:
   - `GET /api/audits/exportExcel`

Auth:

- Uses bearer token from `localStorage.getItem("authToken")`.
- Sends `Authorization: Bearer <token>` header.

## 5. Filter Logic

Filter fields in UI:

- `User ID / Email` (`userInput`)
- `Entity Name` (`entityName`)
- `Operation` (`operation`)
- `Start Date` (`startDate`)
- `End Date` (`endDate`)

How filter parameters are translated:

- If `userInput` contains `@`, request sends `userEmail=<value>`.
- Otherwise, request sends `userId=<value>`.
- Date filters are converted to full-day UTC boundaries:
  - from: `${startDate}T00:00:00Z`
  - to: `${endDate}T23:59:59Z`

Pagination params:

- UI page is 1-based.
- API page is 0-based (`page - 1`).
- Size is fixed by `pageSize = 10`.

## 6. Dynamic Column Behavior

The page computes visible columns based on whether data exists in returned rows.

Function:

- `updateActiveColumns(data: AuditDTO[])`

How it works:

1. Scans each row across known fields.
2. Adds a column to `activeColumns` if at least one row has a non-empty value.
3. Always forces these columns to remain visible:
   - `userEmail`
   - `operation`
   - `timestamp`

Result:

- Cleaner table for sparse datasets.
- Avoids many empty columns.

## 7. Page Lifecycle

Initial and page-change loading:

- `useEffect(..., [page])` calls `loadLogs(...)`.
- Filter changes do not auto-load until `Apply Filters` is clicked.

Filter submit flow:

1. User clicks `Apply Filters`.
2. `handleFilter()` sets page to `1`.
3. Calls `loadLogs(1, ...)` with active filters.

Loading state:

- `loading` shows centered `CircularProgress`.
- After success, renders table and pagination.

## 8. Table Rendering Details

Material UI components used:

- `Table`, `TableHead`, `TableBody`, `TableRow`, `TableCell`
- `Card` + `TableContainer` wrapper
- `Chip` for operation badges

Formatting details:

- `timestamp` rendered with `toLocaleString("en-US", ...)`.
- `entityId` and `ipAddress` shown with monospace chip-like style.
- `oldValue` styled red, `newValue` styled green.

Operation badge colors:

- `CREATE` -> green shades
- `UPDATE` -> blue shades
- `DELETE` -> red shades
- fallback -> theme primary shades

## 9. Excel Export Implementation

Export button flow (`handleExportExcel`):

1. Rebuilds filter params (same rules as list API, without page/size).
2. Calls `GET /api/audits/exportExcel` with `responseType: "blob"`.
3. Creates object URL and triggers download via a temporary `<a>` element.
4. Downloads file as `audit-log.xlsx`.

## 10. Route and Navigation Wiring

Route setup:

- `src/routing/AppRoutes.tsx`
- Lazy import: `const AuditTrailLogs = lazy(() => import("../pages/AuditTrailLogs"));`
- Route path: `/AuditTrailLogs`

Sidebar navigation setup:

- `src/data/data.ts`
- Link entry:
  - title: `Audit Logs`
  - path: `/AuditTrailLogs`

## 11. Porting Checklist For Another Project

### Step 1: Copy the page component

- Start with `AuditTrailLogs.tsx`.
- Keep `AuditDTO`, filter states, pagination states, and handlers.

### Step 2: Externalize API base URL

In this project, endpoints are hardcoded. In your target project, move base URL to config/env:

- Example: `REACT_APP_API_BASE_URL` or centralized API client.

### Step 3: Ensure auth token strategy matches

Current implementation expects:

- token in `localStorage` key `authToken`.

If your app uses cookies/context/refresh tokens, update request header logic accordingly.

### Step 4: Match backend query contract

Your backend should accept query params:

- `userId` or `userEmail`
- `entityName`
- `operation`
- `from`
- `to`
- `page`
- `size`

And response:

- `content`
- `totalPages`

### Step 5: Keep date boundary logic

Preserve day-boundary conversion (`T00:00:00Z`, `T23:59:59Z`) unless backend expects local-time dates.

### Step 6: Register route and menu

- Add route in your router.
- Add sidebar/menu item so users can open the page.

### Step 7: Validate export API

- Confirm export endpoint returns spreadsheet MIME payload.
- Keep `responseType: "blob"` and temporary anchor download logic.

## 12. Suggested Improvements (Optional)

For production hardening, consider:

1. Move API calls into `src/api/audit.ts` service.
2. Add error UI (toast/snackbar) instead of only `console.error`.
3. Add debounce for filter input or Enter-key submit.
4. Add server-side sorting support.
5. Add date range validation (`startDate <= endDate`).
6. Support CSV and PDF export options.
7. Replace hardcoded URL with project config (`siteConfig.apiEndpoint` pattern used elsewhere in this repo).

## 13. Quick Validation After Port

1. Page loads with spinner and first page of logs.
2. Pagination fetches subsequent pages correctly.
3. User ID/Email filter routes query to correct backend param.
4. Date range correctly limits data.
5. Dynamic columns hide empty fields and keep core fields visible.
6. Excel export downloads expected file for filtered data.
7. Unauthorized request handling follows your project auth flow.
