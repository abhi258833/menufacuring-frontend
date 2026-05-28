import axios from "axios";
import { siteConfig } from "../data/data";
import { fetchCsrfToken } from "../api/csrf";

const parseJwt = (token: string): { exp?: number } | null => {
  try {
    const parts = token.split(".");
    const base64Url = parts[1] || parts[0];
    if (!base64Url) return null;
    let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
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

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem("authToken");
  return !!token && !isTokenExpired(token);
};

export const login = async (email: string, password: string): Promise<any> => {
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

  const authToken = response.headers["authorization"];
  if (authToken) {
    localStorage.setItem("authToken", authToken);
  }
  
  await fetchCsrfToken(); // refresh CSRF
  return response;
};

export const logout = async (): Promise<void> => {
  try {
    const csrfToken = await fetchCsrfToken();
    if (csrfToken) {
      await axios.post(
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
    }
  } catch (error) {
    console.error("Logout API call failed:", error);
  } finally {
    // Clear everything
    localStorage.clear();
    sessionStorage.clear();
  }
};
