import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { tenantContext } from '@/lib/tenant-context';

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

// Request interceptor — adds x-tenant header when a tenant is selected
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Token is automatically sent via httpOnly cookie.
    // We only need to add the x-tenant header for multi-tenant routing.
    if (typeof window !== 'undefined') {
      // First: read from in-memory context (set synchronously by auth-store,
      // avoids the async localStorage write timing issue with Zustand persist).
      let tenantId = tenantContext.get();

      // Fallback: read from localStorage (for page refreshes where auth-store
      // hasn't had setCurrentTenant called yet, but persist has hydrated).
      if (!tenantId) {
        try {
          const raw = localStorage.getItem('auth-storage');
          if (raw) {
            const parsed = JSON.parse(raw) as { state?: { currentTenant?: { id?: string } } };
            tenantId = parsed?.state?.currentTenant?.id ?? null;
          }
        } catch {
          // Ignore JSON parse errors — localStorage may be empty or corrupted
        }
      }

      if (tenantId) {
        config.headers['x-tenant'] = tenantId;
      }
    }
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
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
      }
      toast.error('Sessione scaduta', {
        description: 'Effettua nuovamente il login per continuare.',
        duration: 6000,
      });
      (error as AxiosError & { _handled?: boolean })._handled = true;
      return Promise.reject(error);
    }

    // Handle 402 Payment Required — subscription inactive
    if (error.response?.status === 402) {
      if (typeof window !== 'undefined') {
        window.location.href = '/pending-activation';
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
      (error as AxiosError & { _handled?: boolean })._handled = true;
    }

    // Handle 422 Validation errors — show field-level detail in toast
    if (error.response?.status === 422) {
      const data = error.response.data as { errors?: Record<string, string[]>; message?: string };
      const fieldErrors = data?.errors;
      const description = fieldErrors
        ? Object.entries(fieldErrors)
            .flatMap(([field, messages]) => messages.map((msg) => `${field}: ${msg}`))
            .slice(0, 4)
            .join(' • ')
        : (data?.message || 'Controlla i dati inseriti e riprova.');
      toast.error('Dati non validi', { description, duration: 7000 });
      (error as AxiosError & { _handled?: boolean })._handled = true;
    }

    // Handle 500 Server errors
    if (error.response?.status === 500) {
      toast.error('Errore del server', {
        description: 'Si è verificato un errore interno. Riprova tra qualche istante.',
        duration: 6000,
      });
      (error as AxiosError & { _handled?: boolean })._handled = true;
    }

    return Promise.reject(error);
  }
);

export default apiClient;
