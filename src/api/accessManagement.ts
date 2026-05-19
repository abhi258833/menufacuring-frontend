import axios from "axios";
import { siteConfig } from "../data/data";
import { showToast } from "../contexts/ToastProvider";
import { APIResponse, Collection, Community } from "../data/accessAPI";
import { ApiResponse } from "./group";

const getAccessManagementHeaders = () => {
    const authToken = localStorage.getItem("authToken") || "";
    const csrfToken = localStorage.getItem("csrfToken") || "";

    return {
        "Content-Type": "application/json",
        Authorization: authToken,
        "X-XSRF-TOKEN": csrfToken,
    };
};

export const fetchCommunities = async (): Promise<Community[]> => {
    const apiUrl = `${siteConfig.apiEndpoint}/api/core/communities`;

    try {
        const response = await axios.get<APIResponse<Community>>(apiUrl, {
            headers: getAccessManagementHeaders(),
            withCredentials: true,
        });

        return response.data._embedded?.communities || [];
    } catch (error) {
        showToast("Failed to fetch communities", "error");
        return [];
    }
};

export const fetchCollections = async (communityId: string): Promise<Collection[]> => {
    const apiUrl = `${siteConfig.apiEndpoint}/api/core/communities/${communityId}/collections`;

    try {
        const response = await axios.get<APIResponse<Collection>>(apiUrl, {
            headers: getAccessManagementHeaders(),
            withCredentials: true,
        });

        return response.data._embedded?.collections || [];
    } catch (error) {
        showToast(`Failed to fetch collections for community ${communityId}`, "error");
        return [];
    }
};

export const fetchCollectionById = async (collectionId: string): Promise<any | null> => {
    const apiUrl = `${siteConfig.apiEndpoint}/api/core/collections/${collectionId}`;

    try {
        const response = await axios.get<any>(apiUrl, {
            headers: getAccessManagementHeaders(),
            withCredentials: true,
        });

        return response.data || null;
    } catch (error) {
        showToast(`Failed to fetch collection ${collectionId}`, "error");
        return null;
    }
};

export const fetchCommunityByUrl = async (communityUrl: string): Promise<any | null> => {
    try {
        const response = await axios.get<any>(communityUrl, {
            headers: getAccessManagementHeaders(),
            withCredentials: true,
        });

        return response.data || null;
    } catch (error) {
        showToast("Failed to fetch parent community", "error");
        return null;
    }
};

export const fetchGroupsList = async () => {
    try {
        const apiUrl = `${siteConfig.apiEndpoint}/api/eperson/groups`;

        const response = await axios.get<ApiResponse>(apiUrl, {
            headers: getAccessManagementHeaders(),
            withCredentials: true,
        });

        return {
            groups: response.data._embedded?.groups || [],
            totalPages: response.data.page?.totalPages || 1,
        };
    } catch (error) {
        return { groups: [], totalPages: 1 };
    }
};

export const fetchUserGroupsList = async (userId: string) => {
    try {
        const apiUrl = `${siteConfig.apiEndpoint}/api/eperson/epersons/${userId}/groups`;

        const response = await axios.get<ApiResponse>(apiUrl, {
            headers: getAccessManagementHeaders(),
            withCredentials: true,
        });

        return {
            groups: response.data._embedded?.groups || [],
            totalPages: response.data.page?.totalPages || 1,
        };
    } catch (error) {
        return { groups: [], totalPages: 1 };
    }
};

