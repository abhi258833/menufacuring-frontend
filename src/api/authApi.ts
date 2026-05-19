import axios from "axios";
import { siteConfig } from "../data/data";
import { setAuthToken } from "./authToken";
import { fetchCsrfToken } from "./csrf";
import { showToast } from "../contexts/ToastProvider";
import { AuthStatusResponse } from "../data/accessAPI";

const csrfToken = localStorage.getItem("csrfToken") || "";
const authToken = localStorage.getItem("authToken") || "";

// Add axios interceptor for debugging all requests
axios.interceptors.request.use(
  config => {
    if (config.url?.includes("registrations")) {
      console.log("Registration request interceptor:", {
        url: config.url,
        method: config.method,
        headers: config.headers,
        data: config.data,
      });
    }
    return config;
  },
  error => Promise.reject(error)
);

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.config?.url?.includes("registrations")) {
      console.error("Registration request failed:", {
        url: error.config.url,
        method: error.config.method,
        headers: error.config.headers,
        data: error.config.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
      });
    }
    return Promise.reject(error);
  }
);
export const login = async (email: string, password: string) => {
  try {
    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) {
      throw new Error("CSRF token not available. Login aborted.");
    }
    const response = await axios.post(
      `${siteConfig.apiEndpoint}/api/authn/login`,
      { user: email, password },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-XSRF-TOKEN": csrfToken,
        },
        withCredentials: true,
      }
    );

    if (response.status === 200) {
      showToast("Login successful!", "success");
      window.location.href = "/";
    }

    const authToken = response.headers["authorization"];
    if (authToken) {
      if (isTokenExpired(authToken)) {
        localStorage.removeItem("authToken");
        throw new Error("Token has expired. Please log in again.");
      }

      setAuthToken(authToken);
      localStorage.setItem("authToken", authToken);
    }

    await fetchCsrfToken();
    return response;
  } catch (error: any) {
    if (error.response) {
      if (error.response.status === 401) {
        showToast("Invalid User ID or Password!", "error");
      } else if (error.response.status === 403) {
        showToast("Access Denied! You don't have permission.", "warning");
      } else {
        showToast("Login failed. Please try again.", "error");
      }
    } else {
      showToast("Network error. Please check your connection.", "error");
    }

    throw error;
  }
};

export const getAuthStatus = async (): Promise<string | null> => {
  try {
    const response = await axios.get<AuthStatusResponse>(
      `${siteConfig.apiEndpoint}/api/authn/status`,
      {
        headers: {
          Authorization: authToken,
        },
        withCredentials: true,
      }
    );

    if (response.status === 200 && response.data.authenticated) {
      const epersonHref = response.data._links?.eperson?.href;
      if (epersonHref) {
        const uuid = epersonHref.split("/").pop();
        return uuid || null;
      } else {
        throw new Error("Authenticated, but no eperson link found.");
      }
    } else {
      return null;
    }
  } catch (error: any) {
    console.error("Failed to get auth status:", error);
    throw error;
  }
};

export const forgotPassword = async (email: string) => {
  try {
    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) {
      throw new Error("CSRF token not available. Login aborted.");
    }
    
    // DSpace expects form-urlencoded data
    const formData = new URLSearchParams();
    formData.append("email", email);

    const response = await axios.post(
      `${siteConfig.apiEndpoint}/api/eperson/registrations?accountRequestType=register`,
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-XSRF-TOKEN": csrfToken,
        },
        withCredentials: true,
      }
    );

    if (response.status === 201) {
      return { success: true, message: "Password reset link sent to your email." };
    } else {
      throw new Error("Failed to send password reset request.");
    }
  } catch (error: any) {
    showToast("Invalid credentials. Please try again.", "error");
    throw error;
  }
};


export const register = async (email: string) => {
  try {
    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) {
      showToast("Security token unavailable. Please refresh and try again.", "error");
      throw new Error("CSRF token not available. Registration aborted.");
    }

    console.log("Starting registration with email:", email);
    console.log("CSRF Token:", csrfToken);

    const url = `${siteConfig.apiEndpoint}/api/eperson/registrations?accountRequestType=register`;
    console.log("Registration URL:", url);

    // Send as JSON - let axios set the Content-Type automatically
    const requestData = { email };
    console.log("Request body:", requestData);

    const response = await axios.post(
      url, 
      requestData,
      {
        headers: {
          "X-XSRF-TOKEN": csrfToken,
        },
        withCredentials: true,
      }
    );

    console.log("Registration response status:", response.status);
    console.log("Registration response data:", response.data);

    if (response.status === 201) {
      showToast('Registration link sent to your email.', 'success');
      return { success: true, message: "Registration link sent to your email." };
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error: any) {
    console.error("Full registration error:", error);
    
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response statusText:", error.response.statusText);
      console.error("Response headers:", error.response.headers);
      console.error("Response data:", error.response.data);
      
      if (error.response.status === 415) {
        showToast("Server rejected request format (415). Please try again.", "error");
      } else if (error.response.status === 403) {
        showToast("Security validation failed. CSRF token issue.", "error");
      } else if (error.response.status === 400) {
        showToast("Invalid email address or account already exists.", "error");
      } else if (error.response.status === 422) {
        showToast("Email validation failed. Please enter a valid email.", "error");
      } else {
        showToast(`Registration failed (${error.response.status}). Please try again.`, "error");
      }
    } else if (error.request) {
      console.error("No response received:", error.request);
      showToast("No response from server. Please check your connection.", "error");
    } else {
      console.error("Error setting up request:", error.message);
      showToast("Request failed. Please try again.", "error");
    }
    throw error;
  }
};

export const logout = async () => {
  const csrfToken = await fetchCsrfToken();
    if (!csrfToken) {
      throw new Error("CSRF token not available. Login aborted.");
    }
  try {
    const response = await axios.post(
      `${siteConfig.apiEndpoint}/api/authn/logout`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": csrfToken,
        },
        withCredentials: true,
      }
    );

    if (response.status === 204) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("isAdmin");
      window.location.href = "/";
    }
  } catch (error) {
    showToast("Logout failed. Please try again.", "error");
    throw error;
  }
};




const parseJwt = (token: string): { exp?: number } | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = JSON.parse(atob(base64));
    return decodedPayload;
  } catch (error) {
    return null;
  }
};

const isTokenExpired = (token: string): boolean => {
  const decoded = parseJwt(token);
  return decoded?.exp ? decoded.exp * 1000 < Date.now() : true;
};




