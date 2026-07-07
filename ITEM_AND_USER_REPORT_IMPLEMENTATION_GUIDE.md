# Item Report and User Report Implementation Guide

This guide explains how Item Report and User Report are implemented in this project so you can reproduce the same setup in another project.

## 1. Files Involved

### Item Report

- `src/pages/reports/ItemListTable.tsx`
- `src/api/itemReport.ts`
- `src/data/itemReportData.ts`

### User Report

- `src/pages/reports/UserListWithGroups.tsx`
- `src/api/usermanagement.ts` (`userList` function)

### Route and Navigation Wiring

- `src/routing/AppRoutes.tsx` (routes)
- `src/data/data.ts` (Reports menu links)

## 2. Route and Menu Integration

Routes registered:

- `/report/user` -> `UserListTable`
- `/report/item` -> `ItemReportTable`

Sidebar menu has a `Reports` group with:

- `User Report`
- `Item Report`

## 3. Item Report Implementation

## 3.1 Purpose

Displays item metadata in tabular format and allows CSV export.

## 3.2 Frontend Data Models

Item report page uses nested data shape:

- Community -> Collections -> Items -> Metadata map

Core interfaces are defined in:

- `src/pages/reports/ItemListTable.tsx`
- `src/data/itemReportData.ts`

Main item-level shape:

```ts
interface Item {
  itemId: string;
  itemName?: string;
  metadata: Record<string, string[]>;
}
```

## 3.3 Item Report API

API function:

- `itemReportApi(queryParams)` in `src/api/itemReport.ts`

Endpoint called:

- `GET {siteConfig.apiEndpoint}/api/report/community?page=<page>&size=<size>`

Auth header:

- `Authorization: Bearer <authToken>`

Important implementation detail:

- The API helper explicitly parses `queryParams` and forwards only `page` and `size` to backend.
- Other filter params are ignored in current implementation.

## 3.4 Data Normalization Logic

`itemReportApi` handles multiple backend response formats:

1. raw array response
2. wrapped response under `data`
3. wrapped response under `communities`

It then normalizes metadata values to string arrays and guarantees a Community/Collection/Item structure.

## 3.5 UI State and Controls

Key states in `ItemListTable.tsx`:

- `items`, `collections`, `availableMetadata`, `columns`
- `selectedCollection`, `selectedMetadata`, `metadataValue`
- `startDate`, `endDate`
- `page`, `totalPages`, `loading`, `csvLoading`, `error`

Filter controls shown in UI:

- Collection dropdown
- Metadata dropdown
- Metadata value text input
- Date range input for date-like metadata fields

Date-like metadata is detected with `isDateField()` by checking key names containing:

- `date`, `joiningdate`, `dod`, `created`, `year`

## 3.6 Table Generation

Columns are generated dynamically from metadata keys found in loaded items.

Hidden columns are excluded:

- `dc.date.accessioned`
- `dc.identifier.uri`
- `dc.description.provenance`

Custom label mapping:

- `dc.date.created` -> `Date of Admission`

All other headers are displayed as metadata key without `dc.` prefix.

## 3.7 CSV Export

`downloadCSV()`:

1. Uses current `items` and `columns` in memory.
2. Builds CSV rows from metadata values.
3. Escapes commas/quotes/newlines.
4. Downloads `item_report.csv` with Blob URL.

## 3.8 Current Behavior Caveat (Important)

As currently implemented, filter controls update state and trigger `fetchReport(...)`, but:

- backend request still sends only `page` and `size`
- no client-side filtering is applied before rendering

So effective behavior today is:

- paged report load
- dynamic table/columns
- CSV from currently loaded item set

If you want true filtering in another project, you must implement either:

1. backend filtering (recommended) by passing filter query params, or
2. client-side filtering on `items` before rendering/export.

## 4. User Report Implementation

## 4.1 Purpose

Displays paginated users and their group memberships, with CSV export of all users.

## 4.2 User List API

Base API function:

- `userList(page, size, query)` in `src/api/usermanagement.ts`

Endpoint called:

- `GET {siteConfig.apiEndpoint}/api/eperson/epersons/search/byMetadata?page=<page>&size=<size>&query=<query>`

Headers used:

- `X-XSRF-TOKEN` from localStorage
- `Authorization` from localStorage
- `withCredentials: true`

Response consumed as:

```ts
{
  epersons: EPerson[];
  totalPages: number;
}
```

## 4.3 Group Resolution Flow

User page does two-step fetching:

1. Load users with `userList(...)`.
2. For each user, call `user._links.groups.href` via axios.

It builds:

- `groupMap[user.id] = [groupName1, groupName2, ...]`

Displayed group name priority:

1. `group.metadata["dc.title"][0].value`
2. fallback `group.name`
3. fallback `Unnamed Group`

## 4.4 UI Rendering

Table columns:

- First Name
- Last Name
- Email
- Groups

Name values are read from metadata keys:

- `eperson.firstname`
- `eperson.lastname`

Pagination:

- MUI `Pagination`
- `page` state is 1-based
- API request uses `page - 1`

## 4.5 CSV Export (All Users)

`downloadCSV()` calls `fetchAllUsers()` that:

1. fetches first page to get `totalPages`
2. loops through all pages
3. fetches groups for every user in each page
4. creates CSV rows `[Name, Email, Groups]`
5. downloads `user_list.csv`

This export is global (all pages), not only current page.

## 5. Dependencies Used

- React
- Axios
- Material UI (`@mui/material`, icons)

No third-party table library is used; rendering is built with MUI table primitives.

## 6. Porting Checklist For Another Project

### Step 1: Copy pages and API helpers

- Copy:
  - `ItemListTable.tsx`
  - `UserListWithGroups.tsx`
  - `itemReportApi` from `src/api/itemReport.ts`
  - `userList` from `src/api/usermanagement.ts`

### Step 2: Align auth and CSRF strategy

Current code expects localStorage keys:

- `authToken`
- `csrfToken`

If your target app uses another auth approach, adapt axios headers and credential mode.

### Step 3: Align backend endpoints

Required endpoints:

- Item report: `/api/report/community`
- User list: `/api/eperson/epersons/search/byMetadata`
- Group list per user: dynamic URL from `_links.groups.href`

### Step 4: Register routes and menu links

Add routes:

- `/report/item`
- `/report/user`

Add menu links to Reports section.

### Step 5: Validate metadata keys

Verify your backend returns expected keys:

- Item metadata keys (for dynamic columns)
- User metadata keys `eperson.firstname`, `eperson.lastname`
- Group title metadata `dc.title`

### Step 6: Decide filtering strategy for Item Report

Because current implementation does not truly apply filters, choose one:

1. pass filters to backend API and filter server-side
2. filter items in frontend before table render and CSV generation

### Step 7: Validate CSV outputs

- Item CSV should include visible metadata columns.
- User CSV should include all users and groups.

## 7. Quick Validation After Port

1. `/report/item` loads table and pagination.
2. `/report/user` loads users and group names.
3. User report pagination works.
4. Item report dynamic columns render correctly.
5. Item CSV downloads without malformed rows.
6. User CSV exports all pages.
7. Report routes and sidebar links are accessible by intended roles.
