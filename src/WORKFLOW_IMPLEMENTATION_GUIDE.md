# DSpace Workflow System - Implementation Guide

A comprehensive guide for implementing the DSpace Workflow feature in another React DSpace instance.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [File Structure](#file-structure)
5. [Data Models & Types](#data-models--types)
6. [API Integration](#api-integration)
7. [Step-by-Step Implementation](#step-by-step-implementation)
8. [Component Integration](#component-integration)
9. [Routing Configuration](#routing-configuration)
10. [State Management](#state-management)
11. [Configuration Requirements](#configuration-requirements)
12. [Testing & Validation](#testing--validation)
13. [Troubleshooting](#troubleshooting)

---

## Overview

The DSpace Workflow System manages the item submission and approval process through workflow tasks. It provides:

- **Workflow Supervision**: View items under supervision with filtering and sorting
- **Workflow Tasks**: Manage pool and claimed tasks with approve/reject functionality
- **Resource Policies**: Control access permissions on items and resources
- **Supervision Orders**: Create and manage supervision relationships
- **Faceted Search**: Advanced filtering with dynamic facets (status, submitter, item type, date range)

---

## Architecture

### System Components

```
Workflow System
├── API Layer
│   ├── workflow.ts           # Supervision and policy management
│   ├── workflowTask.ts       # Task operations
│   └── axiosInstance.ts      # HTTP client configuration
├── Data Layer
│   ├── workflowdata.ts       # Type definitions and constants
│   └── data.ts               # Configuration and utilities
├── Components
│   ├── workflow.tsx          # Supervision list view
│   ├── workflowTask.tsx      # Task management view
│   ├── resourcePolicy.tsx    # Policy editor
│   ├── createResourcePolicy.tsx # Policy creation
│   ├── removeItem.tsx        # Item removal
│   └── supervisionSelecter.tsx # Supervision selector
└── Routing
    └── AppRoutes.tsx         # Route definitions
```

### Data Flow

```
User Interaction
    ↓
React Component (workflow.tsx / workflowTask.tsx)
    ↓
State Management (useState hooks)
    ↓
API Service Layer (workflow.ts / workflowTask.ts)
    ↓
DSpace REST API
    ↓
Response Processing
    ↓
Component Update & UI Render
```

---

## Prerequisites

### Required Dependencies

```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-router-dom": "^7.2.0",
  "axios": "^1.8.1",
  "@mui/material": "^6.4.9",
  "@mui/icons-material": "^6.4.7",
  "typescript": "^4.9.5"
}
```

### Backend Requirements

- DSpace 8.x or later
- REST API enabled
- Authentication tokens support (JWT or session-based)
- CSRF token support
- Workflow API endpoints available

### DSpace API Endpoints Required

```
GET  /api/discover/search/objects (workflow supervision)
GET  /api/discover/facets/{facetName}
GET  /api/submission/workspaceitems/{id}/collection
DELETE /api/submission/workspaceitems/{id}
GET  /api/authz/resourcepolicies/search/resource
PUT  /api/authz/resourcepolicies/{policyId}/group
PATCH /api/authz/resourcepolicies/{policyId}
DELETE /api/authz/resourcepolicies/{id}
POST /api/core/supervisionorders
POST /api/authz/resourcepolicies
GET  /api/discover/search/objects (workflow tasks)
POST /api/workflow/claimedtasks
POST /api/workflow/claimedtasks/{id}
DELETE /api/workflow/claimedtasks/{id}
```

---

## File Structure

### Create the following directory structure in your instance:

```
src/
├── api/
│   ├── workflow.ts              ← Create new
│   ├── workflowTask.ts          ← Create new
│   ├── bitstream.ts             ← Should exist
│   ├── axiosInstance.ts         ← Should exist
│   └── ...
├── data/
│   ├── workflowdata.ts          ← Create new
│   └── data.ts                  ← Add configuration
├── pages/
│   └── workflow/
│       ├── workflow.tsx          ← Create new
│       ├── workflowTask.tsx      ← Create new
│       ├── resourcePolicy.tsx    ← Create new
│       ├── createResourcePolicy.tsx ← Create new
│       ├── removeItem.tsx        ← Create new
│       └── supervisionSelecter.tsx ← Create new
├── routing/
│   └── AppRoutes.tsx            ← Modify existing
└── contexts/
    ├── ToastProvider.tsx        ← Should exist (for notifications)
    └── AuthContext.tsx          ← Should exist (for authentication)
```

---

## Data Models & Types

### Core Interfaces

#### workflowdata.ts

```typescript
// Search Result Types
export interface workflowSearchResult {
  id: string | null;
  scope: string | null;
  query: string | null;
  type: string;
  _embedded: {
    searchResult: {
      _embedded: {
        objects: WorkspaceItem[];
      };
      page: {
        number: number;
        size: number;
        totalPages: number;
        totalElements: number;
      };
    };
  };
}

// Workspace Item Type
export interface WorkspaceItem {
  type: string;
  _embedded: {
    indexableObject: {
      id: number;
      sections: {
        license: {
          url: string | null;
          acceptanceDate: string | null;
          granted: boolean;
        };
        upload: {
          primary: any | null;
          files: FileMetadata[];
        };
        collection: string;
        traditionalpagetwo: Record<string, any>;
        traditionalpageone: Record<string, any> & {
          "dc.publisher"?: MetadataValue[];
          "dc.contributor.author"?: MetadataValue[];
          "dc.type"?: MetadataValue[];
          "dc.title"?: MetadataValue[];
          "dc.date.issued"?: MetadataValue[];
        };
      };
      type: string;
      _embedded: {
        item: {
          id: string;
          uuid: string;
          metadata: Record<string, MetadataValue[]>;
          entityType: string | null;
          type: string;
        };
      };
    };
  };
}

// Filter Configuration
export interface Filtervalue {
  id: string;
  label: string;
  defaultExpanded: boolean;
  fieldName: string;
  filterType: 'checkbox' | 'range';
}

// Search Parameters
export interface SearchParams {
  query?: string;
  page?: number;
  size?: number;
  sort?: string;
  scope?: string;
  filters?: workflowFilters;
}

// Resource Policies
export interface ResourcePolicy {
  _embedded: {
    resourcepolicies: Policies[];
  };
}

export interface Policy {
  id: string;
  name: string;
  policyType: string;
  action: string;
  _embedded: {
    eperson?: {
      uuid: string;
      metadata: {
        'eperson.firstname': [{ value: string }];
        'eperson.lastname': [{ value: string }];
      };
    };
    group?: {
      uuid: string;
      name: string;
    };
  };
}
```

### Metadata Types

```typescript
export interface MetadataValue {
  value: string;
  language: string | null;
  authority: string | null;
  confidence: number;
  place: number;
}

export interface FileMetadata {
  uuid: string;
  metadata: {
    "dc.source": MetadataValue[];
    "dc.title": MetadataValue[];
  };
}
```

### Filter Options

```typescript
export const FilterOption: Filtervalue[] = [
  {
    id: 'namedresourcetype',
    label: 'Status',
    defaultExpanded: true,
    fieldName: 'namedresourcetype',
    filterType: 'checkbox'
  },
  {
    id: 'submitter',
    label: 'Submitter',
    defaultExpanded: false,
    fieldName: 'submitter',
    filterType: 'checkbox'
  },
  {
    id: 'itemType',
    label: 'Item Type',
    defaultExpanded: false,
    fieldName: 'itemtype',
    filterType: 'checkbox'
  },
  {
    id: 'date',
    label: 'Date',
    defaultExpanded: false,
    fieldName: 'dateIssued',
    filterType: 'range'
  },
  {
    id: 'supervisedBy',
    label: 'Supervised By',
    defaultExpanded: false,
    fieldName: 'supervisedBy',
    filterType: 'checkbox'
  }
];

export const sortOptions: SortOption[] = [
  { value: 'relevant', label: 'Most Relevant', apiValue: 'score,DESC' },
  { value: 'title-asc', label: 'Title Ascending', apiValue: 'dc.title,ASC' },
  { value: 'title-desc', label: 'Title Descending', apiValue: 'dc.title,DESC' },
  { value: 'date-asc', label: 'Date Issued Ascending', apiValue: 'dc.date.issued,ASC' },
  { value: 'date-desc', label: 'Date Issued Descending', apiValue: 'dc.date.issued,DESC' },
];

export const policies = [
  { id: 'TYPE_SUBMISSION', value: 'TYPE_SUBMISSION' },
  { id: 'TYPE_WORKFLOW', value: 'TYPE_WORKFLOW' },
  { id: 'TYPE_INHERITED', value: 'TYPE_INHERITED' },
  { id: 'TYPE_CUSTOM', value: 'TYPE_CUSTOM' }
];

export const actionType = [
  { id: 'READ', value: 'READ' },
  { id: 'WRITE', value: 'WRITE' },
  { id: 'REMOVE', value: 'REMOVE' },
  { id: 'ADMIN', value: 'ADMIN' },
  { id: 'DELETE', value: 'DELETE' },
  { id: 'WITHDRAWN_READ', value: 'WITHDRAWN_READ' },
  { id: 'DEFAULT_BITSTREAM_READ', value: 'DEFAULT_BITSTREAM_READ' },
  { id: 'DEFAULT_ITEM_READ', value: 'DEFAULT_ITEM_READ' }
];
```

---

## API Integration

### Workflow API Service (workflow.ts)

**Key Functions:**

#### Search & Listing

```typescript
export const getWorkflowObject = async (params: SearchParams)
  // Fetch workflow objects with search and filters
  // Configuration: 'supervision'

export const getWorkspaceItem = async (id: string)
  // Get metadata for a specific workspace item

export const parseSearchParamsFromUrl = (): SearchParams
  // Parse URL query parameters into SearchParams format

export const updateUrlWithSearchParams = (params: SearchParams)
  // Update browser URL with current search parameters
```

#### Faceting

```typescript
export const workflowFacet = async (
  facetName: string,
  params: SearchParams,
  facetPage?: number,
  facetSize?: number
): Promise<FilterOption[]>
  // Fetch facet values for a specific facet

export const workflowFacets = async (params: SearchParams)
  // Fetch all available facets in parallel
```

#### Resource Policies

```typescript
export const getResourcePolicies = async (id: string): Promise<ResourcePolicy>
  // Get all resource policies for a specific resource

export const updateResourcePolicyGroup = async (policyId: string, groupId: string)
  // Update resource policy to assign to a group

export const updateResourcePolicyMetadata = async (policyId: string, data: ResourcePolicyData)
  // Update resource policy metadata (action, etc.)

export const removeResourcePolicy = async (id: string)
  // Delete a resource policy

export const AddResourcePolicyForEperson = async (uuid: string, selectedId: string, formData: string)
  // Create resource policy for a user

export const AddResourcePolicyForGroup = async (uuid: string, selectedId: string, formData: string)
  // Create resource policy for a group
```

#### Supervision Management

```typescript
export const createSupervisionOrder = async (uuid: string, group: string, type: string)
  // Create a new supervision order

export const removeWorkspaceItem = async (id: string)
  // Delete a workspace item
```

### Workflow Task API Service (workflowTask.ts)

**Key Functions:**

```typescript
export const getWorkflowObjects = async (params: WorkflowSearchParams)
  // Fetch workflow task objects
  // Configuration: 'workflow'

export const getWorkflowSubmittersFacet = async (params: WorkflowSearchParams)
  // Get submitter facets for workflow tasks

export const getWorkflowItemTypesFacet = async (params: WorkflowSearchParams)
  // Get item type facets for workflow tasks

export const getWorkflowNamedResourceTypesFacet = async (params: WorkflowSearchParams)
  // Get resource type facets for workflow tasks

export const claimedtask = async (id: string)
  // Claim a pool task

export const approveClaimedTask = async (id: number)
  // Approve a claimed task

export const deleteClaimedTask = async (id: number)
  // Return a claimed task to pool

export const rejectClaimedTask = async (id: number, reason: string)
  // Reject a claimed task with reason
```

### Authentication & Headers

All API requests include:

```typescript
const authToken = localStorage.getItem("authToken") || "";
const csrfToken = localStorage.getItem("csrfToken") || "";

// Headers format:
{
  "Content-Type": "application/json",
  "X-XSRF-TOKEN": csrfToken,
  "Authorization": authToken,
  withCredentials: true
}
```

---

## Step-by-Step Implementation

### Step 1: Copy API Files

1. Copy `src/api/workflow.ts` to your instance
2. Copy `src/api/workflowTask.ts` to your instance
3. Ensure `src/api/axiosInstance.ts` exists and is properly configured

**Verify:**
- API endpoint configuration matches your DSpace instance URL
- Authentication tokens are being retrieved correctly
- CSRF tokens are available in localStorage

### Step 2: Copy Data/Type Files

1. Copy `src/data/workflowdata.ts` to your instance
2. Ensure `src/data/data.ts` is configured with correct API endpoint:

```typescript
// In src/data/data.ts
export const siteConfig = {
  apiEndpoint: "https://your-dspace-instance/server",
  // ... other config
};
```

### Step 3: Create Component Files

Create the component files in `src/pages/workflow/`:

**Files to create:**
- `workflow.tsx` - Main supervision list component
- `workflowTask.tsx` - Task management component
- `resourcePolicy.tsx` - Policy editor component
- `createResourcePolicy.tsx` - Policy creation component
- `removeItem.tsx` - Item removal component
- `supervisionSelecter.tsx` - Supervision selector component

### Step 4: Add Routing

Update `src/routing/AppRoutes.tsx`:

```typescript
import Workflow from "../pages/workflow/workflow";
import WorkflowTask from "../pages/workflow/workflowTask";
import ResourcePolicy from "../pages/workflow/resourcePolicy";
import CreateResourcePolicy from "../pages/workflow/createResourcePolicy";
import RemoveItem from "../pages/workflow/removeItem";
import SupervisionSelecter from "../pages/workflow/supervisionSelecter";

// Inside Routes component:
<Route path="/workflow" element={<ProtectedRoute element={<Workflow />} />} />
<Route path="/workflow-task" element={<ProtectedRoute element={<WorkflowTask />} />} />
<Route path="/resource-policy/:id" element={<ProtectedRoute element={<ResourcePolicy />} />} />
<Route path="/create-resource-policy/:id" element={<ProtectedRoute element={<CreateResourcePolicy />} />} />
<Route path="/remove-item/:id" element={<ProtectedRoute element={<RemoveItem />} />} />
<Route path="/supervision-selector" element={<ProtectedRoute element={<SupervisionSelecter />} />} />
```

### Step 5: Add Navigation Links

Update your sidebar or navigation menu to include workflow links:

```typescript
{
  label: "Workflow Supervision",
  path: "/workflow",
  icon: faCheckCircle,
  roles: ['admin', 'supervisor']
}
{
  label: "Workflow Tasks",
  path: "/workflow-task",
  icon: faClipboardList,
  roles: ['admin', 'supervisor']
}
```

### Step 6: Configure Toast Notifications

Ensure `src/contexts/ToastProvider.tsx` is properly exported:

```typescript
import { ToastProvider } from "../contexts/ToastProvider";

// Wrap your app with ToastProvider
<ToastProvider>
  <YourApp />
</ToastProvider>
```

### Step 7: Install Dependencies

Ensure all required dependencies are installed:

```bash
npm install axios react-router-dom @mui/material @mui/icons-material
```

---

## Component Integration

### Workflow Supervisor Component (workflow.tsx)

**Key Features:**
- Display workflow items under supervision
- Faceted search with dynamic filtering
- Grid/List view toggle
- Pagination support
- Sort options
- URL state persistence

**State Management:**
```typescript
const [inputValue, setInputValue] = useState(''); // Search query
const [isLoading, setIsLoading] = useState(false);
const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
const [page, setPage] = useState(1);
const [size, setSize] = useState(10);
const [searchResults, setSearchResults] = useState<WorkspaceItem[]>([]);
const [totalData, setTotalData] = useState(0);
const [filters, setFilters] = useState({});
const [facets, setFacets] = useState({});
const [sortOption, setSortOption] = useState('relevant');
```

**Key Methods:**
- `handleSearch()` - Perform search with current filters
- `updateFilter()` - Update filter selection
- `handlePageChange()` - Handle pagination
- `resetFilters()` - Clear all filters

### Workflow Task Component (workflowTask.tsx)

**Key Features:**
- Display workflow tasks (pool and claimed)
- Task actions: claim, approve, reject, return
- Advanced filtering
- Task metadata display

**State Management:**
```typescript
const [workflowItems, setWorkflowItems] = useState<EnhancedWorkflowItem[]>([]);
const [filters, setFilters] = useState({});
const [facets, setFacets] = useState({});
```

**Key Methods:**
- `handleSearch()` - Fetch workflow tasks
- `handleClaimTask()` - Claim a pool task
- `handleApproveTask()` - Approve a task
- `handleReturnClick()` - Return task to pool
- `handleDeleteClick()` - Reject task

### Resource Policy Component (resourcePolicy.tsx)

**Features:**
- Display and edit resource policies
- Add/remove policies
- Assign policies to users/groups
- Policy action selection

### Additional Components

- **createResourcePolicy.tsx** - Policy creation wizard
- **removeItem.tsx** - Item removal with confirmation
- **supervisionSelecter.tsx** - Select supervision relationships

---

## Routing Configuration

### URL Pattern Reference

```
/workflow
  - Main workflow supervision view
  - Query params: page, size, query, sort, filters

/workflow-task
  - Workflow task management
  - Query params: page, size, query, sort, filters

/resource-policy/:id
  - Resource policy editor for resource ID

/supervision-selector
  - Supervision relationship selector

/create-resource-policy/:id
  - Create new resource policy for resource ID

/remove-item/:id
  - Remove/delete item ID
```

### Protected Routes

All workflow routes should be protected by role:
```typescript
const ProtectedRoute = ({ element }: { element: React.ReactElement }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return element;
};
```

---

## State Management

### Search State Pattern

```typescript
// 1. Parse URL on component mount
useEffect(() => {
  const initialParams = parseSearchParamsFromUrl();
  // Set initial state from URL
}, []);

// 2. Update URL when state changes
useEffect(() => {
  updateUrlWithSearchParams({
    query: inputValue,
    page: page - 1,
    size: size,
    sort: getSortParam(),
    filters: filters
  });
}, [inputValue, page, size, filters]);

// 3. Fetch data when params change
useEffect(() => {
  handleSearch();
}, [page, size, filters]);
```

### Facet Management

```typescript
// 1. Fetch all facets on mount and after filter change
const fetchAllFacets = async (currentFilters) => {
  const facetsResponse = await workflowFacets(params);
  setFacets(facetsResponse);
};

// 2. Load more facet items with pagination
const loadMoreFacetItems = async (sectionId) => {
  const newValues = await workflowFacet(
    section.fieldName,
    params,
    nextPage,
    5 // items per page
  );
  setFacets(prev => ({
    ...prev,
    [sectionId]: [...(prev[sectionId] || []), ...newValues]
  }));
};
```

### Filter Updates

```typescript
const updateFilter = (filterType: string, value: any, isChecked: boolean) => {
  setFilters(prev => {
    const newFilters = {
      ...prev,
      [filterType]: isChecked
        ? [...(prev[filterType] || []), value]
        : (prev[filterType] || []).filter(item => item !== value)
    };
    handleSearch(newFilters, 1, size, true);
    return newFilters;
  });
};
```

---

## Configuration Requirements

### Environment Setup

1. **API Endpoint Configuration** (`src/data/data.ts`):
```typescript
export const siteConfig = {
  apiEndpoint: process.env.REACT_APP_API_ENDPOINT || "http://localhost:8080/server",
};
```

2. **Environment Variables** (`.env`):
```
REACT_APP_API_ENDPOINT=https://your-dspace-instance/server
```

### Authentication Setup

The workflow system requires:
- Valid authentication token in `localStorage.authToken`
- CSRF token in `localStorage.csrfToken`
- User must have workflow admin/supervisor role

### DSpace Backend Configuration

Ensure workflow is enabled in your DSpace instance:

```
# In dspace.cfg
# Workflow configuration
workflow.framework = 

# Enable REST API
rest.enabled = true

# Enable CORS if frontend is on different domain
cors.allowed-origins = https://your-frontend-domain
```

### UI Framework Setup

The workflow uses Material-UI (MUI) and Bootstrap:

```typescript
// Ensure both are installed and configured
import { Grid, Container, Button } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
```

---

## Testing & Validation

### Pre-Deployment Checklist

- [ ] All API files copied and configured
- [ ] Component files created and imported
- [ ] Routes added to AppRoutes.tsx
- [ ] API endpoint configured correctly
- [ ] Authentication working (login successful)
- [ ] CSRF tokens being generated
- [ ] Toast notifications displaying
- [ ] Search functionality working
- [ ] Filters applying correctly
- [ ] Pagination working
- [ ] Task operations (approve, reject) working
- [ ] Policy management working

### Testing Workflow Features

#### Search & Filter Testing
```javascript
// Test basic search
1. Navigate to /workflow
2. Enter search query
3. Verify results appear
4. Apply filters
5. Verify results filtered correctly
```

#### Task Management Testing
```javascript
// Test task operations
1. Navigate to /workflow-task
2. Find pool task and claim it
3. Verify claimed tasks appear
4. Approve a task
5. Verify task completes
6. Test rejection with reason
```

#### Policy Management Testing
```javascript
// Test resource policies
1. Navigate to resource policy page
2. Create new policy
3. Assign to user/group
4. Edit policy action
5. Remove policy
6. Verify changes saved
```

### Error Handling Testing

```javascript
// Test error scenarios
1. Invalid search query
2. Network timeout
3. Permission denied (403)
4. Unauthorized (401)
5. Server error (500)

// Verify error messages display correctly
```

---

## Troubleshooting

### Common Issues & Solutions

#### 1. "Authentication Failed" Error

**Problem:** Cannot access workflow pages even when logged in

**Solutions:**
```typescript
// Check 1: Verify auth token exists
console.log(localStorage.getItem('authToken'));

// Check 2: Verify token format
// Should be "Bearer {token}" or just the token depending on API

// Check 3: Check API endpoint
console.log(siteConfig.apiEndpoint);

// Check 4: Verify CORS is configured (if different domain)
```

#### 2. Search Returns Empty Results

**Problem:** Search queries not returning any results

**Solutions:**
```typescript
// Check 1: Verify search configuration
// Configuration must be 'supervision' for workflow.tsx
// Configuration must be 'workflow' for workflowTask.tsx

// Check 2: Check URL parameters being sent
console.log("Query params:", buildApiQueryParams(params));

// Check 3: Verify search index is up to date
// Run: index-discovery -b on DSpace server
```

#### 3. Filters Not Working

**Problem:** Filter selections don't affect search results

**Solutions:**
```typescript
// Check 1: Verify filter params are being built
console.log("Filter params:", buildFilterParams(filters));

// Check 2: Ensure facet field names match API
// Common issue: 'itemtype' vs 'itemType'

// Check 3: Check filter timeout settings
```

#### 4. CSRF Token Errors

**Problem:** Getting CSRF token validation errors

**Solutions:**
```typescript
// Check 1: Verify CSRF token exists
console.log(localStorage.getItem('csrfToken'));

// Check 2: Ensure token header is included
// Header name: "X-XSRF-TOKEN"

// Check 3: Check token refresh on login
// Token should be set after successful authentication
```

#### 5. Toast Notifications Not Showing

**Problem:** Error/success messages not displayed

**Solutions:**
```typescript
// Check 1: Verify ToastProvider is wrapping app
// In App.tsx or index.tsx

// Check 2: Import showToast correctly
import { showToast } from '../contexts/ToastProvider';

// Check 3: Check toast usage
showToast("Message text", "success" | "error" | "info");
```

#### 6. Pagination Not Working

**Problem:** Page changes not loading new data

**Solutions:**
```typescript
// Check 1: Verify page param is being sent
console.log("Page param:", page - 1); // Note: API uses 0-based indexing

// Check 2: Check total results count
console.log("Total data:", totalData);

// Check 3: Verify page change handler
// Should call handleSearch with new page
```

#### 7. Sort Not Applied

**Problem:** Sort option selection doesn't sort results

**Solutions:**
```typescript
// Check 1: Verify sort param is being sent
const sortParam = getSortParam(); // Should return 'score,DESC' etc.

// Check 2: Check sort options mapping
// value (UI) to apiValue (API) mapping

// Check 3: Verify sort is included in search params
console.log("Sort param:", sort);
```

### Debug Mode

Enable detailed logging:

```typescript
// Add to workflow.tsx
const DEBUG = true;

const handleSearch = async (...) => {
  if (DEBUG) {
    console.log('Search Params:', { inputValue, page, size, filters, sort });
    console.log('API URL:', apiUrl);
    console.log('Headers:', headers);
  }
  // ... rest of function
};
```

### API Response Inspection

```typescript
// Add to any API call to inspect response
try {
  const response = await axios.get(url, config);
  console.log('API Response:', response.data);
  console.log('Response Status:', response.status);
  return response.data;
} catch (error) {
  console.error('API Error:', error.response);
  console.error('Error Status:', error.response?.status);
  console.error('Error Data:', error.response?.data);
}
```

### Network Inspection

Use browser DevTools:
1. Open Network tab
2. Look for API calls to `/api/discover/search/objects`
3. Check:
   - Status code (should be 200)
   - Response data structure
   - Request headers (including Authorization, X-XSRF-TOKEN)
   - Query parameters

---

## Performance Optimization

### Lazy Loading Facets

```typescript
// Load facets only for expanded sections
const fetchFacetIfNeeded = (sectionId: string) => {
  if (!facets[sectionId] && expandedSections[sectionId]) {
    loadFacet(sectionId);
  }
};
```

### Debounce Search Input

```typescript
import { useCallback } from 'react';

const debouncedSearch = useCallback(
  debounce((query: string) => {
    handleSearch({ ...filters, query }, 1, size, true);
  }, 500),
  [filters, size]
);
```

### Memoize Components

```typescript
const FilterSection = React.memo(({ section, facets, onFilter }) => {
  // Component code
});
```

### Pagination Limits

```typescript
// Cap results per page
const resultsPerPageOptions = [5, 10, 20, 50];
// Default: 10 items per page
```

---

## Security Considerations

### Token Management

- Tokens should be stored securely (preferably in HttpOnly cookies)
- Never expose tokens in logs
- Refresh tokens when expired
- Clear tokens on logout

### Input Validation

```typescript
// Always validate and sanitize user input
const sanitizeQuery = (query: string): string => {
  return query.trim().replace(/[<>&"']/g, '');
};
```

### CORS & CSRF

- Enable CORS only for trusted domains
- Verify CSRF token on mutations
- Use `withCredentials: true` for authenticated requests

### Role-Based Access Control

```typescript
// Verify user role before showing components
const hasAccess = userRoles.includes('workflow_supervisor');

if (!hasAccess) {
  return <Navigate to="/unauthorized" />;
}
```

---

## Support & Resources

### DSpace Documentation
- [DSpace REST API](https://wiki.dspace.org/display/DSDOC8x/REST+API)
- [DSpace Workflow](https://wiki.dspace.org/display/DSDOC8x/Workflow)

### React DSpace Implementation
- Reference implementation in this repository
- Component structure follows React best practices
- Hooks-based state management (no Redux required)

### Getting Help

1. Check the troubleshooting section above
2. Review API response in browser DevTools
3. Check DSpace logs: `dspace/log/dspace.log.x`
4. Review browser console for JavaScript errors
5. Verify backend configuration

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Mar 2026 | Initial implementation guide |

---

## Appendix: Complete File Templates

### Template: workflow.ts API Service

```typescript
import axios from 'axios';
import { siteConfig } from '../data/data';

const authToken = localStorage.getItem('authToken') || '';
const csrfToken = localStorage.getItem('csrfToken') || '';

// Build query parameters for API
const buildApiQueryParams = (params: SearchParams): string => {
  const queryParams = new URLSearchParams();
  queryParams.append('configuration', 'supervision');
  queryParams.append('page', (params.page || 0).toString());
  queryParams.append('size', (params.size || 10).toString());
  
  if (params.sort) {
    queryParams.append('sort', params.sort || 'score,DESC');
  }
  
  // Add filters...
  return queryParams.toString();
};

// Fetch workflow objects
export const getWorkflowObject = async (params: SearchParams) => {
  let apiUrl = `${siteConfig.apiEndpoint}/api/discover/search/objects?${buildApiQueryParams(params)}`;
  
  try {
    const response = await axios.get(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: authToken,
      },
      withCredentials: true,
    });
    return {
      objects: response.data._embedded.searchResult._embedded.objects,
      totalElements: response.data._embedded.searchResult.page?.totalElements
    };
  } catch (error: any) {
    // Handle error...
  }
};

// Export other functions...
```

---

**Document Version:** 1.0  
**Last Updated:** March 2026  
**Created for:** React DSpace Workflow Implementation
