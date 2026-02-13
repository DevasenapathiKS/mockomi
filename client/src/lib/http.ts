import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import type { ApiError } from '@/types/api';

const baseURL = process.env.NEXT_PUBLIC_API_URL;

if (!baseURL) {
  console.warn('NEXT_PUBLIC_API_URL is not set. API calls will fail.');
}

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;
let activeRequests = 0;
const loadingListeners = new Set<(active: boolean) => void>();

function notifyLoading() {
  const isActive = activeRequests > 0;
  loadingListeners.forEach((listener) => listener(isActive));
}

function onRequest(config: InternalAxiosRequestConfig) {
  activeRequests += 1;
  notifyLoading();

  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  return config;
}

function onRequestError(error: AxiosError) {
  activeRequests = Math.max(activeRequests - 1, 0);
  notifyLoading();
  return Promise.reject(error);
}

function onResponse<T>(response: AxiosResponse<T>) {
  activeRequests = Math.max(activeRequests - 1, 0);
  notifyLoading();
  return response;
}

function onResponseError(error: AxiosError<ApiError>) {
  activeRequests = Math.max(activeRequests - 1, 0);
  notifyLoading();

  if (error.response?.status === 401 && unauthorizedHandler) {
    unauthorizedHandler();
  }

  return Promise.reject(error);
}

api.interceptors.request.use(onRequest, onRequestError);
api.interceptors.response.use(onResponse, onResponseError);

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function subscribeToLoading(listener: (active: boolean) => void) {
  loadingListeners.add(listener);
  return () => loadingListeners.delete(listener);
}

export type HttpError = AxiosError<ApiError>;
