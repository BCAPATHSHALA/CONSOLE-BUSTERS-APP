import axios from "axios";
import { getItem, removeItem, setItem } from "./localStorageManagement.js";

// Frontend URI
const frontendURI = import.meta.env.VITE_FRONTEND_URI;

// Step 1: Create Axios instance
const api = axios.create({
  baseURL: `${frontendURI}/api/v1`,
  withCredentials: true,
});

// Step 2: Implement request interceptor for attaching the access token to each outgoing request and send it to the headers like Postman
api.interceptors.request.use(
  (config) => {
    const accessToken = getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Step 3: Implement response interceptor to handle 401 errors (unauthorized) by trying to refresh the token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.get(
          `${frontendURI}/api/v1/user/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = data.data;        
        // Optionally, update the cookie with the new accessToken if necessary
        document.cookie = `accessToken=${accessToken}; path=/; secure; httpOnly`;
        
        // Update local storage also with key: accessToken
        setItem("accessToken", accessToken);

        // Retry the original request with the new access token
        api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Handle token refresh failure then logout the user
        removeItem("accessToken");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
