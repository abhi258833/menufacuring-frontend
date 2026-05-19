import { siteConfig } from "../data/data";
import axios from "axios";

const authToken = localStorage.getItem("authToken") || "";
const csrfToken = localStorage.getItem("csrfToken") || "";

export interface WorkflowSearchParams {
  sort?: string;
  page?: number;
  size?: number;
  configuration?: string;
  query?: string;
}

export const getWorkflowObjects = async (params: WorkflowSearchParams = {}) => {
  const queryParams = new URLSearchParams();
  
  // Add standard params
  if (params.sort) queryParams.append('sort', params.sort);
  if (params.page !== undefined) queryParams.append('page', params.page.toString());
  if (params.size) queryParams.append('size', params.size.toString());
  if (params.configuration) queryParams.append('configuration', params.configuration);
  if (params.query) queryParams.append('query', params.query);
  
  Object.keys(params).forEach(key => {
    if (key.startsWith('f.')) {
      queryParams.append(key, (params as Record<string, any>)[key]);
    }
  });

  queryParams.append('embed', 'thumbnail');
  queryParams.append('embed', 'item/thumbnail');

  const fullUrl = `${siteConfig.apiEndpoint}/api/discover/search/objects?${queryParams.toString()}`;
  console.log(`[WorkflowTask API] Search request:`, fullUrl);
  console.log(`[WorkflowTask API] Params received:`, params);

  try {
    const response = await axios.get(
      fullUrl,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(`[WorkflowTask API] Search request failed:`, error.response?.status, error.response?.data);
    handleApiError(error);
  }
};

export const getWorkflowSubmittersFacet = async (params: WorkflowSearchParams = {}) => {
  return getWorkflowFacet('submitter', params);
};

export const getWorkflowItemTypesFacet = async (params: WorkflowSearchParams = {}) => {
  return getWorkflowFacet('itemtype', params);
};

export const getWorkflowNamedResourceTypesFacet = async (params: WorkflowSearchParams = {}) => {
  return getWorkflowFacet('namedresourcetype', params);
};

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
      queryParams.append(key, (params as Record<string, any>)[key]);
    }
  });

  const fullUrl = `${siteConfig.apiEndpoint}/api/discover/facets/${facetName}?${queryParams.toString()}`;
  console.log(`[WorkflowTask API] Facet request for ${facetName}:`, fullUrl);
  console.log(`[WorkflowTask API] Params received:`, params);
  
  try {
    const response = await axios.get(
      fullUrl,
      {
        headers: {
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": csrfToken,
          Authorization: authToken,
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(`[WorkflowTask API] Facet request failed:`, error.response?.status, error.response?.data);
    handleApiError(error);
  }
};

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

// http://localhost:8080/server/api/workflow/claimedtasks
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
        return response.data;
    } catch (error: any) {
        handleApiError(error);
    }
};

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
        return response.data;
    } catch (error: any) {
        // handleApiError(error); 
        throw error;
    }
};

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
        return response.data;
    } catch (error: any) {
        handleApiError(error);
    }
}


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
        return response.data;
    } catch (error: any) {
        // handleApiError(error); 
        throw error;
    }
};