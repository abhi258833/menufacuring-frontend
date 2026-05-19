import axios from "axios";
import { siteConfig } from "../data/data";
import { showToast } from "../contexts/ToastProvider";

const authToken = localStorage.getItem("authToken") || "";
const csrfToken = localStorage.getItem("csrfToken") || "";

export const fetchCommunities = async () => {
    try {
        const response = await axios.get(
            `${siteConfig.apiEndpoint}/api/core/communities`,
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
    } catch (error) {
        showToast("Failed to fetch communities", "error");
        throw error;
    }
};

export const fetchCollectionsItem = async (uuid: string) => {
    const apiUrl = `${siteConfig.apiEndpoint}/api/core/communities/${uuid}/collections`;
    try {
        const response = await axios.get(apiUrl, {
            headers: {
                "Content-Type": "application/json",
                "X-XSRF-TOKEN": csrfToken,
                Authorization: authToken,
            },
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        console.error('Failed to fetch collection', error);
    }
};


export const deleteCommunity = async (uuid: string) => {
    try {
        const response = await axios.delete(`${siteConfig.apiEndpoint}/api/core/communities/${uuid}`, {
            headers: {
                "Content-Type": "application/json",
                "X-XSRF-TOKEN": csrfToken,
                Authorization: authToken,
            },
            withCredentials: true,
        });
        if (response.status === 204) {
            showToast('Community deleted successfully!', 'success');
        }
    }catch(error){
        showToast('Failed to delete community',"error")
    }
}

export const editCommunity = async (uuid: string, title: string) => {
    try {
        const response = await axios.patch(`${siteConfig.apiEndpoint}/api/core/communities/${uuid}`, 
           [ {op: "replace", path: "/metadata/dc.title", value: {value: `${title}`, language: null}}],
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-XSRF-TOKEN": csrfToken,
                    Authorization: authToken,
                },
                withCredentials: true,
            }
        );
        if (response.status === 200) {
            showToast('Community updated successfully!', 'success');
        }
    }catch(error){
        console.error('Failed to update community',error)
    } 

}

export const fetchSubCommunities = async (parentUuid: string, page: number = 0, size: number = 20) => {
    try {
        const response = await axios.get(
            `${siteConfig.apiEndpoint}/api/core/communities/${parentUuid}/subcommunities?page=${page}&size=${size}`,
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
    } catch (error) {
        console.error('Failed to fetch subcommunities', error);
        throw error;
    }
};

export const createSubCommunity = async (parentUuid: string, name: string, description?: string) => {
    try {
        const payload: any = {
            name,
            metadata: {
                "dc.title": [{ value: name, language: null, authority: null, confidence: -1 }],
            },
        };

        if (description) {
            payload.metadata["dc.description"] = [{ value: description, language: null, authority: null, confidence: -1 }];
        }

        const response = await axios.post(
            `${siteConfig.apiEndpoint}/api/core/communities?parent=${parentUuid}`,
            payload,
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-XSRF-TOKEN": csrfToken,
                    Authorization: authToken,
                },
                withCredentials: true,
            }
        );

        if (response.status === 201) {
            showToast('Sub-community created successfully!', 'success');
        }
        return response.data;
    } catch (error: any) {
        const errorStatus = error.response?.status || 500;
        if (errorStatus === 401) {
            showToast('Unauthorized - Please login first', 'error');
        } else if (errorStatus === 403) {
            showToast('Forbidden - You do not have permission to create sub-communities', 'error');
        } else if (errorStatus === 422) {
            showToast('Invalid data - Parent community does not exist', 'error');
        } else {
            showToast('Failed to create sub-community', 'error');
        }
        throw error;
    }
};