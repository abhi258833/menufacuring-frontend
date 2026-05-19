import axios from "axios";
import { siteConfig } from "../data/data";
import { showToast } from "../contexts/ToastProvider";
import { ItemInfo, workspaceitemresponse, Workspaceresponse } from "../data/itemFormData";
import { BookDetailsData } from "../data/bookDetail";
import { PatchOperation } from "../data/itemFormData";
import { fetchCsrfToken } from "./csrf";
import { getAuthHeaders } from "./searchApi";

const getAuthToken = () => localStorage.getItem("authToken") || "";
const getCsrfToken = () => localStorage.getItem("csrfToken") || "";

export const createItem = async (
    itemId: string,
    formData: { [key: string]: string | Date | null }
) => {
    const apiUrl = `${siteConfig.apiEndpoint}/api/submission/workspaceitems/${itemId}?embed=item`;

    const patchOperations: PatchOperation[] = [];

    Object.entries(formData).forEach(([key, value]) => {
        if (value) {
            patchOperations.push({
                op: "add",
                path: `/sections/traditionalpageone/${key}`,
                value: [{
                    value: value.toString(),
                    language: null,
                    authority: null,
                    display: value.toString(),
                    confidence: -1,
                    place: 0,
                    otherInformation: null
                }]
            });
        }
    });

    try {
        const response = await axios.patch(apiUrl, patchOperations, {
            headers: {
                "Content-Type": "application/json",
                "X-XSRF-TOKEN": getCsrfToken(),
                "Authorization": getAuthToken(),
            },
            withCredentials: true,
        });

        if (response.status === 200) {
            const licensePayload = {
                op: "add",
                path: "/sections/license/granted",
                value: "true"
            };

            try {
                await axios.patch(apiUrl, [licensePayload], {
                    headers: {
                        "Content-Type": "application/json",
                        "X-XSRF-TOKEN": getCsrfToken(),
                        "Authorization": getAuthToken(),
                    },
                    withCredentials: true,
                });
            } catch (patchError) {
                console.error("Failed to add license information:", patchError);
            }

        } else {
            console.error('Failed to add license information')
        }

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
        throw error;
    }
};

interface OwningCollection{
    id: string,
    name: string
}
//http://localhost:8080/server/api/core/items/149a4996-2ea6-467b-be7a-fbc93a6ce6b3/owningCollection
export const getowningCollection = async (itemId: string) => {
    const apiUrl = `${siteConfig.apiEndpoint}/api/core/items/${itemId}/owningCollection`;
    try {
        const response = await axios.get<OwningCollection>(apiUrl, {
            headers: {
                "Content-Type": "application/json",
                "X-XSRF-TOKEN": getCsrfToken(),
                "Authorization": getAuthToken(),
            },
            withCredentials: true,
        });
        return response.data.name;
    } catch (error) {
        console.log("error", error)
    }
}


export const fetchWorkspaceItems = async (collectionId: string) => {
      const csrfToken = await fetchCsrfToken();
        if (!csrfToken) {
          throw new Error("CSRF token not available. Login aborted.");
        }
    try {
        const response = await axios.post<Workspaceresponse>(`${siteConfig.apiEndpoint}/api/submission/workspaceitems?embed=item,sections,collection&owningCollection=${collectionId}`,
            {}, {
            headers: {
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': csrfToken,
                'Authorization': getAuthToken(),
            },
            withCredentials: true,
        }
        )
        return response.data.id;
    } catch (error) {
        console.log("error", error)
    }
}

export const fetchItemInfo = async (itemId: string) => {
    const apiUrl = `${siteConfig.apiEndpoint}/api/core/items/${itemId}`;
    try {
      const authToken = localStorage.getItem("authToken");
      const config = authToken ? { headers: getAuthHeaders() } : {};
  
      const response = await axios.get<ItemInfo>(apiUrl, config);
  
      if (response.status !== 200) {
        throw new Error(`Error fetching item details: ${response.statusText}`);
      }
  
      return response.data;
    } catch (error) {
      console.error("Error fetching item details:", error);
      throw error;
    }
  };
  


export const InsertImage = async (itemId: string, file: File) => {
    const apiUrl = `${siteConfig.apiEndpoint}/api/submission/workspaceitems/${itemId}`
    const formData = new FormData();
    formData.append("file", file);
    try {
        const response = await axios.post<workspaceitemresponse>(apiUrl, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
                "X-XSRF-TOKEN": getCsrfToken(),
                "Authorization": getAuthToken(),
            },
            withCredentials: true,
        });
        return response.data._links.self.href;
    } catch (error: any) {
        console.error("Error uploading image:", error);
    }
}

export const createWorkflowItem = async (uri: string) => {
    const apiUrl = `${siteConfig.apiEndpoint}/api/workflow/workflowitems?embed=item,sections,collection`
    try {
        const response = await axios.post(apiUrl, uri, {
            headers: {
                "Content-Type": "text/uri-list",
                "X-XSRF-TOKEN": getCsrfToken(),
                "Authorization": getAuthToken(),
            },
            withCredentials: true,
        });
        return response.data
    } catch (error) {
        console.error("Error creating workflow item:", error);
    }

}


export const patchItemMetadata = async (itemId: string, patchOperations: PatchOperation[]) => {
    try {
        const response = await axios.patch(
            `${siteConfig.apiEndpoint}/api/core/items/${itemId}`,
            patchOperations,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                    'Authorization': getAuthToken(),
                },
                withCredentials: true,
            }
        );
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
        throw error;
    }
};

export const fetchItemDetails = async (id: string): Promise<BookDetailsData> => {
    const authToken = localStorage.getItem("authToken");
    const csrfToken = localStorage.getItem("csrfToken");
  
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
  
    if (authToken) {
      headers["Authorization"] = authToken;
    }
  
    if (csrfToken) {
      headers["X-XSRF-TOKEN"] = csrfToken;
    }
  
    const response = await axios.get<BookDetailsData>(
      `${siteConfig.apiEndpoint}/api/core/items/${id}?embed=thumbnail&embed=accessStatus`,
      { headers }
    );
  
    return response.data;
  };
  

export const deleteItem = async (uuid:string) =>{
   try {
     const response = await axios.delete( `${siteConfig.apiEndpoint}/api/core/items/${uuid}`,{
        headers:{
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': getCsrfToken(),
            'Authorization': getAuthToken(),
        },
        withCredentials: true,
    })
    if( response.status === 204) {
        showToast("Item deleted successfully", "success");
    }
}catch (error: any) {
    console.error("Error deleting item:", error);
}
}