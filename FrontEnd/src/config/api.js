const DEFAULT_API_BASE_URL = 'http://localhost:8080';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

export const apiUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
