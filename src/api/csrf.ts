import axios from "axios";
import { siteConfig } from "../data/data";
import { showToast } from "../contexts/ToastProvider";

let csrfToken: string | null = localStorage.getItem("csrfToken") || null;

export const fetchCsrfToken = async (retries = 3): Promise<string | null> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(`${siteConfig.apiEndpoint}/api/security/csrf`, {
        withCredentials: true,
      });

      const token = response.headers["dspace-xsrf-token"] || null;
      if (token) {
        setCsrfToken(token);
        return token;
      }
    } catch (error: any) {
      console.warn(`CSRF fetch attempt ${attempt}/${retries} failed:`, error.message);
      
      if (attempt === retries) {
        // Only show toast on final failure
        showToast("Failed to fetch security token. Please refresh the page.", "error");
      } else if (attempt < retries) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }
  }
  return null;
};

export const setCsrfToken = (token: string): void => {
  csrfToken = token;
  localStorage.setItem("csrfToken", token);
};

export const getCsrfToken = (): string | null => csrfToken;
