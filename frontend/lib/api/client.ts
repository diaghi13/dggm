import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

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

    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
      }
      return Promise.reject(error);
    }

    // Handle 403 Forbidden - user doesn't have permission
    if (error.response?.status === 403) {
      const message = (error.response.data as any)?.message || 'Non hai i permessi per eseguire questa azione';

      toast.error('Accesso negato', {
        description: message,
        duration: 5000,
      });

      console.error('Access forbidden:', error.response.data);
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
