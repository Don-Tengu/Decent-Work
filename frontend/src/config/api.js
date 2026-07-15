const trimTrailingSlash = (value) => String(value ?? '').replace(/\/+$/, '');

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
);

export const GRAPHQL_ENDPOINT = `${API_BASE_URL}/graphql`;

export const toApiUrl = (path) => {
  if (!path) {
    return '';
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};
