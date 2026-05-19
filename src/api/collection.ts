import axios from "axios";
import { siteConfig } from "../data/data";
import { showToast } from "../contexts/ToastProvider";
import { addGroup, GroupPayload } from "./group";

export interface Collection {
  id: string;
  name: string;
}

interface ApiResponse {
  _embedded?: {
    searchResult?: {
      _embedded?: {
        objects: {
          _embedded: {
            indexableObject: {
              uuid: string;
              name: string;
            };
          };
        }[];
      };
    };
  };
}

export const fetchCollections = async (): Promise<Collection[]> => {
  try {
    const authToken = localStorage.getItem("authToken") || "";

    const response = await axios.get<ApiResponse>(
      `${siteConfig.apiEndpoint}/api/discover/search/objects?page=0&size=10&dsoType=COLLECTION`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
      }
    );
    const objects = response.data._embedded?.searchResult?._embedded?.objects || [];
    return objects.map((obj) => ({
      id: obj._embedded.indexableObject.uuid,
      name: obj._embedded.indexableObject.name,
    }));
  } catch (error) {
    showToast("Failed to fetch collections.", "error");
    throw error;
  }
};

const authToken = localStorage.getItem("authToken") || "";
const csrfToken = localStorage.getItem("csrfToken") || "";
export const AddCollection = async (parentId: string, title: string, description: string) => {
  try {
    const response = await axios.post(`${siteConfig.apiEndpoint}/api/core/collections?parent=${parentId}`, {
      metadata: {
        "dc.title": [{ value: title }],
        "dc.description": [{ value: description }],
      }
    },
      {
        headers: {
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": csrfToken,
          "Authorization": authToken
        },
        withCredentials: true
      }
    );
    if (response.status === 201) {
      setTimeout(async () => {
        const groupBaseName = title;
        const groupNames = [`${groupBaseName}_Read`, `${groupBaseName}_Admin`, `${groupBaseName}_Upload`];

        for (const groupName of groupNames) {
          const payload: GroupPayload = {
            name: groupName,
            metadata: {
              "dc.description": [{ value: description }],
            },
          };

          try {
            const success = await addGroup(payload);
            if (success) {
              showToast(`Group '${groupName}' created successfully!`, "success");
            }
          } catch (groupError: any) {
            console.error(`Failed to create group '${groupName}':`, groupError);
            showToast(`Failed to create group '${groupName}'`, "error");
          }
        }
      }, 1000);
      showToast("Collection created successfully!", "success");
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

export const deleteCollection = async (uuid: string) => {
  try {
    const response = await axios.delete(`${siteConfig.apiEndpoint}/api/core/collections/${uuid}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": csrfToken,
          "Authorization": authToken
        },
        withCredentials: true
      });
    if (response.status === 204) {
      showToast('Collection deleted successfully!', 'success');
    }
    return response.data
  } catch (error) {
    showToast('Failed to delete collection', 'error')
  };
}

export const editCollection = async (uuid: string, title: string) => {
  try {
    const response = await axios.patch(`${siteConfig.apiEndpoint}/api/core/collections/${uuid}`,
      [{ op: "replace", path: "/metadata/dc.title", value: { value: `${title}`, language: null } }],
      {
        headers: {
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": csrfToken,
          "Authorization": authToken
        },
        withCredentials: true,
      }
    )
    if (response.status === 200) {
      showToast('Collection updated successfully!', 'success');
    }
  } catch (error) {
    console.error('Failed to update collection', error);
  }
}