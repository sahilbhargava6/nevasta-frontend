import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
// Origin of the API (without /api/v1), where Laravel serves the CSRF cookie
const API_ORIGIN = new URL(API_BASE_URL).origin;

// Sign-in uses an HTTP-only session cookie set by the API; no token is ever
// stored in the browser. Axios sends the cookie (withCredentials) and echoes
// the XSRF-TOKEN cookie back as the X-XSRF-TOKEN header (withXSRFToken).
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Fetch a fresh CSRF cookie. Call before signing in, signing up or
 * verifying a sign-in code.
 */
export async function ensureCsrf(): Promise<void> {
  await axios.get(`${API_ORIGIN}/sanctum/csrf-cookie`, { withCredentials: true });
}

if (typeof window !== 'undefined') {
  // Tokens from older versions of the site are no longer used
  localStorage.removeItem('navesta_token');
}

// Interceptor for API errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Session ended or expired: forget the cached profile
      localStorage.removeItem('navesta_user');
    }
    const message = error.response?.data?.error || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);
