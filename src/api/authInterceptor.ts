import axios from "axios";
import * as AuthService from "../services/AuthService";
import { showToast } from "../contexts/ToastProvider";

let isLoggingOut = false;

axios.interceptors.response.use(
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
      
      // Only redirect for major page or endpoint requests that fail, not status/assets
      if (!isStatusCheck && !isStaticAsset) {
        showToast("Requested resource not found.", "error");
        window.location.href = "/not-found";
      }
    }

    return Promise.reject(error);
  }
);
