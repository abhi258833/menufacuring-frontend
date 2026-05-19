# Workflow Implementation Porting Guide

This guide documents how workflow is implemented in this project so you can reproduce it in another React + TypeScript project.

## 1. What Is Implemented Here

This project has two workflow modules:

1. Workflow Supervision
- Page: list/search/filter workspace workflow objects
- Actions: manage policies, create supervision, remove workspace item
- Main files:
  - `src/pages/workflow/workflow.tsx`
  - `src/api/workflow.ts`
  - `src/data/workflowdata.ts`

2. Workflow Task Management
- Page: list/search/filter pool/claimed tasks
- Actions: claim, approve, reject, return to pool
- Main files:
  - `src/pages/workflow/workflowTask.tsx`
  - `src/api/workflowTask.ts`
  - `src/data/workflowTaskData.ts`

## 2. Required Foundations

Before workflow pages work, ensure:

1. Base API URL
- Configure `siteConfig.apiEndpoint` (example: `http://localhost:8080/server`).

2. Authentication
- JWT in `localStorage` key: `authToken`.
- Send as `Authorization` header.

3. CSRF
- CSRF token in `localStorage` key: `csrfToken`.
- Send as `X-XSRF-TOKEN` for state-changing requests.
- Always use `withCredentials: true` in axios calls.

4. Error pages/routes
- `/error-400`, `/error-401`, `/error-403`, `/error-404`, `/error-422`, `/error-500`.

## 3. Route Setup

Add routes similar to this project:

- `/workflowSearch` -> workflow supervision page
- `/workflowTask` -> workflow task page (protected)
- `/removeWorkflowItem/:id`
- `/resourcePolicy/:id`
- `/supervisionSelecter/:uuid`
- `/createResourcePolicy/:uuid`

## 4. API Contract Used in This Project

## 4.1 Workflow Supervision APIs (`src/api/workflow.ts`)

1. Search workflow objects
- `GET /api/discover/search/objects`
- Query params used:
  - `configuration=supervision`
  - `sort`, `page`, `size`, `query`
  - filters as `f.<fieldName>=<value>,equals`
  - special date filter: `f.dateIssued=[YYYY TO YYYY],equals`
  - embeds used: `thumbnail`, `item/thumbnail`, `accessStatus`, `supervisionOrders`

2. Facets
- `GET /api/discover/facets/{facetName}`
- Same search context params as above.

3. Remove workspace item
- `DELETE /api/submission/workspaceitems/{id}`

4. Resource policies
- `GET /api/authz/resourcepolicies/search/resource?uuid={id}&embed=eperson&embed=group`
- `PATCH /api/authz/resourcepolicies/{policyId}`
- `PUT /api/authz/resourcepolicies/{policyId}/group` with `text/uri-list`
- `DELETE /api/authz/resourcepolicies/{id}`

## 4.2 Workflow Task APIs (`src/api/workflowTask.ts`)

1. Search task objects
- `GET /api/discover/search/objects`
- Query params:
  - `configuration=workflow`
  - `sort`, `page`, `size`, `query`
  - filters as `f.<fieldName>=...`
  - embeds: `thumbnail`, `item/thumbnail`

2. Task facets
- `GET /api/discover/facets/submitter`
- `GET /api/discover/facets/itemtype`
- `GET /api/discover/facets/namedresourcetype`

3. Claim pool task
- `POST /api/workflow/claimedtasks`
- Body type: `text/uri-list`
- Body value: `${apiEndpoint}/api/workflow/pooltasks/{id}`

4. Approve claimed task
- `POST /api/workflow/claimedtasks/{id}`
- Body type: `application/x-www-form-urlencoded`
- Body: `submit_approve=true`

5. Reject claimed task
- `POST /api/workflow/claimedtasks/{id}`
- Body type: `application/x-www-form-urlencoded`
- Body: `submit_reject=true&reason=<text>`

6. Return claimed task to pool
- `DELETE /api/workflow/claimedtasks/{id}`

## 5. Data Model Pattern

Create typed models for:

1. Search response wrappers
- `_embedded.searchResult._embedded.objects[]`
- `page.totalElements`, `page.totalPages`

2. Item metadata structure
- Use safe optional access to `sections.traditionalpageone`.

3. Facet response
- `_embedded.values[]` with `label`, `count`, optional `authorityKey`.

4. Task item normalization
- Map backend object to UI type with derived `taskType` and metadata.

## 6. UI Architecture Pattern

Both pages follow same pattern:

1. Local state
- `inputValue`, `isLoading`, `page`, `size`, `filters`, `facets`, `sortOption`, result list, total count.

2. Search pipeline
- Build params from UI state.
- Fetch list data.
- Fetch facets for sidebar.
- Update pagination and totals.

3. Filter pipeline
- Toggle filter value.
- Re-run search from page 1.
- Re-fetch facets with current filter context.

4. URL synchronization (supervision page)
- Read initial state from URL query params.
- Push updated query params on search.

5. User actions
- Each action calls API and refreshes current page.

## 7. Step-by-Step Porting Plan

1. Copy/implement shared infrastructure
- Axios setup with auth + CSRF + `withCredentials: true`.
- Toast utility and error page routes.

2. Create data types first
- Port structures from `workflowdata.ts` and `workflowTaskData.ts`.
- Keep field names aligned with your backend response.

3. Implement API services
- Build `workflow.ts` and `workflowTask.ts` equivalents.
- Keep request content-types exactly as required per endpoint.

4. Build supervision UI
- Search bar, filter sidebar, sort, result cards/list, pagination.
- Add action buttons (policy, supervision, remove).

5. Build task UI
- Search, facets, view toggle, pagination.
- Add task buttons (claim, approve, reject, return).

6. Wire routes
- Add all workflow routes listed in Section 3.

7. Validate end-to-end
- Test with real authenticated user and CSRF token.
- Test every action endpoint and error redirect handling.

## 8. Critical Gotchas (Important)

1. Filter key consistency
- Keep UI filter IDs and backend field names consistent.
- Example mismatch risks: `itemType` vs `itemtype`, `date` vs `dateIssued`.

2. Action request formats
- Claim requires `text/uri-list` body.
- Approve/reject require `application/x-www-form-urlencoded`.
- Wrong format causes 4xx errors.

3. Auth/CSRF retrieval timing
- Current implementation reads tokens from localStorage at module load.
- For dynamic updates, prefer reading token per request or using interceptor.

4. Facet pagination
- Task page supports load-more behavior; keep per-section page/size state.

5. Error redirects
- Current project redirects on API errors. If you prefer inline toasts, replace redirect logic centrally.

## 9. Minimal API Service Skeleton

```ts
import axios from "axios";

const api = axios.create({ withCredentials: true });

const auth = () => localStorage.getItem("authToken") || "";
const csrf = () => localStorage.getItem("csrfToken") || "";

export async function getWorkflowObjects(url: string) {
  const res = await api.get(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: auth(),
    },
  });
  return res.data;
}

export async function claimTask(apiEndpoint: string, id: string) {
  const res = await api.post(
    `${apiEndpoint}/api/workflow/claimedtasks`,
    `${apiEndpoint}/api/workflow/pooltasks/${id}`,
    {
      headers: {
        "Content-Type": "text/uri-list",
        "X-XSRF-TOKEN": csrf(),
        Authorization: auth(),
      },
    }
  );
  return res.data;
}
```

## 10. Porting Checklist

- [ ] Base API endpoint configured
- [ ] Auth + CSRF + withCredentials working
- [ ] Error routes/pages created
- [ ] Workflow supervision API + page working
- [ ] Workflow task API + page working
- [ ] Facets and filters mapping verified
- [ ] Claim/approve/reject/return actions verified
- [ ] Pagination and sorting verified
- [ ] Route protection applied where needed

---

If you want, I can also generate a second version of this guide as a strict "copy-paste starter pack" with ready-made files (`workflow.api.ts`, `workflow.types.ts`, `WorkflowPage.tsx`, `WorkflowTaskPage.tsx`) for your next project.
