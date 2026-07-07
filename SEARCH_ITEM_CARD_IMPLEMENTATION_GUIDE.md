# Search Page Item Card Implementation Guide

This document explains exactly how item cards are rendered on the Search page so you can replicate the same behavior in another project.

## 1. Source Files You Need

- `src/pages/Search/Search.tsx`
- `src/pages/Search/Search.css`
- `src/pages/Search/SecureImage.tsx`
- `src/api/searchApi.ts`
- `src/data/searchData.ts` (for metadata field mapping, sort/filter options)

## 2. Data Flow (API -> Card UI)

1. Search requests are built in `searchApi.ts` with `buildApiQueryParams(params)`.
2. The main search API is called by `searchObjects(params)`:
   - Endpoint: `/api/discover/search/objects`
   - Includes: `dsoType=item`
   - Includes embed flags: `embed=thumbnail&embed=item/thumbnail`
3. In `Search.tsx`, `handleSearch(...)` calls `searchObjects(...)`.
4. Results are stored in state:
   - `searchResults`
   - `totalData`
5. UI maps over `searchResults` to render cards in either:
   - list mode (`viewMode === 'list'`)
   - grid mode (`viewMode === 'grid'`)

## 3. Search Result Shape Used By Cards

Each card reads from:

- `result._embedded.indexableObject.uuid`
- `result._embedded.indexableObject.type`
- `result._embedded.indexableObject.metadata`

Important metadata keys used in card UI:

- `dc.title`
- `dc.uhid` (fallback title)
- `dc.description.abstract`
- `dc.assetid`
- `dc.invoiceNumber`
- `dc.DocType`
- `dc.VendorName`
- `dc.date.issued`
- `dc.date.created`
- `dc.EmpName`
- `dc.empid`
- `dc.hrDocNo`
- `dc.ContractStatus`
- `dc.ContractOwner`
- `dc.ContractValue`
- `dc.organization`
- `dc.Material`
- `dc.PaymentTerms`
- `dc.Quantity` (grid mode)
- `dc.type` (display type override)

Title resolution:

- `dc.title` -> `dc.uhid` -> `"Unknown Title"`

## 4. Card Modes

### 4.1 List Card Mode

List mode is rendered when `viewMode === 'list'`.

Key behavior:

- Full-width horizontal card layout.
- Left accent panel (orange) with icon.
- Thumbnail image (up to 100x100).
- Metadata tags shown inline.
- Admin-only delete selection button.
- Card highlight if selected for bulk delete.

Navigation behavior:

- Clicking title opens details page: `/items/:uuid`.

Selection behavior:

- `selectedItems` stores UUIDs.
- `toggleItemSelection(uuid)` adds/removes UUID.

### 4.2 Grid Card Mode

Grid mode is rendered when `viewMode !== 'list'`.

Key behavior:

- Each item uses `.grid_main` card container.
- Click card to open details page.
- If selected, card click toggles selection instead of navigation.
- Top section is `.thumbnail_panel` with background image/thumbnail + dark overlay.
- Metadata labels are displayed inside the panel.
- Bottom actions inside `.thumbnail_actions`:
  - Admin delete icon
  - Arrow icon to open details page

Navigation behavior:

- Opens `/items/:uuid?keyword=<search-input>` in grid mode.

## 5. Thumbnail Rendering (Secure + Auth-aware)

`SecureImage.tsx` handles protected media loading.

How it works:

1. Reads tokens from localStorage:
   - `authToken`
   - `csrfToken`
2. Calls secure endpoint with headers.
3. If response is PDF:
   - renders first page with `pdfjs-dist`
   - converts canvas to PNG blob URL
4. Else:
   - creates blob URL directly from image binary
5. Cleans up blob URL on unmount.

How cards call it:

- `srcPath={`/api/thumbnails/${uuid}`}`

Fallback behavior:

- Grid mode uses `bgImage` fallback when UUID is missing.

## 6. Styles Responsible For Card Look

Primary classes in `Search.css`:

- `.grid_main`: card shell (radius, shadow, padding)
- `.thumbnail_panel`: fixed-height visual panel (`height: 288px`)
- `.thumbnail_actions`: pushes action row to bottom
- `.itemh_btn`, `.itemh_icon`: action button style
- `.results-header`, `.view-mode-button`: view switch area
- `.filters-and-results`, `.search-results`: page two-column layout

Responsive behavior:

- Grid columns change with media queries.
- Search/filter layout stacks on small screens.

## 7. Role-Based Delete UX

Delete controls are visible only when:

- `isAdministrator || isAdmingroup`

Bulk delete flow:

1. User selects cards.
2. Bulk action bar appears.
3. Confirm dialog opens.
4. `deleteItem(uuid)` is called for each selected item.
5. Search list refreshes after delete.

## 8. Porting Checklist For Another Project

### Step 1: Copy core modules

- Copy and adapt:
  - `Search.tsx`
  - `Search.css`
  - `SecureImage.tsx`
  - `searchApi.ts` search functions

### Step 2: Install and verify dependencies

Required packages:

- `@mui/material`
- `react-icons`
- `pdfjs-dist`
- `axios`
- `react-router-dom`

### Step 3: Keep required state

Minimum state:

- `searchResults`
- `viewMode`
- `selectedItems`
- `page`, `size`, `totalData`
- `isLoading`

### Step 4: Keep metadata mapping

If your target project has different metadata fields, update:

- field key names in card extraction logic
- `metadataFields` mapping in `searchData.ts`

### Step 5: Keep thumbnail contract

Ensure backend supports either:

- `/api/thumbnails/:uuid`
- or equivalent secure bitstream endpoint

If auth headers differ, update `SecureImage.tsx` token/header logic.

### Step 6: Keep routing contract

Ensure item detail route exists:

- `/items/:uuid`

If your detail route differs, update `handleTitleClick` in both modes.

### Step 7: Keep admin checks

Expose equivalent role flags in your target app:

- `isAdministrator`
- `isAdmingroup`

Or replace with your authorization checks.

## 9. Minimal Extractable Card Contract

If you want to reuse only card rendering, create a reusable component like:

- `SearchItemCard.tsx`

Suggested props:

- `result`
- `viewMode`
- `isSelected`
- `onToggleSelect(uuid)`
- `onOpen(uuid)`
- `canDelete`
- `keyword`

This lets you keep one card implementation while changing the surrounding page/filter logic.

## 10. Common Integration Pitfalls

- Missing thumbnail endpoint or missing auth headers causes blank image.
- Missing metadata keys causes empty labels (safe, but expected).
- Missing route `/items/:uuid` breaks click navigation.
- Not preserving `stopPropagation()` on icon buttons causes unwanted card navigation.
- Not keeping `selectedItems` state breaks bulk delete UX.

## 11. Quick Validation After Port

1. Search returns items and shows cards.
2. Grid/List toggle works.
3. Thumbnail loads for image and PDF-backed items.
4. Clicking card/title opens detail page.
5. Admin delete selection and bulk delete flow works.
6. Card highlight appears for selected items.
7. Layout remains usable on mobile and desktop.
