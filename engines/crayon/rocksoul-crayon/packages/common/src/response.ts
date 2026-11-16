import type { ApiResponse } from './types.js';

export function successResponse<T>(data?: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

export function errorResponse(error: string | Record<string, unknown>, message?: string): ApiResponse<never> {
  return {
    success: false,
    message,
    error,
    timestamp: new Date().toISOString(),
  };
}
