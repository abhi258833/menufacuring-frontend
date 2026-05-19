import axios from "axios";
import { siteConfig } from "../data/data";
import { showToast } from "../contexts/ToastProvider";


export interface MetadataSchema {
    prefix: string;
}

export interface MetadataField {
    id: number;
    element: string;
    qualifier: string | null;
    scopeNote: string | null;
    _embedded?: {
        schema?: MetadataSchema;
    };
}

export interface ApiResponse {
    _embedded?: {
        metadatafields?: MetadataField[];
    };
    page: {
        size: number;
        totalElements: number;
        totalPages: number;
        number: number;
    }
}
type MetadataFieldsResponse = {
    metadatafields: MetadataField[];
    totalPages: number;
};

const authToken = localStorage.getItem("authToken") || "";
const csrfToken = localStorage.getItem("csrfToken") || "";

export const fetchMetadataFields = async (
    schemaName: string,
    authToken: string,
    page: number,
    size: number,
    query: string
): Promise<MetadataFieldsResponse> => {
    try {
        const response = await axios.get<ApiResponse>(
            `${siteConfig.apiEndpoint}/api/core/metadatafields/search/byFieldName?page=${page}&size=${size}&schema=${schemaName}&query=${encodeURIComponent(query)}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": authToken,
                },
                withCredentials: true,
            }
        );
        return {
            metadatafields: response.data._embedded?.metadatafields || [],
            totalPages: response.data.page?.totalPages || 1,
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
        throw new Error("Failed to fetch metadata fields.");
    }
};

export const fetchMetadataFieldsforDC = async (
    schemaName: string,
    authToken: string,
    page: number,
    size: number,
    query: string
): Promise<{ metadatafields: any[]; totalElements: number; totalPages: number }> => {
    try {
        const response = await axios.get<ApiResponse>(
            `${siteConfig.apiEndpoint}/api/core/metadatafields/search/byFieldName?page=${page}&size=${size}&schema=dc&query=${encodeURIComponent(query)}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": authToken,
                },
                withCredentials: true,
            }
        );
        return {
            metadatafields: response.data._embedded?.metadatafields || [],
            totalElements: response.data.page?.totalElements || 0,
            totalPages: response.data.page?.totalPages || 1,
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
        throw new Error("Failed to fetch metadata fields.");
    }
};

export const addMetadataField = async (
    schemaId: string,
    element: string,
    qualifier: string | null,
    scopeNote: string | null
): Promise<MetadataField> => {
    try {
        const response = await axios.post<MetadataField>(
            `${siteConfig.apiEndpoint}/api/core/metadatafields?schemaId=${schemaId}`,
            {
                element,
                qualifier,
                scopeNote,
            },
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
            showToast('Metadata field added successfully!', 'success');
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
        throw new Error("Failed to add metadata field.");
    }
};
export const deleteBitstream = async (id: number) => {
    try {
        const authToken = localStorage.getItem("authToken") || "";
        const csrfToken = localStorage.getItem("csrfToken") || "";
        await axios.delete(`${siteConfig.apiEndpoint}/api/core/metadatafields/${id}`, {
            headers: {
                "Content-Type": "application/json",
                "X-XSRF-TOKEN": csrfToken,
                Authorization: authToken,
            },
            withCredentials: true,
        });

        showToast("Metadata field deleted successfully!", "success");

    } catch (error) {
        showToast("Failed to delete metadata field.", "error");
        throw error;
    }
};


