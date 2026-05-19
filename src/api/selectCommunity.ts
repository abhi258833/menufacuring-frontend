import { siteConfig } from "../data/data";
import axios from "axios";


export interface MetadataValue {
    value: string;
}

export interface Metadata {
    [key: string]: MetadataValue[];
}

export interface CommunityApiResponse {
    _embedded?: {
        searchResult: {
            _embedded?: {
                objects?: {
                    _embedded?: {
                        indexableObject?: {
                            id: string;
                            metadata: Metadata[];
                        }
                    };
                }[];
            };
            page?: {
                number: number;
                size: number;
                totalPages: number;
                totalElements: number;
            };
        };
    };
}
const authToken = localStorage.getItem("authToken") || "";

export const fetchCommunities = async (page: number = 0, size: number = 10, search: string = '') => {
    const apiUrl = `${siteConfig.apiEndpoint}/api/discover/search/objects?sort=dc.title,ASC&page=${page}&size=${size}${search ? `&query=${search}` : ''}&dsoType=COMMUNITY`
    try{
        const response = await axios.get<CommunityApiResponse>(apiUrl, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": authToken
        },
        withCredentials: true,
    });
    const result = {
        communities: response.data._embedded?.searchResult?._embedded?.objects?.map(obj => ({
            id: obj._embedded?.indexableObject?.id || '',
            metadata: obj._embedded?.indexableObject?.metadata || {}
        })) || [],
        totalElements: response.data._embedded?.searchResult?.page?.totalElements || 0
    };

    return result;
    }catch(error: any){
        console.error("Error fetching communities:", error);
    }
}