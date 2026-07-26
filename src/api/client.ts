import axios from 'axios';

const defaultApiBaseUrl = '/api';
const enableDemoFallbacks = import.meta.env.VITE_ENABLE_DEMO_FALLBACKS === 'true';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? defaultApiBaseUrl,
  withCredentials: true,
  timeout: 12000,
});

export function setApiToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }
  delete api.defaults.headers.common.Authorization;
}

export async function safeGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await api.get<T>(path);
    return response.data;
  } catch (error) {
    if (enableDemoFallbacks) {
      return fallback;
    }

    throw error;
  }
}

export async function safePost<T>(path: string, body: unknown, fallback: T): Promise<T> {
  try {
    const response = await api.post<T>(path, body);
    return response.data;
  } catch (error) {
    if (enableDemoFallbacks) {
      return fallback;
    }

    throw error;
  }
}

export function isDemoFallbacksEnabled() {
  return enableDemoFallbacks;
}
