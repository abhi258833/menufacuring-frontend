import { showToast } from "../contexts/ToastProvider";
import { siteConfig } from "../data/data";
import axios from "axios";


interface MetadataSchema {
    id: number;
    prefix: string;
    namespace: string;
    type: string;
    _links: {
        self: { href: string };
    };
}

interface MetadataSchemaResponse {
    _embedded: {
        metadataschemas: MetadataSchema[];
    };
    page?: {
        size: number;
        totalElements: number;
        totalPages: number;
        number: number;
    };
}

export const fetchMetadataSchemas = async (authToken: string, page: number = 0, size: number = 20) => {
    try {
        const response = await axios.get<MetadataSchemaResponse>(
            `${siteConfig.apiEndpoint}/api/core/metadataschemas?page=${page}&size=${size}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": authToken,
                },
                withCredentials: true,
            }
        );
        return {
            metadataschemas: response.data._embedded?.metadataschemas || [],
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
        throw error;
    }
};

export const addMetadataSchema = async (payload: { prefix: string; namespace: string }) => {
    try {
        const authToken = localStorage.getItem("authToken") || "";
        const csrfToken = localStorage.getItem("csrfToken") || "";

        const response = await axios.post(
            `${siteConfig.apiEndpoint}/api/core/metadataschemas`,
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
            showToast('Metadata schema added successfully!', 'success');
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

export const deleteMetadataSchema = async (id: number) => {
    try {
        const authToken = localStorage.getItem("authToken") || "";
        const csrfToken = localStorage.getItem("csrfToken") || "";
        await axios.delete(`${siteConfig.apiEndpoint}/api/core/metadataschemas/${id}`, {
            headers: {
                "Content-Type": "application/json",
                "X-XSRF-TOKEN": csrfToken,
                Authorization: authToken,
            },
            withCredentials: true,
        });
        showToast("Metadata schema deleted successfully!", "success");
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
