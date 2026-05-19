import axios from "axios";
import { siteConfig } from "../data/data";
import { fetchCsrfToken, getCsrfToken } from "./csrf";
import { showToast } from "../contexts/ToastProvider";

export interface EPerson {
  id: string;
  uuid: string;
  name: string;
  email: string;
  metadata: {
    'eperson.firstname'?: [{ value: string }];
    'eperson.lastname'?: [{ value: string }];
  };
}


interface UserListResponse {
  _embedded: {
    epersons: EPerson[];
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}
const csrfToken = localStorage.getItem("csrfToken");
const authToken = localStorage.getItem("authToken");


export const userList = async (page: number = 0, size: number = 10, query: string = "") => {
  try {
    const response = await axios.get<UserListResponse>(
      `${siteConfig.apiEndpoint}/api/eperson/epersons/search/byMetadata?page=${page}&size=${size}&query=${encodeURIComponent(query)}`,
      {
        headers: {
          "Content-Type": "application/json",
          'X-XSRF-TOKEN': csrfToken,
          "Authorization": authToken,
        },
        withCredentials: true,
      }
    );
    return {
      epersons: response.data._embedded?.epersons || [],
      totalPages: response.data.page?.totalPages || 1,
    };
  } catch (error: any) {
    showToast("Failed to fetch user list.", "error");
    throw error;
  }
};



export const removeUser = async (userId: string) => {

  try {

    if (!csrfToken) {
      showToast("CSRF token is missing. Aborting delete request.", "error");
      return false;
    }

    const response = await axios.delete(
      `${siteConfig.apiEndpoint}/api/eperson/epersons/${userId}`,
      {
        headers: {
          'X-XSRF-TOKEN': csrfToken,
          'Authorization': authToken || '',
        },
        withCredentials: true,
      }
    );
    if (response.status === 204) {
      showToast('User deleted successfully!', 'success');
    }

    return response.status === 204;
  } catch (error) {
    showToast("Failed to delete user.", "error");
    return false;
  }
};

export const addUser = async (userData: any) => {
  try {
    const csrfToken = await fetchCsrfToken();

    console.log("Creating user with data:", userData);

    // Build payload with password and confirmPassword if provided
    const payload: any = {
      email: userData.email,
      canLogIn: userData.canLogIn !== undefined ? userData.canLogIn : true,
      requireCertificate: userData.requireCertificate !== undefined ? userData.requireCertificate : false,
      metadata: {
        "eperson.firstname": [{ value: userData.metadata?.["eperson.firstname"]?.[0]?.value || userData.firstname }],
        "eperson.lastname": [{ value: userData.metadata?.["eperson.lastname"]?.[0]?.value || userData.lastname }],
      },
      type: "eperson"
    };

    // Add password and confirmPassword if provided
    if (userData.password) {
      payload.password = userData.password;
    }
    if (userData.confirmPassword) {
      payload.confirmPassword = userData.confirmPassword;
    }

    // Add optional fields
    if (userData.netid) {
      payload.netid = userData.netid;
    }

    console.log("Sending payload to API:", payload);

    const response = await axios.post<EPerson>(
      `${siteConfig.apiEndpoint}/api/eperson/epersons`,
      JSON.stringify(payload),
      {
        headers: {
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": csrfToken || "",
          Authorization: authToken || "",
        },
        withCredentials: true,
      }
    );

    if (response.status === 201) {
      const createdUser = response.data;
      console.log("User created successfully:", createdUser);
      showToast('User added successfully!', 'success');
      return createdUser;
    }

    return response.data;
  } catch (error: any) {
    console.error("Failed to add user:", error.response?.data || error.message);
    showToast("Failed to add user.", "error");
    throw error;
  }
};

export const getUserById = async (userId: string, authToken: string) => {
  try {
    const csrfToken = getCsrfToken() ?? "";
    const response = await fetch(`${siteConfig.apiEndpoint}/api/eperson/epersons/${userId}`, {
      method: "GET",
      headers: {
        "X-XSRF-TOKEN": csrfToken,
        Authorization: authToken,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user details");
    }

    return await response.json();
  } catch (error) {
    showToast("Failed to fetch user details.", "error");
    throw error;
  }
};
export const updateUser = async (userId: string, userData: Record<string, any>) => {
  try {

    const patchPayload: any[] = [];

    if (userData.firstName !== undefined) {
      patchPayload.push({
        op: "replace",
        path: "/metadata/eperson.firstname",
        value: userData.firstName,
      });
    }
    if (userData.lastName !== undefined) {
      patchPayload.push({
        op: "replace",
        path: "/metadata/eperson.lastname",
        value: userData.lastName,
      });
    }
    if (userData.email !== undefined) {
      patchPayload.push({
        op: "replace",
        path: "/email",
        value: userData.email,
      });
    }

    if (patchPayload.length === 0) return;

    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) {
      throw new Error("CSRF token not available. Login aborted.");
    }

    await axios.patch(`${siteConfig.apiEndpoint}/api/eperson/epersons/${userId}`, patchPayload, {
      headers: {
        'X-XSRF-TOKEN': csrfToken,
        'Authorization': authToken || '',
      },
      withCredentials: true,
    });

  } catch (error) {
    showToast("Failed to update user.", "error");
    throw error;
  }
};




