import axios from "axios";
import { siteConfig } from "../data/data";
import { useCsrf } from "../contexts/CsrfContext";
import * as AuthService from "../services/AuthService";
import { showToast } from "../contexts/ToastProvider";

let isLoggingOut = false;

export const useAxiosInstance = () => {
  const { csrfToken } = useCsrf();

  const axiosInstance = axios.create({
    baseURL: siteConfig.apiEndpoint,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  });

  axiosInstance.interceptors.request.use((config) => {
    if (csrfToken) {
      config.headers = {
        ...config.headers,
        "X-XSRF-TOKEN": csrfToken,
      };
    }
    return config;
  });

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error.response ? error.response.status : null;

      if (status === 401) {
        const isLoginRequest = error.config?.url?.includes("/api/authn/login");
        const isStatusCheck = error.config?.url?.includes("/api/authn/status");

        if (!isLoginRequest && !isStatusCheck && !isLoggingOut) {
          const isAuth = AuthService.isAuthenticated();

          if (!isAuth) {
            isLoggingOut = true;
            try {
              await AuthService.logout();
            } catch (logoutError) {
              console.error("Auto-logout request failed:", logoutError);
            } finally {
              showToast("Your session has expired. Please login again.", "error");

              const currentPath = window.location.pathname;
              const currentSearch = window.location.search;
              const redirectUrl = encodeURIComponent(currentPath + currentSearch);
              window.location.href = `/session-expired?redirect=${redirectUrl}`;
              isLoggingOut = false;
            }
          }
        }
      } else if (status === 403) {
        const isLoginRequest = error.config?.url?.includes("/api/authn/login");
        if (!isLoginRequest) {
          showToast("Access denied.", "error");
          window.location.href = "/access-denied";
        }
      } else if (status === 404) {
        const isStatusCheck = error.config?.url?.includes("/api/authn/status");
        const isStaticAsset = error.config?.url?.match(/\.(png|jpg|jpeg|gif|svg|css|js|json)$/);
        
        if (!isStatusCheck && !isStaticAsset) {
          showToast("Requested resource not found.", "error");
          window.location.href = "/not-found";
        }
      }

      return Promise.reject(error);
    }
  );

  return axiosInstance;
};
