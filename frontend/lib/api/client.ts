import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Enable sending cookies with requests
});

// Configure CSRF protection (Laravel Sanctum)
// These settings allow Laravel to read and verify CSRF tokens
apiClient.defaults.xsrfCookieName = 'XSRF-TOKEN';
apiClient.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

// Flag to prevent multiple simultaneous token refresh attempts
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Subscribe to token refresh completion
function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

// Notify all subscribers when token is refreshed
function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

// Request interceptor - No longer needed for auth token
// Token is now sent automatically via httpOnly cookie
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Token is automatically sent via httpOnly cookie
    // No need to manually add Authorization header
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      // Prevent infinite loops - if already retried, clear auth and redirect
      if (originalRequest._retry) {
        localStorage.removeItem('auth-storage');
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // If we're already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;

      // TODO: Implement token refresh endpoint in backend
      // For now, we just clear auth and redirect
      // Future implementation:
      /*
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {}, {
          headers: {
            Authorization: originalRequest.headers?.Authorization
          }
        });

        const newToken = data.data.token;

        // Update token in storage
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          parsed.state.token = newToken;
          localStorage.setItem('auth-storage', JSON.stringify(parsed));
        }

        // Update original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        // Notify all queued requests
        onTokenRefreshed(newToken);
        isRefreshing = false;

        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        // Refresh failed, clear auth and redirect
      }
      */

      // Current behavior: clear auth storage and redirect
      // httpOnly cookie will be cleared by backend on next request
      localStorage.removeItem('auth-storage');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Handle 403 Forbidden - user doesn't have permission
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data);
      // You could show a toast notification here
    }

    // Handle 422 Validation errors
    if (error.response?.status === 422) {
      console.error('Validation error:', error.response.data);
      // Validation errors are typically handled by form components
    }

    // Handle 500 Server errors
    if (error.response?.status === 500) {
      console.error('Server error:', error.response.data);
      // You could show a generic error toast here
    }

    return Promise.reject(error);
  }
);

export default apiClient;
