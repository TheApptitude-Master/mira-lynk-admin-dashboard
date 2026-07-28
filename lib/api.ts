import axios from 'axios';
import { auth } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://d1glhclb7uoptr.cloudfront.net/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = auth.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      auth.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export function apiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const errObj = err.response?.data?.error ?? err.response?.data;
    if (Array.isArray(errObj?.details) && errObj.details.length) return errObj.details.join(', ');
    return errObj?.message ?? err.message;
  }
  return 'An unexpected error occurred';
}
