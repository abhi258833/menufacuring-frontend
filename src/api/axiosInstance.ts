import axios from "axios";
import { siteConfig } from "../data/data";
import { useCsrf } from "../contexts/CsrfContext";

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

  return axiosInstance;
};
