import { showToast } from "../contexts/ToastProvider";
import { siteConfig } from "../data/data"
import { FacetResult, FacetValue, FilterOption, ResourcePolicy, SearchParams, workflowFilters, workflowSearchResult, WorkspaceMetedata } from "../data/workflowdata";
import axios from "axios";


const authToken = localStorage.getItem("authToken") || "";
const csrfToken = localStorage.getItem("csrfToken") || "";

const buildApiQueryParams = (params: SearchParams): string => {
  const queryParams = new URLSearchParams();
  queryParams.append('configuration', 'supervision');

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
            const fieldName = FilterOption.find(s => s.id === key)?.fieldName || key;
            queryParams.append(`f.${fieldName}`, `${val},equals`);
          }
        });
      }
    });
  }
  return queryParams.toString();
};

export const parseSearchParamsFromUrl = (): SearchParams => {
  if (typeof window === 'undefined') {
    return { page: 0, size: 10 };
  }

  const params = new URLSearchParams(window.location.search);
  const filters: workflowFilters = {};

  FilterOption.forEach(section => {
    if (section.filterType === 'checkbox') {
      const values = params.getAll(section.id);
      if (values.length) filters[section.id] = values;
    } else if (section.filterType === 'range') {
      const values = params.getAll(section.id).filter(Boolean);
      if (values.length) filters[section.id] = values;
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
      if (!value) return;

      if (Array.isArray(value)) {
        value.forEach(val => urlParams.append(key, val));
      }
    });
  }

  const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
  window.history.pushState({ path: newUrl }, '', newUrl);
};
export const getWorkflowObject = async (params: SearchParams) => {
  let apiUrl = `${siteConfig.apiEndpoint}/api/discover/search/objects?${buildApiQueryParams(params)}&embed=thumbnail&embed=item/thumbnail&embed=accessStatus&embed=supervisionOrders`;

  if (params.query?.trim()) {
    apiUrl += `&query=${encodeURIComponent(params.query)}`;
  }
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
    }
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
  }
}


export const workflowFacet = async (
  facetName: string,
  params: SearchParams,
  facetPage: number = 0,  
  facetSize: number = 5,
): Promise<FacetValue[]> => {
  const facetParams = {...params};
  
  facetParams.page = facetPage;
  facetParams.size = facetSize;
  let f_url = `${siteConfig.apiEndpoint}/api/discover/facets/${facetName}?${buildApiQueryParams(facetParams)}`;

  if (params.query) {
    f_url += `&query=${encodeURIComponent(params.query)}`;
  }

  const response = await axios.get<FacetResult>(f_url,
    {
      headers: {
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": csrfToken,
        Authorization: authToken,
      },
      withCredentials: true,
    }
  );
  return response.data._embedded?.values?.map((value: any) => ({
    id: value.label,
    label: value.label,
    count: value.count
  })) || [];
};

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
  }, {} as Record<string, FacetValue[]>);
};

//https://demo.dspace.org/server/api/submission/workspaceitems/1481/collection



export const getWorkspaceItem = async (id: string) => {
  try {
    const response = await axios.get<WorkspaceMetedata>(`${siteConfig.apiEndpoint}/api/submission/workspaceitems/${id}/collection`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
        "X-XSRF-TOKEN": csrfToken,
      },
      withCredentials: true,
    });
    return response.data;
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
  }
}

//https://demo.dspace.org/server/api/submission/workspaceitems/1481

export const removeWorkspaceItem = async (id: string) => {
  try {
    const response = await axios.delete(`${siteConfig.apiEndpoint}/api/submission/workspaceitems/${id}`, {
      headers: {
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": csrfToken,
        Authorization: authToken,
      },
      withCredentials: true,
    });
    if (response.status === 204) {
      showToast("Workspace item deleted successfully.", "success");
    }
  } catch (error: any) {
    showToast("Failed to delete workspace item.", "error");
  }
}


//https://demo.dspace.org/server/api/authz/resourcepolicies/search/resource?uuid=2e899a4a-def0-4ff8-bc27-cec9b0cfbd97&embed=eperson&embed=group


export const getResourcePolicies = async (id: string) => {
  try {
    const response = await axios.get<ResourcePolicy>(`${siteConfig.apiEndpoint}/api/authz/resourcepolicies/search/resource?uuid=${id}&embed=eperson&embed=group`, {
      headers: {
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": csrfToken,
        Authorization: authToken,
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    showToast("Failed to fetch resource policies.", "error");
  }
}

export const updateResourcePolicyGroup = async (policyId: string, groupId: string) => {
  await axios.put(
      `${siteConfig.apiEndpoint}/api/authz/resourcepolicies/${policyId}/group`,
      `${siteConfig.apiEndpoint}/api/eperson/groups/${groupId}`,
      {
          headers: {
              'Content-Type': 'text/uri-list',
              'X-XSRF-TOKEN': csrfToken,
              Authorization: authToken,
          },
      withCredentials: true,
      }
  );
};
interface ResourcePolicyData {
  policyType: string;
  action: string;
  type: {
      value: string;
  };
}
export const updateResourcePolicyMetadata = async (policyId: string, data: ResourcePolicyData) => {
  const patchOperations = [];
  
  // if (data.policyType) {
  //     patchOperations.push({
  //         op: "add",
  //         path: "/policyType",
  //         value: data.policyType
  //     });
  // }
  
  if (data.action) {
      patchOperations.push({
          op: "replace",
          path: "/action",
          value: data.action
      });
  }

  await axios.patch(
      `${siteConfig.apiEndpoint}/api/authz/resourcepolicies/${policyId}`,
      patchOperations,
      {
          headers: {
              'Content-Type': 'application/json',
              'X-XSRF-TOKEN': csrfToken,
              Authorization: authToken,
          },
          withCredentials: true,
      }
  );
};

// https://demo.dspace.org/server/api/authz/resourcepolicies/30435
export const removeResourcePolicy = async (id: string) => {
  try {
    const response = await axios.delete(`${siteConfig.apiEndpoint}/api/authz/resourcepolicies/${id}`, {
      headers: {
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": csrfToken,
        Authorization: authToken,
      },
      withCredentials: true,
    });
    if(response.status === 204) {
      showToast("Resource policy deleted successfully!", "success");
    }
  } catch (error: any) {
    showToast("Failed to delete resource policy.", "error");
  }
}



export const createSupervisionOrder = async (uuid: string, group: string, type: string) => {
  try {
    const response = await axios.post(
      `${siteConfig.apiEndpoint}/api/core/supervisionorders?uuid=${uuid}&group=${group}&type=${type}`,
      {}, 
      {
        headers: {
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": csrfToken,
          "Authorization": authToken,
        },
        withCredentials: true,
      }
    );
    
    if (response.status === 201) {
      showToast("Supervision order created successfully!", "success");
    }
    return response.data;
  } catch (error: any) {
    showToast("Failed to create supervision order.", "error");
    throw error; 
  }
}

//https://demo.dspace.org/server/api/authz/resourcepolicies?resource=f94f88de-63ff-4f7a-a259-100dd585621a&eperson=eadda9c3-a982-43ab-b532-2667f2c47932

export const AddResourcePolicyForEperson = async (uuid:string, selectedId:string , formData:string) => {
  try{
    const response = await axios.post(
                    `${siteConfig.apiEndpoint}/api/authz/resourcepolicies?resource=${uuid}&eperson=${selectedId}`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'X-XSRF-TOKEN': csrfToken,
                            Authorization: authToken
                        },
                        withCredentials: true
                    }
                );
                if (response.status === 201) {
                  showToast("Resource policy created successfully!", "success");
                }
  }catch(error){
    console.error("Error creating resource policy:", error);
  }
}

//https://demo.dspace.org/server/api/authz/resourcepolicies?resource=282164f5-d325-4740-8dd1-fa4d6d3e7200&group=f2c7eb75-aec0-4604-ab7f-6676723818ad

export const AddResourcePolicyForGroup = async (uuid:string, selectedId:string , formData:string) => {
  try{
    const response = await axios.post(
                    `${siteConfig.apiEndpoint}/api/authz/resourcepolicies?resource=${uuid}&group=${selectedId}`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'X-XSRF-TOKEN': csrfToken,
                            Authorization: authToken
                        },
                        withCredentials: true
                    }
                );
                if (response.status === 201) {
                  showToast("Resource policy created successfully!", "success");
                }
  }catch(error){
    console.error("Error creating resource policy:", error);
  }
}