import axios from 'axios';

const rawUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const API_BASE_URL = rawUrl && rawUrl.length > 0 ? rawUrl : 'http://localhost:3001/api/v1';

// Safely compute the API origin without throwing during static prerendering
function getApiOrigin(urlStr: string): string {
  try {
    const formatted = urlStr.startsWith('http://') || urlStr.startsWith('https://')
      ? urlStr
      : `https://${urlStr}`;
    return new URL(formatted).origin;
  } catch {
    return 'http://localhost:3001';
  }
}

const API_ORIGIN = getApiOrigin(API_BASE_URL);

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
  localStorage.removeItem('navesta_token');
}

// Interceptor for API errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('navesta_user');
    }
    const message = error.response?.data?.error || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);
