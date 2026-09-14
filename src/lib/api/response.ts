import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data } as ApiSuccessResponse<T>, { status });
}

export function errorResponse(code: string, message: string, status = 500, details?: unknown) {
  return NextResponse.json(
    { success: false, error: { code, message, details } } as ApiErrorResponse,
    { status }
  );
}
