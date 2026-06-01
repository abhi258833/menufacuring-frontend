import axios from "axios";
import { siteConfig } from "../data/data";
import { FacetResult, ObjectSearchResult, SearchParams, filterSections, FilterOption, SearchFilters, AdvancedFilter, advancedSearchFields } from "../data/searchData";

const authToken = localStorage.getItem("authToken") || "";
const csrfToken = localStorage.getItem("csrfToken") || "";
export const getAuthHeaders = (): Record<string, string> => {


  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
  }
  if (csrfToken) {
    headers["X-XSRF-TOKEN"] = csrfToken;
  }

  return headers;
};





const buildApiQueryParams = (params: SearchParams): string => {
  const queryParams = new URLSearchParams();
  queryParams.append('configuration', 'default');

  if (params.sort) {
    queryParams.append('sort', params.sort || 'score,DESC');
  }

  queryParams.append('page', (params.page || 0).toString());
  queryParams.append('size', (params.size || 10).toString());

  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (!value) return;

      if (Array.isArray(value)) {
        value.forEach(val => {
          if (key === 'date' && val.includes(' - ')) {
            const dateRange = `[${val.split(' - ')[0]} TO ${val.split(' - ')[1]}]`;
            queryParams.append('f.dateIssued', `${dateRange},equals`);
          } else {
            const fieldName = filterSections.find(s => s.id === key)?.fieldName || key;
            queryParams.append(`f.${fieldName}`, `${val},equals`);
          }
        });
      } else if (typeof value === 'boolean') {
        queryParams.append(`f.has_content_in_original_bundle`, `${value},equals`);
      }
    });
  }

  if (params.advancedFilters && params.advancedFilters.length > 0) {
    params.advancedFilters.forEach(filter => {
      const fieldName = advancedSearchFields.find(f => f.id === filter.field)?.fieldName || filter.field;
      queryParams.append(`f.${fieldName}`, `${filter.value},${filter.operator}`);
    });
  }

  return queryParams.toString();
};

export const parseSearchParamsFromUrl = (): SearchParams => {
  if (typeof window === 'undefined') {
    return { page: 0, size: 10 };
  }

  const params = new URLSearchParams(window.location.search);
  const filters: SearchFilters = {};
  const advancedFilters: AdvancedFilter[] = [];

  filterSections.forEach(section => {
    if (section.filterType === 'checkbox') {
      const values = params.getAll(section.id);
      if (values.length) filters[section.id] = values;
    } else if (section.filterType === 'boolean') {
      const value = params.get(section.id);
      if (value) filters[section.id] = value === 'true';
    } else if (section.filterType === 'range') {
      const values = params.getAll(section.id).filter(Boolean);
      if (values.length) filters[section.id] = values;
    }
  });

  // Parse advanced filters from URL
  const advancedFilterFields = params.getAll('af_field');
  const advancedFilterOperators = params.getAll('af_operator');
  const advancedFilterValues = params.getAll('af_value');

  advancedFilterFields.forEach((field, index) => {
    if (field && advancedFilterOperators[index] && advancedFilterValues[index]) {
      advancedFilters.push({
        field,
        operator: advancedFilterOperators[index],
        value: advancedFilterValues[index]
      });
    }
  });

  return {
    page: parseInt(params.get('page') || '0'),
    size: parseInt(params.get('size') || '20'),
    query: params.get('query') || undefined,
    sort: params.get('sort') || undefined,
    scope: params.get('scope') || undefined,
    resourceType: params.get('resourceType') || undefined,
    communityName: params.get('communityName') || undefined,
    collectionName: params.get('collectionName') || undefined,
    filters: Object.keys(filters).length ? filters : undefined,
    advancedFilters: advancedFilters.length ? advancedFilters : undefined
  };
};

export const updateUrlWithSearchParams = (params: SearchParams) => {
  if (typeof window === 'undefined') return;

  const urlParams = new URLSearchParams();

  urlParams.set('page', (params.page || 0).toString());
  urlParams.set('size', (params.size || 10).toString());

  if (params.query) {
    urlParams.set('query', params.query);
  }

  if (params.sort) {
    urlParams.set('sort', params.sort);
  }

  if (params.scope) {
    urlParams.set('scope', params.scope);
  }

  if (params.resourceType) {
    urlParams.set('resourceType', params.resourceType);
  }

  if (params.communityName) {
    urlParams.set('communityName', params.communityName);
  }

  if (params.collectionName) {
    urlParams.set('collectionName', params.collectionName);
  }

  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (!value) return;

      if (Array.isArray(value)) {
        value.forEach(val => urlParams.append(key, val));
      } else if (typeof value === 'boolean') {
        urlParams.set(key, value.toString());
      }
    });
  }

  // Add advanced filters to URL
  if (params.advancedFilters) {
    params.advancedFilters.forEach(filter => {
      urlParams.append('af_field', filter.field);
      urlParams.append('af_operator', filter.operator);
      urlParams.append('af_value', filter.value);
    });
  }

  const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
  window.history.pushState({ path: newUrl }, '', newUrl);
};

export const searchObjects = async (
  params: SearchParams, isAuthenticated: boolean = false
): Promise<{ results: any[]; totalElements: number }> => {
  let apiUrl = `${siteConfig.apiEndpoint}/api/discover/search/objects?${buildApiQueryParams(params)}&dsoType=item`;
  
  if (params.scope) {
    apiUrl += `&scope=${params.scope}`;
  }

  if (params.query?.trim()) {
    apiUrl += `&query=${encodeURIComponent(params.query)}`;
  }

  apiUrl += '&embed=thumbnail&embed=item/thumbnail'
  try {
    const authToken = localStorage.getItem("authToken");
    const config = authToken ? { headers: getAuthHeaders() } : {};
    const response = await axios.get<ObjectSearchResult>(apiUrl, config);
    return {
      results: response.data._embedded.searchResult._embedded.objects || [],
      totalElements: response.data._embedded.searchResult.page?.totalElements || 0,
    };
  } catch (error: any) {
    const errorStatus = error.response?.status || 500;
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
    return {
      results: [],
      totalElements: 0,
    };
  }
};

export const fetchFacet = async (
  facetName: string,
  params: SearchParams,
  facetPage: number = 0,
  facetSize: number = 5,
  prefix?: string,
  isAuthenticated: boolean = false
): Promise<FilterOption[]> => {
  const facetParams = { ...params };

  facetParams.page = facetPage;
  facetParams.size = facetSize;

  let f_url = `${siteConfig.apiEndpoint}/api/discover/facets/${facetName}?${buildApiQueryParams(facetParams)}&dsoType=item`;
  
  if (facetParams.scope) {
    f_url += `&scope=${facetParams.scope}`;
  }

  if (facetParams.query) {
    f_url += `&query=${encodeURIComponent(facetParams.query)}`;
  }

  if (prefix) {
    f_url += `&prefix=${encodeURIComponent(prefix)}`;
  }
  const authToken = localStorage.getItem("authToken");
  const config = authToken ? { headers: getAuthHeaders() } : {};
  const response = await axios.get<FacetResult>(f_url, config);
  return response.data._embedded?.values?.map((value: any) => ({
    id: value.label,
    label: value.label,
    count: value.count
  })) || [];
};

export const fetchFacets = async (
  params: SearchParams,
  facetPage: number = 0,
  facetSize: number = 5,
  isAuthenticated: boolean = false
) => {
  const facetPromises = filterSections.map(section => {
    if (section.filterType === 'checkbox' || section.filterType === 'boolean') {
      return fetchFacet(section.fieldName, params, facetPage, facetSize, undefined, isAuthenticated);
    }
    return Promise.resolve([]);
  });

  const results = await Promise.all(facetPromises);

  return filterSections.reduce((acc, section, index) => {
    if (section.filterType === 'checkbox' || section.filterType === 'boolean') {
      acc[section.id] = results[index];
    }
    return acc;
  }, {} as Record<string, FilterOption[]>);
};


export const fetchHasFileCounts = async (
  params: SearchParams,
  facetPage: number = 0,
  facetSize: number = 5,
  isAuthenticated: boolean = false
) => {
  const [options] = await Promise.all([
    fetchFacet('has_content_in_original_bundle', params, facetPage, facetSize, undefined, isAuthenticated)
  ]);

  return {
    hasFileCount: options.find(option => option.id === 'true')?.count ?? 0,
    noFileCount: options.find(option => option.id === 'false')?.count ?? 0
  };
};







