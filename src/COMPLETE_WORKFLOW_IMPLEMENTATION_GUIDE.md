# Complete Workflow Implementation Guide

## Overview

This document provides step-by-step instructions for implementing the complete workflow system in another DSpace 8.x React project. The workflow system includes search, filtering, faceted navigation, task management, and action handling (claim, approve, reject, delete).

**Target Framework:** React 18.x with TypeScript  
**API Version:** DSpace 8.x REST API  
**HTTP Client:** Axios  
**State Management:** React Hooks (useState, useEffect)

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Type Definitions & Data Models](#2-type-definitions--data-models)
3. [API Layer Implementation](#3-api-layer-implementation)
4. [UI Components & Pages](#4-ui-components--pages)
5. [State Management](#5-state-management)
6. [Integration Steps](#6-integration-steps)
7. [Configuration](#7-configuration)
8. [Testing Checklist](#8-testing-checklist)
9. [Common Issues & Solutions](#9-common-issues--solutions)

---

## 1. Project Structure

```
src/
├── api/
│   ├── workflow.ts                 # Supervision/workflow search API
│   ├── workflowTask.ts             # Workflow task actions API
│   └── axiosInstance.ts            # Axios configuration
├── data/
│   ├── workflowdata.ts             # Type definitions & filter/sort options
│   ├── workflowTaskData.ts         # Task-specific types
│   └── data.ts                     # Site config (siteConfig object)
├── pages/
│   └── workflow/
│       ├── workflow.tsx            # Supervision search page
│       ├── workflowTask.tsx        # Task management page
│       └── [styling files]
├── utils/
│   └── [utility functions]
└── contexts/
    └── [Auth, CSRF, Toast contexts as needed]
```

---

## 2. Type Definitions & Data Models

### File: `src/data/workflowdata.ts`

This file contains all type definitions and configuration for the supervision/workflow search.

```typescript
// Type definitions for search results
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

// Type for individual workspace items
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

// File metadata structure
interface FileMetadata {
  uuid: string;
  metadata: {
    "dc.source": MetadataValue[];
    "dc.title": MetadataValue[];
  };
}

// Standard DSpace metadata value
export interface MetadataValue {
  value: string;
  language: string | null;
  authority: string | null;
  confidence: number;
  place: number;
}

// Filter section definition
export interface Filtervalue {
  id: string;
  label: string;
  defaultExpanded: boolean;
  fieldName: string;
  filterType: 'checkbox' | 'range';
}

// Filter option constant array
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

// Workflow filters interface
export interface workflowFilters {
  [key: string]: string[] | boolean | null | undefined;
  namedresourcetype?: string[];
  submitter?: string[];
  itemType?: string[];
  date?: string[];
  supervisedBy?: string[];
}

// Facet filter result
export interface FacetFilterOption {
  id: string;
  label: string;
  count: number;
}

// Facet API response
export interface FacetResult {
  _embedded: {
    values: Array<{ label: string; count: number }>;
  };
  page?: {
    totalElements: number;
  };
}

// Sort option definition
export interface SortOption {
  value: string;
  label: string;
  apiValue: string;
}

// Sort options for supervision
export const sortOptions: SortOption[] = [
  { value: 'relevant', label: 'Most Relevant', apiValue: 'score,DESC' },
  { value: 'title-asc', label: 'Title Ascending', apiValue: 'dc.title,ASC' },
  { value: 'title-desc', label: 'Title Descending', apiValue: 'dc.title,DESC' },
  { value: 'date-asc', label: 'Date Issued Ascending', apiValue: 'dc.date.issued,ASC' },
  { value: 'date-desc', label: 'Date Issued Descending', apiValue: 'dc.date.issued,DESC' },
];

// Search parameters interface
export interface SearchParams {
  query?: string;
  page?: number;
  size?: number;
  sort?: string;
  scope?: string;
  filters?: workflowFilters;
}

// More type definitions for policies, etc. as needed...
```

### File: `src/data/workflowTaskData.ts`

Task-specific types for workflow task management.

```typescript
export interface SortOption {
  value: string;
  label: string;
  apiValue: string;
}

// Facet response from API
export interface FacetResponse {
  _embedded?: {
    values?: FacetValue[];
  };
}

// Individual facet value
export interface FacetValue {
  label: string;
  count: number;
  authorityKey: string | null;
  _links: {
    search: {
      href: string;
    };
  };
}

// Workflow objects response
export interface WorkflowObjectsResponse {
  _embedded: {
    searchResult: {
      _embedded: {
        objects: Array<{
          _embedded: {
            indexableObject: {
              id: number;
              type: "claimedtask" | "pooltask";
              workflow: WorkflowItem;
            }
          };
        }>;
      };
      page: {
        totalElements: number;
        totalPages: number;
        number: number;
        size: number;
      };
    };
  };
  _links: {
    self: {
      href: string;
    };
  };
}

// Workflow item with task details
export interface WorkflowItem {
  id: number;
  type: string;
  lastModified?: string;
  _links: {
    self: { href: string };
    step?: { href: string };
    action?: { href: string };
    owner?: { href: string };
    workflowitem?: { href: string };
  };
  _embedded: {
    owner?: {
      id: string;
      uuid: string;
      name: string;
      email: string;
      metadata?: {
        "eperson.firstname"?: { value: string }[];
        "eperson.lastname"?: { value: string }[];
      };
      _links?: {
        groups: { href: string };
        self: { href: string };
      };
    };
    action?: {
      id: string;
      options: string[];
      type: string;
      advanced: boolean;
      _links?: {
        self: { href: string };
      };
    };
    workflowitem: {
      id: number;
      lastModified: string;
      sections: {
        license?: {
          url: string;
          acceptanceDate: string;
          granted: boolean;
        };
        upload?: {
          primary: null | string;
          files: {
            uuid: string;
            metadata: {
              'dc.title': { value: string }[];
              [key: string]: { value: string }[];
            };
            accessConditions: any[];
            format?: {
              id: number;
              shortDescription: string;
              mimetype: string;
              description?: string;
              supportLevel?: string;
            };
            sizeBytes?: number;
            checkSum?: {
              checkSumAlgorithm: string;
              value: string;
            };
            url?: string;
          }[];
        };
        collection?: string;
        traditionalpageone?: {
          'dc.title'?: { value: string }[];
          'dc.type'?: { value: string }[];
          'dc.date.issued'?: { value: string }[];
          'dc.contributor.author'?: { value: string }[];
          'dc.publisher'?: { value: string }[];
          'dc.description.abstract'?: { value: string }[];
          [key: string]: { value: string }[] | undefined;
        };
        traditionalpagetwo?: Record<string, any>;
      };
      _links: {
        item: { href: string };
        collection?: { href: string };
        submissionDefinition?: { href: string };
        step?: { href: string };
        submitter?: { href: string };
        self?: { href: string };
      };
      _embedded?: {
        submissionDefinition?: {
          id: string;
          name: string;
          isDefault: boolean;
          _links?: {
            collections: { href: string };
            sections: { href: string };
            self: { href: string };
          };
        };
      };
    };
  };
}

// Extended workflow item with task type
export interface EnhancedWorkflowItem extends WorkflowItem {
  taskType: "claimedtask" | "pooltask";
}

// Sort options for tasks
export const sortOptions: SortOption[] = [
  { value: 'relevant', label: 'Most Relevant', apiValue: 'lastModified,DESC' },
  { value: 'title-asc', label: 'Title Ascending', apiValue: 'dc.title,ASC' },
  { value: 'title-desc', label: 'Title Descending', apiValue: 'dc.title,DESC' },
  { value: 'date-asc', label: 'Date Issued Ascending', apiValue: 'dc.date.issued,ASC' },
  { value: 'date-desc', label: 'Date Issued Descending', apiValue: 'dc.date.issued,DESC' },
];
```

---

## 3. API Layer Implementation

### File: `src/api/workflow.ts`

API functions for supervision/workflow search.

```typescript
import { siteConfig } from "../data/data";
import axios from "axios";
import { 
  SearchParams, 
  workflowSearchResult, 
  FacetFilterOption, 
  FacetResult,
  FilterOption 
} from "../data/workflowdata";

const authToken = localStorage.getItem("authToken") || "";
const csrfToken = localStorage.getItem("csrfToken") || "";

/**
 * Build URL query parameters for API request
 * Maps search params to API query string
 */
const buildApiQueryParams = (params: SearchParams): string => {
  const queryParams = new URLSearchParams();
  
  // Add configuration for supervision
  queryParams.append('configuration', 'supervision');

  // Add sort parameter
  if (params.sort) {
    queryParams.append('sort', params.sort || 'score,DESC');
  }

  // Add pagination
  queryParams.append('page', (params.page || 0).toString());
  queryParams.append('size', (params.size || 10).toString());

  // Add filters
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      const filterOption = FilterOption.find(f => f.id === key);
      if (!filterOption) return;

      const fieldName = filterOption.fieldName;
      
      if (filterOption.filterType === 'checkbox' && Array.isArray(value)) {
        value.forEach(v => {
          queryParams.append(`f.${fieldName}`, `${v},authority`);
        });
      } else if (filterOption.filterType === 'range' && Array.isArray(value)) {
        value.forEach(v => {
          queryParams.append(`f.${fieldName}`, `${v},equals`);
        });
      }
    });
  }
  
  const result = queryParams.toString();
  console.log(`[Workflow API] buildApiQueryParams result:`, result);
  return result;
};

/**
 * Parse search params from URL query string
 */
export const parseSearchParamsFromUrl = (): SearchParams => {
  if (typeof window === 'undefined') {
    return { page: 0, size: 10 };
  }

  const params = new URLSearchParams(window.location.search);
  const filters: any = {};

  FilterOption.forEach(section => {
    if (section.filterType === 'checkbox') {
      const values = params.getAll(`f.${section.fieldName}`);
      if (values.length > 0) {
        filters[section.id] = values.map(v => v.replace(',authority', ''));
      }
    } else if (section.filterType === 'range') {
      const values = params.getAll(`f.${section.fieldName}`);
      if (values.length > 0) {
        filters[section.id] = values.map(v => v.replace(',equals', ''));
      }
    }
  });

  return {
    page: parseInt(params.get('page') || '0'),
    size: parseInt(params.get('size') || '10'),
    query: params.get('query') || undefined,
    sort: params.get('sort') || undefined,
    scope: params.get('scope') || undefined,
    filters: Object.keys(filters).length ? filters : undefined,
  };
};

/**
 * Update URL with current search params
 */
export const updateUrlWithSearchParams = (params: SearchParams) => {
  if (typeof window === 'undefined') return;

  const urlParams = new URLSearchParams();
  urlParams.set('page', (params.page || 0).toString());
  urlParams.set('size', (params.size || 10).toString());

  if (params.query) {
    urlParams.set('query', params.query);
  }

  if (params.scope) {
    urlParams.set('scope', params.scope);
  }

  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      const filterOption = FilterOption.find(f => f.id === key);
      if (!filterOption) return;

      const fieldName = filterOption.fieldName;
      
      if (Array.isArray(value)) {
        value.forEach(v => {
          if (filterOption.filterType === 'checkbox') {
            urlParams.append(`f.${fieldName}`, `${v},authority`);
          } else if (filterOption.filterType === 'range') {
            urlParams.append(`f.${fieldName}`, `${v},equals`);
          }
        });
      }
    });
  }

  const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
  window.history.pushState({ path: newUrl }, '', newUrl);
};

/**
 * Main search function for workflow objects
 * Returns paginated results with thumbnails and access status
 */
export const getWorkflowObject = async (params: SearchParams) => {
  let apiUrl = `${siteConfig.apiEndpoint}/api/discover/search/objects?${buildApiQueryParams(params)}&embed=thumbnail&embed=item/thumbnail&embed=accessStatus&embed=supervisionOrders`;

  if (params.query?.trim()) {
    apiUrl += `&query=${encodeURIComponent(params.query)}`;
  }
  
  console.log(`[Workflow API] Full request URL:`, apiUrl);
  console.log(`[Workflow API] Request params:`, params);

  try {
    const response = await axios.get<workflowSearchResult>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      withCredentials: true,
    });
    
    return {
      objects: response.data._embedded.searchResult._embedded.objects,
      totalElements: response.data._embedded.searchResult.page?.totalElements
    };
  } catch (error: any) {
    console.error(`[Workflow API] Request failed:`, error.response?.status, error.response?.data);
    const errorStatus = error.response?.status || 500;
    
    if (errorStatus === 400) {
      throw new Error('Bad request - check your parameters');
    } else if (errorStatus === 401) {
      throw new Error('Unauthorized - please login again');
    } else if (errorStatus === 403) {
      throw new Error('Forbidden - you do not have access');
    } else if (errorStatus === 422) {
      throw new Error('Invalid field configuration');
    } else if (errorStatus === 500) {
      throw new Error('Server error - please try again later');
    } else {
      throw new Error('Unknown error occurred');
    }
  }
};

/**
 * Fetch individual facet values with pagination
 */
export const workflowFacet = async (
  facetName: string,
  params: SearchParams,
  facetPage: number = 0,  
  facetSize: number = 5,
): Promise<FacetFilterOption[]> => {
  const facetParams = { ...params };
  facetParams.page = facetPage;
  facetParams.size = facetSize;
  
  let f_url = `${siteConfig.apiEndpoint}/api/discover/facets/${facetName}?${buildApiQueryParams(facetParams)}`;

  if (params.query) {
    f_url += `&query=${encodeURIComponent(params.query)}`;
  }

  const response = await axios.get<FacetResult>(f_url, {
    headers: {
      "Content-Type": "application/json",
      "X-XSRF-TOKEN": csrfToken,
      Authorization: authToken,
    },
    withCredentials: true,
  });

  return response.data._embedded?.values?.map((value: any) => ({
    id: value.label,
    label: value.label,
    count: value.count
  })) || [];
};

/**
 * Fetch all facets for current search
 */
export const workflowFacets = async (params: SearchParams) => {
  const facetPromises = FilterOption.map(section => {
    if (section.filterType === 'checkbox') {
      return workflowFacet(section.fieldName, params);
    }
    return Promise.resolve([]);
  });

  const results = await Promise.all(facetPromises);

  return FilterOption.reduce((acc, section, index) => {
    if (section.filterType === 'checkbox') {
      acc[section.id] = results[index];
    }
    return acc;
  }, {} as Record<string, FacetFilterOption[]>);
};

/**
 * Fetch workspace item collection info
 */
export const getWorkspaceItem = async (id: string) => {
  try {
    const response = await axios.get<any>(
      `${siteConfig.apiEndpoint}/api/submission/workspaceitems/${id}/collection`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
          "X-XSRF-TOKEN": csrfToken,
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching workspace item:', error);
    throw error;
  }
};

/**
 * Remove workspace item
 */
export const removeWorkspaceItem = async (id: string) => {
  try {
    const response = await axios.delete(
      `${siteConfig.apiEndpoint}/api/submission/workspaceitems/${id}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": csrfToken,
          Authorization: authToken,
        },
        withCredentials: true,
      }
    );
    if (response.status === 204) {
      console.log('Workspace item deleted successfully');
    }
  } catch (error: any) {
    console.error('Failed to delete workspace item:', error);
    throw error;
  }
};
```

### File: `src/api/workflowTask.ts`

API functions for workflow task management and actions.

```typescript
import { siteConfig } from "../data/data";
import axios from "axios";

const authToken = localStorage.getItem("authToken") || "";
const csrfToken = localStorage.getItem("csrfToken") || "";

/**
 * Interface for workflow search parameters
 */
export interface WorkflowSearchParams {
  sort?: string;
  page?: number;
  size?: number;
  configuration?: string;
  query?: string;
  [key: string]: any; // For filter params (f.*)
}

/**
 * Search workflow objects with filtering
 */
export const getWorkflowObjects = async (params: WorkflowSearchParams = {}) => {
  const queryParams = new URLSearchParams();
  
  // Add standard params
  if (params.sort) queryParams.append('sort', params.sort);
  if (params.page !== undefined) queryParams.append('page', params.page.toString());
  if (params.size) queryParams.append('size', params.size.toString());
  if (params.configuration) queryParams.append('configuration', params.configuration);
  if (params.query) queryParams.append('query', params.query);
  
  // Add filter params (those starting with 'f.')
  Object.keys(params).forEach(key => {
    if (key.startsWith('f.')) {
      queryParams.append(key, params[key]);
    }
  });

  queryParams.append('embed', 'thumbnail');
  queryParams.append('embed', 'item/thumbnail');

  const fullUrl = `${siteConfig.apiEndpoint}/api/discover/search/objects?${queryParams.toString()}`;
  console.log(`[WorkflowTask API] Search request:`, fullUrl);
  console.log(`[WorkflowTask API] Params received:`, params);

  try {
    const response = await axios.get(fullUrl, {
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    console.error(`[WorkflowTask API] Search request failed:`, error.response?.status, error.response?.data);
    handleApiError(error);
  }
};

/**
 * Get submitters facet
 */
export const getWorkflowSubmittersFacet = async (params: WorkflowSearchParams = {}) => {
  return getWorkflowFacet('submitter', params);
};

/**
 * Get item types facet
 */
export const getWorkflowItemTypesFacet = async (params: WorkflowSearchParams = {}) => {
  return getWorkflowFacet('itemtype', params);
};

/**
 * Get named resource types facet
 */
export const getWorkflowNamedResourceTypesFacet = async (params: WorkflowSearchParams = {}) => {
  return getWorkflowFacet('namedresourcetype', params);
};

/**
 * Generic facet fetching function
 */
const getWorkflowFacet = async (facetName: string, params: WorkflowSearchParams = {}) => {
  const queryParams = new URLSearchParams();
  
  queryParams.append('page', (params.page || 0).toString());
  queryParams.append('size', (params.size || 10).toString());
  queryParams.append('configuration', params.configuration || 'workflow');

  if (params.query) {
    queryParams.append('query', params.query);
  }

  if (params.sort) {
    queryParams.append('sort', params.sort);
  }

  // Add filter params (starting with 'f.')
  Object.keys(params).forEach(key => {
    if (key.startsWith('f.')) {
      queryParams.append(key, params[key]);
    }
  });

  const fullUrl = `${siteConfig.apiEndpoint}/api/discover/facets/${facetName}?${queryParams.toString()}`;
  console.log(`[WorkflowTask API] Facet request for ${facetName}:`, fullUrl);
  console.log(`[WorkflowTask API] Params received:`, params);
  
  try {
    const response = await axios.get(fullUrl, {
      headers: {
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": csrfToken,
        Authorization: authToken,
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    console.error(`[WorkflowTask API] Facet request failed:`, error.response?.status, error.response?.data);
    handleApiError(error);
  }
};

/**
 * Handle API errors with status-specific routing
 */
const handleApiError = (error: any) => {
  const errorStatus = error.response?.status || 500;
  
  if (typeof window !== 'undefined') {
    if (errorStatus === 400) {
      window.location.href = `/error-400`;
    } else if (errorStatus === 401) {
      window.location.href = `/error-401`;
    } else if (errorStatus === 403) {
      window.location.href = `/error-403`;
    } else if (errorStatus === 422) {
      window.location.href = `/error-422`;
    } else if (errorStatus === 500) {
      window.location.href = `/error-500`;
    } else {
      window.location.href = `/error-404`;
    }
  }
};

/**
 * ===== TASK ACTION ENDPOINTS =====
 * These handle the actual workflow actions: claim, approve, reject, delete
 */

/**
 * Claim a pool task
 * POST /api/workflow/claimedtasks
 * Body: Text URI-List format pointing to the pool task
 */
export const claimedtask = async (id: string) => {
  try {
    const response = await axios.post(
      `${siteConfig.apiEndpoint}/api/workflow/claimedtasks`,
      `${siteConfig.apiEndpoint}/api/workflow/pooltasks/${id}`,
      {
        headers: {
          "Content-Type": "text/uri-list",
          "X-XSRF-TOKEN": csrfToken,
          Authorization: authToken,
        },
        withCredentials: true,
      }
    );
    console.log('[WorkflowTask] Task claimed successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[WorkflowTask] Error claiming task:', error.response?.data);
    throw error;
  }
};

/**
 * Approve a claimed task
 * POST /api/workflow/claimedtasks/{id}
 * Params: submit_approve=true
 */
export const approveClaimedTask = async (id: number) => {
  try {
    const params = new URLSearchParams();
    params.append('submit_approve', 'true');

    const response = await axios.post(
      `${siteConfig.apiEndpoint}/api/workflow/claimedtasks/${id}`,
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-XSRF-TOKEN": csrfToken,
          Authorization: authToken,
        },
        withCredentials: true,
      }
    );
    console.log('[WorkflowTask] Task approved successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[WorkflowTask] Error approving task:', error.response?.data);
    throw error;
  }
};

/**
 * Reject a claimed task with optional reason
 * POST /api/workflow/claimedtasks/{id}
 * Params: submit_reject=true, reason=<text>
 */
export const rejectClaimedTask = async (id: number, reason: string) => {
  try {
    const params = new URLSearchParams();
    params.append('submit_reject', 'true');
    params.append('reason', reason);

    const response = await axios.post(
      `${siteConfig.apiEndpoint}/api/workflow/claimedtasks/${id}`,
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-XSRF-TOKEN": csrfToken,
          Authorization: authToken,
        },
        withCredentials: true,
      }
    );
    console.log('[WorkflowTask] Task rejected successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[WorkflowTask] Error rejecting task:', error.response?.data);
    throw error;
  }
};

/**
 * Delete a claimed task (return to pool)
 * DELETE /api/workflow/claimedtasks/{id}
 */
export const deleteClaimedTask = async (id: number) => {
  try {
    const response = await axios.delete(
      `${siteConfig.apiEndpoint}/api/workflow/claimedtasks/${id}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": csrfToken,
          Authorization: authToken,
        },
        withCredentials: true,
      }
    );
    console.log('[WorkflowTask] Task deleted successfully');
    return response.data;
  } catch (error: any) {
    console.error('[WorkflowTask] Error deleting task:', error.response?.data);
    throw error;
  }
};
```

---

## 4. UI Components & Pages

### File: `src/pages/workflow/workflow.tsx`

Complete supervision search page with filters, sorting, and pagination.

```typescript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getWorkflowObject,
  workflowFacets,
  workflowFacet,
  updateUrlWithSearchParams,
  parseSearchParamsFromUrl,
} from '../../api/workflow';
import {
  SearchParams,
  FilterOption,
  sortOptions,
  WorkspaceItem,
  FacetFilterOption,
  Filtervalue,
} from '../../data/workflowdata';
import { fetchItemBundles } from '../../api/item'; // Your existing item API
import Loader from '../../components/loader/Loader';
import PaginationComponent from '../../components/Pagination/PaginationComponent';
import './workflow.css'; // Your styling

const resultsPerPageOptions = [
  { label: '5', value: 5 },
  { label: '10', value: 10 },
  { label: '15', value: 15 },
  { label: '20', value: 20 },
];

const Workflow = () => {
  const initialParams = parseSearchParamsFromUrl();

  // State management
  const [inputValue, setInputValue] = useState<string>(initialParams.query || '');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState<number>((initialParams.page ?? 0) + 1 || 1);
  const [size, setSize] = useState<number>(initialParams.size || resultsPerPageOptions[3].value);
  const [searchResults, setSearchResults] = useState<WorkspaceItem[]>([]);
  const [totalData, setTotalData] = useState<number>(0);
  const [filters, setFilters] = useState<Record<string, any>>(initialParams.filters || {});
  const [facets, setFacets] = useState<Record<string, FacetFilterOption[]>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    FilterOption.reduce((acc, section) => {
      acc[section.id] = section.defaultExpanded;
      return acc;
    }, {} as Record<string, boolean>)
  );
  const [sortOption, setSortOption] = useState(sortOptions[0].value);
  const [facetPagination, setFacetPagination] = useState<Record<string, { page: number; size: number }>>(
    FilterOption.reduce((acc, section) => {
      acc[section.id] = { page: 0, size: 5 };
      return acc;
    }, {} as Record<string, { page: number; size: number }>)
  );
  const navigate = useNavigate();
  const [thumbnailsByItem, setThumbnailsByItem] = useState<Record<string, any[]>>({});

  /**
   * Fetch all facets for current search
   */
  const fetchAllFacets = async (currentFilters: Record<string, any> = filters) => {
    try {
      const params: SearchParams = {
        query: inputValue,
        page: page - 1,
        size: size,
        filters: currentFilters,
        sort: getSortParam(),
      };

      const facetsResponse = await workflowFacets(params);
      setFacets(facetsResponse);
    } catch (error) {
      console.error('Error fetching facets:', error);
    }
  };

  /**
   * Main search handler
   */
  const handleSearch = async (
    currentFilters: Record<string, any> = filters,
    currentPage: number = page,
    itemsPerPage: number = size,
    resetPage: boolean = false,
    sort: string = getSortParam(),
  ) => {
    setIsLoading(true);
    try {
      const pageToFetch = resetPage ? 1 : currentPage;
      const params: SearchParams = {
        query: inputValue,
        page: pageToFetch - 1,
        size: itemsPerPage,
        sort: sort,
        filters: currentFilters,
      };

      updateUrlWithSearchParams(params);

      const result = await getWorkflowObject(params);

      if (result && result.objects) {
        setSearchResults(result.objects);
        setTotalData(result.totalElements);
        if (resetPage) {
          setPage(1);
        }
      } else {
        console.error('Error fetching data:', result);
      }

      await fetchAllFacets(currentFilters);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initial load on mount
   */
  useEffect(() => {
    handleSearch();
  }, []);

  /**
   * Fetch thumbnails for results
   */
  useEffect(() => {
    const fetchThumbnails = async () => {
      try {
        if (searchResults.length > 0) {
          const thumbnails: Record<string, any[]> = {};

          for (const result of searchResults) {
            const uuid = result._embedded?.indexableObject?._embedded?.item.uuid;
            if (!uuid) continue;

            const bundles = await fetchItemBundles(uuid);
            if (bundles.length > 0) {
              thumbnails[uuid] = bundles;
            }
          }
          setThumbnailsByItem(thumbnails);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchThumbnails();
  }, [searchResults]);

  /**
   * Load more items in a facet
   */
  const loadMoreFacetItems = async (sectionId: string) => {
    const section = FilterOption.find(s => s.id === sectionId);
    if (!section) return;

    const currentPagination = facetPagination[sectionId];
    const nextPage = currentPagination.page + 1;

    try {
      const params: SearchParams = {
        query: inputValue,
        page: page - 1,
        size: size,
        filters: filters,
        sort: getSortParam(),
      };

      const newValues = await workflowFacet(
        section.fieldName,
        params,
        nextPage,
        currentPagination.size
      );

      setFacets(prev => ({
        ...prev,
        [sectionId]: [...(prev[sectionId] || []), ...newValues]
      }));

      setFacetPagination(prev => ({
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          page: nextPage
        }
      }));
    } catch (error) {
      console.error('Error loading more facet items:', error);
    }
  };

  /**
   * Toggle filter section expansion
   */
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  /**
   * Reset all filters
   */
  const resetFilters = () => {
    const newFilters = {};
    setFilters(newFilters);
    handleSearch(newFilters, 1, size, true);
  };

  /**
   * Update a single filter
   */
  const updateFilter = (filterType: string, value: any, isChecked: boolean) => {
    setFilters(prev => {
      let newValue;
      const section = FilterOption.find(s => s.id === filterType);

      if (!section) return prev;

      if (section.filterType === 'range') {
        newValue = isChecked ? [value] : [];
      } else {
        newValue = isChecked
          ? Array.from(new Map([...(prev[filterType] || []), value].map(item => [item, item])).keys())
          : (prev[filterType] || []).filter((item: string) => item !== value);
      }

      const newFilters = {
        ...prev,
        [filterType]: newValue,
      };

      handleSearch(newFilters, 1, size, true, getSortParam());
      return newFilters;
    });
  };

  /**
   * Get sort parameter for API
   */
  const getSortParam = (): string => {
    const option = sortOptions.find(opt => opt.value === sortOption);
    return option ? option.apiValue : 'score,DESC';
  };

  /**
   * Handle page change
   */
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    handleSearch(filters, newPage, size, false, getSortParam());
  };

  /**
   * Render filter section based on type
   */
  const renderFilterSection = (section: Filtervalue) => {
    switch (section.filterType) {
      case 'checkbox':
        if (!facets[section.id]?.length) return null;

        return (
          <ul style={{ listStyle: 'none', padding: '0' }}>
            {facets[section.id].map((option, index) => (
              <li key={index}>
                <input
                  type="checkbox"
                  id={`${section.id}-${option.id}`}
                  checked={(filters[section.id] || []).includes(option.id)}
                  onChange={(e) => updateFilter(section.id, option.id, e.target.checked)}
                />
                <label htmlFor={`${section.id}-${option.id}`}>
                  {option.label} ({option.count})
                </label>
              </li>
            ))}

            {facets[section.id].length % facetPagination[section.id]?.size === 0 && (
              <button onClick={() => loadMoreFacetItems(section.id)}>Load More</button>
            )}
          </ul>
        );
      case 'range':
        // Implement YearRangeSlider or similar
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="search-container row">
      <div className="filters-and-results">
        <div className="filters-and-setting">
          <div className="filters col-3">
            <h3>Filters</h3>
            {FilterOption.map(section => (
              <div key={section.id} className="filter-section">
                <h4 onClick={() => toggleSection(section.id)}>
                  {section.label} {expandedSections[section.id] ? '▼' : '▶'}
                </h4>
                {expandedSections[section.id] && renderFilterSection(section)}
              </div>
            ))}
          </div>

          <div className="filter_reset">
            <button onClick={resetFilters}>Reset Filters</button>
          </div>

          <div className="dropdown-container">
            <label>Sort by:</label>
            <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <label>Results per page:</label>
            <select value={size} onChange={(e) => setSize(Number(e.target.value))}>
              {resultsPerPageOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <label>View mode:</label>
            <button onClick={() => setViewMode('grid')}>Grid</button>
            <button onClick={() => setViewMode('list')}>List</button>
          </div>
        </div>

        <div className="search-results col-12">
          <div className="search-input">
            <input
              type="text"
              placeholder="Search..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(filters, 1, size, true);
                }
              }}
            />
            <button onClick={() => handleSearch(filters, 1, size, true)}>Search</button>
          </div>

          {isLoading ? (
            <Loader />
          ) : (
            <div className={`results ${viewMode}`}>
              {searchResults.length > 0 ? (
                searchResults.map(item => (
                  <div key={item._embedded?.indexableObject?.id} className="result-item">
                    {/* Render result item */}
                    <h3>{item._embedded?.indexableObject?.sections?.traditionalpageone['dc.title']?.[0]?.value}</h3>
                    <p>{item._embedded?.indexableObject?.sections?.traditionalpageone['dc.description.abstract']?.[0]?.value}</p>
                  </div>
                ))
              ) : (
                <p>No results found</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ bottom: 10, padding: '10px' }}>
        <PaginationComponent
          totalData={totalData}
          perPage={size}
          currentPage={page}
          onPageChange={(newPage) => {
            handlePageChange(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    </div>
  );
};

export default Workflow;
```

### File: `src/pages/workflow/workflowTask.tsx`

Complete task management page with claim, approve, reject, and delete actions.

```typescript
import React, { useState, useEffect } from 'react';
import {
  getWorkflowObjects,
  getWorkflowSubmittersFacet,
  getWorkflowItemTypesFacet,
  getWorkflowNamedResourceTypesFacet,
  claimedtask,
  approveClaimedTask,
  rejectClaimedTask,
  deleteClaimedTask,
} from '../../api/workflowTask';
import { FilterOption, sortOptions } from '../../data/workflowTaskData';
import Loader from '../../components/loader/Loader';
import PaginationComponent from '../../components/Pagination/PaginationComponent';
import './workflowTask.css';

const resultsPerPageOptions = [
  { label: '5', value: 5 },
  { label: '10', value: 10 },
  { label: '15', value: 15 },
  { label: '20', value: 20 },
];

const WorkflowTask = () => {
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(resultsPerPageOptions[3].value);
  const [workflowItems, setWorkflowItems] = useState<any[]>([]);
  const [totalData, setTotalData] = useState<number>(0);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [facets, setFacets] = useState<Record<string, any[]>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    FilterOption.reduce((acc, section) => {
      acc[section.id] = section.defaultExpanded;
      return acc;
    }, {} as Record<string, boolean>)
  );
  const [sortOption, setSortOption] = useState(sortOptions[0].value);

  /**
   * Build filter params for API (maps to f.* query params)
   */
  const buildFilterParams = (currentFilters: Record<string, any>) => {
    const params: Record<string, string> = {};

    Object.entries(currentFilters).forEach(([key, values]) => {
      if (values && values.length > 0) {
        const filterOption = FilterOption.find(opt => opt.id === key);
        const fieldName = filterOption?.fieldName || key;

        if (key === 'dateIssued') {
          values.forEach(v => {
            params[`f.${fieldName}`] = `${v},equals`;
          });
        } else {
          values.forEach(v => {
            params[`f.${fieldName}`] = `${v},authority`;
          });
        }
      }
    });

    return params;
  };

  /**
   * Fetch all facets
   */
  const fetchAllFacets = async (currentFilters: Record<string, any> = filters) => {
    try {
      const filterParams = buildFilterParams(currentFilters);

      const params = {
        query: inputValue,
        page: page - 1,
        size: size,
        sort: getSortParam(),
        configuration: 'workflow',
        ...filterParams
      };

      const [submitters, itemTypes, namedResourceTypes] = await Promise.all([
        getWorkflowSubmittersFacet(params),
        getWorkflowItemTypesFacet(params),
        getWorkflowNamedResourceTypesFacet(params)
      ]);

      setFacets({
        submitter: submitters._embedded?.values || [],
        itemtype: itemTypes._embedded?.values || [],
        namedresourcetype: namedResourceTypes._embedded?.values || []
      });
    } catch (error) {
      console.error('Error fetching facets:', error);
    }
  };

  /**
   * Main search handler
   */
  const handleSearch = async (
    currentFilters: Record<string, any> = filters,
    currentPage: number = page,
    itemsPerPage: number = size,
    resetPage: boolean = false,
    sort: string = getSortParam(),
  ) => {
    setIsLoading(true);
    try {
      const pageToFetch = resetPage ? 1 : currentPage;
      const filterParams = buildFilterParams(currentFilters);

      const params = {
        query: inputValue,
        page: pageToFetch - 1,
        size: itemsPerPage,
        sort: sort,
        configuration: 'workflow',
        ...filterParams
      };

      const result = await getWorkflowObjects(params);

      if (result?._embedded?.searchResult?._embedded?.objects) {
        const items = result._embedded.searchResult._embedded.objects.map(
          obj => ({
            ...obj._embedded.indexableObject.workflow,
            ...obj._embedded.indexableObject,
            taskType: obj._embedded.indexableObject.type,
            id: obj._embedded.indexableObject.id
          })
        );
        setWorkflowItems(items);
        setTotalData(result._embedded.searchResult.page.totalElements);
      } else {
        console.error('Error fetching data:', result);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initial load
   */
  useEffect(() => {
    handleSearch();
    fetchAllFacets();
  }, []);

  /**
   * Get sort parameter
   */
  const getSortParam = (): string => {
    const option = sortOptions.find(opt => opt.value === sortOption);
    return option ? option.apiValue : 'lastModified,DESC';
  };

  /**
   * Toggle section expansion
   */
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  /**
   * Reset filters
   */
  const resetFilters = () => {
    const newFilters = {};
    setFilters(newFilters);
    fetchAllFacets(newFilters).then(() => {
      handleSearch(newFilters, 1, size, true);
    });
  };

  /**
   * Update filter
   */
  const updateFilter = (filterType: string, value: any, isChecked: boolean) => {
    setFilters(prev => {
      let newValue;
      const section = FilterOption.find(s => s.id === filterType);

      if (!section) return prev;

      if (section.filterType === 'range') {
        newValue = isChecked ? [value] : [];
      } else {
        newValue = isChecked
          ? Array.from(new Map([...(prev[filterType] || []), value].map(item => [item, item])).keys())
          : (prev[filterType] || []).filter((item: string) => item !== value);
      }

      const newFilters = {
        ...prev,
        [filterType]: newValue,
      };

      fetchAllFacets(newFilters).then(() => {
        handleSearch(newFilters, 1, size, true);
      });

      return newFilters;
    });
  };

  /**
   * Handle page change
   */
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    handleSearch(filters, newPage, size, false, getSortParam());
  };

  /**
   * ===== TASK ACTION HANDLERS =====
   */

  /**
   * Delete/Reject task (with reason prompt)
   */
  const handleDeleteClick = async (id: number) => {
    try {
      const reason = window.prompt("Enter rejection reason:", "") || "";
      await rejectClaimedTask(id, reason);
      handleSearch(filters, page, size, false, getSortParam());
    } catch (error) {
      console.error('Error rejecting task:', error);
    }
  };

  /**
   * Claim a pool task
   */
  const handleClaimTask = async (id: number) => {
    try {
      await claimedtask(id.toString());
      handleSearch(filters, page, size, false, getSortParam());
    } catch (error) {
      console.error('Error claiming task:', error);
    }
  };

  /**
   * Approve a claimed task
   */
  const handleApproveTask = async (id: number) => {
    try {
      await approveClaimedTask(id);
      handleSearch(filters, page, size, false, getSortParam());
    } catch (error) {
      console.error('Error approving task:', error);
    }
  };

  /**
   * Return task to pool (delete claimed task)
   */
  const handleReturnClick = async (id: number) => {
    try {
      await deleteClaimedTask(id);
      handleSearch(filters, page, size, false, getSortParam());
    } catch (error) {
      console.error('Error returning task to pool:', error);
    }
  };

  return (
    <div className="search-container row">
      <div className="filters-and-results">
        {/* Filter sidebar */}
        <div className="filters-and-setting">
          <div className="filters col-3">
            <h3>Filters</h3>
            {FilterOption.map(section => (
              <div key={section.id} className="filter-section">
                <h4 onClick={() => toggleSection(section.id)}>
                  {section.label} {expandedSections[section.id] ? '▼' : '▶'}
                </h4>
                {expandedSections[section.id] && facets[section.id] && (
                  <ul style={{ listStyle: 'none', padding: '0' }}>
                    {facets[section.id].map((option, index) => (
                      <li key={index}>
                        <input
                          type="checkbox"
                          id={`${section.id}-${option.label}`}
                          checked={(filters[section.id] || []).includes(option.label)}
                          onChange={(e) => updateFilter(section.id, option.label, e.target.checked)}
                        />
                        <label htmlFor={`${section.id}-${option.label}`}>
                          {option.label} ({option.count})
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <div className="filter_reset">
            <button onClick={resetFilters}>Reset Filters</button>
          </div>

          <div className="dropdown-container">
            <label>Sort by:</label>
            <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <label>Results per page:</label>
            <select value={size} onChange={(e) => setSize(Number(e.target.value))}>
              {resultsPerPageOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <label>View mode:</label>
            <button onClick={() => setViewMode('grid')}>Grid</button>
            <button onClick={() => setViewMode('list')}>List</button>
          </div>
        </div>

        {/* Results section */}
        <div className="search-results col-12">
          <div className="search-input">
            <input
              type="text"
              placeholder="Search tasks..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(filters, 1, size, true);
                }
              }}
            />
            <button onClick={() => handleSearch(filters, 1, size, true)}>Search</button>
          </div>

          {isLoading ? (
            <Loader />
          ) : (
            <div className={`results ${viewMode}`}>
              {workflowItems.length > 0 ? (
                workflowItems.map(item => (
                  <div key={item.id} className="task-item">
                    <h3>{item._embedded?.workflowitem?.sections?.traditionalpageone?.['dc.title']?.[0]?.value}</h3>
                    <p>Task Type: {item.taskType}</p>
                    <p>Owner: {item._embedded?.owner?.name}</p>

                    {/* Action buttons */}
                    {item.taskType === 'pooltask' && (
                      <button onClick={() => handleClaimTask(item.id)}>Claim</button>
                    )}

                    {item.taskType === 'claimedtask' && (
                      <>
                        <button onClick={() => handleApproveTask(item.id)}>Approve</button>
                        <button onClick={() => handleDeleteClick(item.id)}>Reject</button>
                        <button onClick={() => handleReturnClick(item.id)}>Return to Pool</button>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <p>No workflow tasks found</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ bottom: 10, padding: '10px' }}>
        <PaginationComponent
          totalData={totalData}
          perPage={size}
          currentPage={page}
          onPageChange={(newPage) => {
            handlePageChange(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    </div>
  );
};

export default WorkflowTask;
```

---

## 5. State Management

### Key State Variables

**Search State:**
- `inputValue` - Current search query
- `page` - Current page number (1-indexed)
- `size` - Items per page
- `sortOption` - Current sort option
- `filters` - Active filters object

**Results State:**
- `searchResults` - Array of found items
- `totalData` - Total count of results
- `isLoading` - Loading indicator

**UI State:**
- `viewMode` - 'grid' or 'list' view
- `expandedSections` - Which filter sections are expanded
- `facets` - Current facet values with counts
- `facetPagination` - Pagination for each facet

### State Update Flow

```
User Action
    ↓
Update State (e.g., filter selected)
    ↓
Call handleSearch() with new params
    ↓
API Request (getWorkflowObject, getWorkflowSubmittersFacet, etc.)
    ↓
Update searchResults, facets, totalData
    ↓
Component Re-render
```

---

## 6. Integration Steps

### Step 1: Copy Files to Project

```bash
# Copy API layer
cp src/api/workflow.ts <target-project>/src/api/
cp src/api/workflowTask.ts <target-project>/src/api/

# Copy data/types
cp src/data/workflowdata.ts <target-project>/src/data/
cp src/data/workflowTaskData.ts <target-project>/src/data/

# Copy pages
cp -r src/pages/workflow <target-project>/src/pages/
```

### Step 2: Verify Configuration

Ensure `siteConfig` has the correct API endpoint:

```typescript
// src/data/data.ts
export const siteConfig = {
  apiEndpoint: 'http://localhost:8080/server', // or your API URL
  // ... other config
};
```

### Step 3: Set Up Authentication

Ensure your authentication context provides:
- `authToken` - Stored in localStorage as "authToken"
- `csrfToken` - Stored in localStorage as "csrfToken"

```typescript
// Login/Authentication flow
localStorage.setItem('authToken', `Bearer ${tokenValue}`);
localStorage.setItem('csrfToken', csrfValue);
```

### Step 4: Add Routes

Update your routing configuration:

```typescript
// src/routing/AppRoutes.tsx
import Workflow from '../pages/workflow/workflow';
import WorkflowTask from '../pages/workflow/workflowTask';

<Route path="/workflow" element={<Workflow />} />
<Route path="/workflow-tasks" element={<WorkflowTask />} />
```

### Step 5: Add Styling

Create [workflow.css](workflow.css) and [workflowTask.css](workflowTask.css) with your preferred styling. At minimum:

```css
.search-container {
  display: flex;
  flex-wrap: wrap;
}

.filters-and-results {
  display: flex;
  width: 100%;
}

.filters {
  width: 25%;
  padding: 20px;
  border-right: 1px solid #ddd;
}

.search-results {
  width: 75%;
  padding: 20px;
}

.result-item, .task-item {
  border: 1px solid #ddd;
  padding: 15px;
  margin: 10px 0;
  border-radius: 4px;
}
```

### Step 6: Install Dependencies

Verify Axios is installed:

```bash
npm install axios
```

### Step 7: Test Integration

1. Navigate to `/workflow` page - should display supervision search
2. Navigate to `/workflow-tasks` page - should display workflow tasks
3. Test search, filtering, sorting, pagination
4. Test task actions (claim, approve, reject, delete)

---

## 7. Configuration

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/discover/search/objects` | GET | Search items with configuration |
| `/api/discover/facets/{name}` | GET | Fetch facet values |
| `/api/workflow/claimedtasks` | POST | Claim a pool task |
| `/api/workflow/claimedtasks/{id}` | POST | Approve/Reject task |
| `/api/workflow/claimedtasks/{id}` | DELETE | Return task to pool |

### Configuration Parameters

**Supervision Search:**
- Configuration: `supervision`
- Sort: `score,DESC` (default)
- Embeds: `thumbnail`, `item/thumbnail`, `accessStatus`, `supervisionOrders`

**Workflow Task Search:**
- Configuration: `workflow`
- Sort: `lastModified,DESC` (default)
- Embeds: `thumbnail`, `item/thumbnail`

**Filter Suffixes:**
- Checkbox filters: `,authority`
- Range/Date filters: `,equals`

### Sort Options

```typescript
// Supervision (workflow.tsx)
{ value: 'relevant', label: 'Most Relevant', apiValue: 'score,DESC' }
{ value: 'title-asc', label: 'Title Ascending', apiValue: 'dc.title,ASC' }
// ... more options

// Tasks (workflowTask.tsx)
{ value: 'relevant', label: 'Most Relevant', apiValue: 'lastModified,DESC' }
// ... more options
```

---

## 8. Testing Checklist

### Functionality Tests

- [ ] Search with query returns results
- [ ] Filters update results correctly
- [ ] Sort options change result order
- [ ] Pagination loads different pages
- [ ] Results per page updates correctly
- [ ] View mode switches between grid/list
- [ ] Claim task works on pool tasks
- [ ] Approve task works on claimed tasks
- [ ] Reject task with reason works
- [ ] Return to pool works
- [ ] Facets load with correct counts

### Error Handling

- [ ] 400 Bad Request shows error page
- [ ] 401 Unauthorized redirects to login
- [ ] 403 Forbidden shows access denied
- [ ] 422 Invalid field shows error message
- [ ] 500 Server error shows message
- [ ] Network error displays gracefully

### Performance

- [ ] Initial load completes in < 2 seconds
- [ ] Filter changes update in < 500ms
- [ ] Pagination loads smoothly
- [ ] No excessive re-renders
- [ ] Thumbnails load without blocking

### Browser Compatibility

- [ ] Works on Chrome/Edge (latest)
- [ ] Works on Firefox (latest)
- [ ] Works on Safari (latest)
- [ ] Responsive on mobile devices

---

## 9. Common Issues & Solutions

### Issue: 422 "Field not configured" Error

**Cause:** Filter field name mismatch or sort parameter misconfiguration

**Solution:**
1. Verify field names in `FilterOption` constant match API configuration
2. Check sort parameter format: should be `fieldName,DIRECTION` (e.g., `score,DESC`)
3. Ensure configuration parameter is correct (`supervision` vs `workflow`)
4. Check filter suffix: checkbox filters use `,authority`, range filters use `,equals`

**Debug:**
```typescript
// Enable console logging in buildApiQueryParams()
console.log(`Built query:`, queryParams.toString());
```

### Issue: Empty Facets

**Cause:** Facet API not returning values

**Solution:**
1. Verify facet names are correct (`submitter`, `itemtype`, `namedresourcetype`)
2. Check that search returns results before fetching facets
3. Ensure CSRF token is present in facet request headers
4. Check API configuration supports these facets

### Issue: Tasks Not Loading

**Cause:** Workflow configuration not found or wrong cluster type

**Solution:**
1. Verify `configuration: 'workflow'` parameter is set
2. Check that user has workflow reviewer role
3. Ensure workflow is installed and configured in DSpace admin
4. Verify API endpoint URL is correct

### Issue: Task Actions Fail

**Cause:** Wrong HTTP method or parameters

**Solution:**
1. Verify endpoints:
   - Claim: POST `/api/workflow/claimedtasks` with URI-List body
   - Approve: POST `/api/workflow/claimedtasks/{id}` with `submit_approve=true`
   - Reject: POST `/api/workflow/claimedtasks/{id}` with `submit_reject=true` and `reason`
   - Delete: DELETE `/api/workflow/claimedtasks/{id}`
2. Check Content-Type headers match requirement
3. Verify CSRF token is included

**Debug:**
```typescript
// Add logging to action functions
console.log('[Action] Sending to:', url);
console.log('[Action] With params:', params);
```

### Issue: Pagination Not Working

**Cause:** Page numbering mismatch

**Solution:**
1. UI uses 1-indexed pages, API uses 0-indexed
2. Ensure conversion: `apiPage = uiPage - 1`
3. Verify URLSearchParams includes page parameter
4. Check PaginationComponent receives correct totalPages calculation

### Issue: Filters Reset After Navigation

**Cause:** State lost on page navigation

**Solution:**
1. Use URL query parameters for persistence (implemented in `updateUrlWithSearchParams`)
2. Parse URL params on component mount (implemented in `parseSearchParamsFromUrl`)
3. Ensure history.pushState is called when filters change
4. Handle browser back button for filter restoration

---

## Support & Debugging

### Enable Debug Logging

Add to all API functions:
```typescript
console.log(`[API Name] Request:`, url);
console.log(`[API Name] Params:`, params);
console.log(`[API Name] Response:`, response.data);
```

### Inspect Network Requests

1. Open Browser DevTools (F12)
2. Go to Network tab
3. Perform action (search, filter, action button)
4. Check request URL, headers, and response

### Common Request Headers Required

```
Authorization: Bearer <token>
X-XSRF-TOKEN: <csrf-token>
Content-Type: application/json (or application/x-www-form-urlencoded for forms)
```

### DSpace REST API Documentation

Refer to: `{your-dspace-url}/cris/restapidocs/`

---

## Summary

This guide provides everything needed to implement the complete workflow system. The key components are:

1. **API Layer** - Handle all REST calls with proper authentication
2. **Type Definitions** - Strong typing for all data structures
3. **State Management** - React hooks for search, filters, results
4. **UI Components** - Fully functional search and task management pages
5. **Integration** - Copy files, configure routes, test

The system supports:
- Advanced searching with query strings
- Faceted filtering with dynamic counts
- Sorting and pagination
- Task management (claim, approve, reject, delete)
- Responsive UI with multiple view modes

Follow the testing checklist to ensure all functionality works before deploying to production.
