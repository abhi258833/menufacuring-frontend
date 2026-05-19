import axios from "axios";
import { siteConfig } from "../data/data";
import { showToast } from "../contexts/ToastProvider";


export interface Group {
    id: string;
    uuid: string;
    name: string;
    metadata?: {
        ["dc.description"]?: { value: string }[];
    };
    _embedded?: {
        object?: {
            name?: string;
            metadata?: {
                ["dc.description"]?: { value: string }[];
            };
        };
    };
}

export interface ApiResponse {
    _embedded?: {
        groups?: Group[];
    };
    page?: {
        size: number;
        totalElements: number;
        totalPages: number;
        number: number;
    };
}
export interface GroupMetadata {
    "dc.description": { value: string }[];
}

export interface GroupPayload {
    name: string;
    metadata: GroupMetadata;
}
export interface EPerson {
    id: string;
    uuid: string;
    name: string;
    metadata: {
        "eperson.firstname"?: { value: string }[];
        "eperson.lastname"?: { value: string }[];
    };
    email: string;
}

export interface APIResponse {
    epersons(epersons: any): unknown;
    totalPages(totalPages: any): unknown;
    _embedded: {
        epersons: EPerson[];
    };
    page: {
        number: number;
        size: number;
        totalPages: number;
        totalElements: number;
    };
}
const authToken = localStorage.getItem("authToken") || "";
const csrfToken = localStorage.getItem("csrfToken") || "";

export const addMemberToGroup = async (groupId: string, epersonId: string) => {
    try {
        const payload = `${siteConfig.apiEndpoint}/api/eperson/epersons/${epersonId}`;
        const response = await axios.post(
            `${siteConfig.apiEndpoint}/api/eperson/groups/${groupId}/epersons`,
            payload,
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

export const fetchGroups = async (
    page: number = 0,
    size: number = 10,
    query: string = ""
) => {
    try {
        const apiUrl = `${siteConfig.apiEndpoint}/api/eperson/groups/search/byMetadata?page=${page}&size=${size}&query=${encodeURIComponent(query)}&embed=object`;

        const response = await axios.get<ApiResponse>(apiUrl, {
            headers: {
                "Content-Type": "application/json",
                Authorization: authToken,
            },
            withCredentials: true,
        });

        return {
            groups: response.data._embedded?.groups || [],
            totalPages: response.data.page?.totalPages || 1,
        };
    } catch (error: any) {
        showToast("Failed to fetch groups.", "error");
        return { groups: [], totalPages: 1 };
    }
};


export const addGroup = async (groupData: GroupPayload): Promise<boolean> => {
    try {

        const apiUrl = `${siteConfig.apiEndpoint}/api/eperson/groups`;

        const response = await axios.post(apiUrl, groupData, {
            headers: {
                "Content-Type": "application/json",
                "X-XSRF-TOKEN": csrfToken,
                "Authorization": authToken,
            },
            withCredentials: true,
        });
        if (response.status === 201) {
            showToast("Group created successfully!", "success");
        } else {
            showToast("Failed to create group.", "error");
        }
        return response.status === 201;
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
        return false;
    }
};



export const fetchGroupMembers = async (groupId: string, page: number = 0, size: number = 5): Promise<APIResponse> => {
    try {
        const response = await axios.get<APIResponse>(
            `${siteConfig.apiEndpoint}/api/eperson/groups/${groupId}/epersons?page=${page}&size=${size}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": authToken,
                },
            }
        );
        return response.data;
    } catch (error: any) {
        showToast("Failed to fetch group members.", "error");
        throw error;
    }
};

export const fetchNonMembers = async (groupId: string, page: number = 0, size: number = 5, query: string = ""): Promise<APIResponse> => {
    try {
        const response = await axios.get<APIResponse>(
            `${siteConfig.apiEndpoint}/api/eperson/epersons/search/isNotMemberOf?page=${page}&size=${size}&query=${encodeURIComponent(query)}&group=${groupId}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": authToken,
                },
            }
        );
        return response.data;
    } catch (error) {
        showToast("Failed to fetch non-members.", "error");
        throw error;
    }
};

export const removeMemberToGroup = async (groupId: string, epersonId: string) => {
    try {
        const response = await axios.delete(
            `${siteConfig.apiEndpoint}/api/eperson/groups/${groupId}/epersons/${epersonId}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-XSRF-TOKEN": csrfToken,
                    "Authorization": authToken,
                },
                withCredentials: true,
            }
        );
        return response.data;
    } catch (error) {
        showToast("Failed to remove member from group.", "error");
        throw error;
    }
};

export const editGroupDetail = async (groupId: string, groupName: string, groupDescription: string) => {

    try {
        const response = await axios.patch(
            `${siteConfig.apiEndpoint}/api/eperson/groups/${groupId}`,
            [
                { op: "add", path: "/metadata/dc.description", value: groupDescription },
                { op: "replace", path: "/name", value: groupName }
            ],
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-XSRF-TOKEN": csrfToken,
                    "Authorization": authToken,
                },
                withCredentials: true,
            }
        );
        if (response.status === 200) {
            showToast("Group details updated successfully!", "success");
        }
        return response.data;
    } catch (error) {
        showToast("Failed to update group details.", "error");
        throw error;
    }
};

export const deleteGroup = async (groupId: string) => {

    try {
        const response = await axios.delete(
            `${siteConfig.apiEndpoint}/api/eperson/groups/${groupId}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": authToken,
                    "X-XSRF-TOKEN": csrfToken,

                },
                withCredentials: true,
            }
        );
        if (response.status === 204) {
            showToast("Group deleted successfully!", "success");
        }
        return response.data;
    } catch (error) {
        showToast("Failed to delete group.", "error");
        throw error;
    }
};


