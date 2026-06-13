import { NextResponse } from "next/server";

export interface ApiResponsePayload<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Reusable helper class to standardize Next.js API response formatting
 */
export class ApiResponse {
  /**
   * Return a standardized success response
   * @param data The payload data to return to the client
   * @param message An optional success message description
   * @param status HTTP response status code (default: 200)
   */
  static success<T>(data: T, message?: string, status: number = 200) {
    const payload: ApiResponsePayload<T> = {
      success: true,
      data,
    };
    if (message) {
      payload.message = message;
    }
    return NextResponse.json(payload, { status });
  }

  /**
   * Return a standardized error response
   * @param error The error message string
   * @param status HTTP response status code (default: 400)
   * @param data Optional supplementary error details/metadata
   */
  static error(error: string, status: number = 400, data?: unknown) {
    const payload: ApiResponsePayload = {
      success: false,
      error,
    };
    if (data !== undefined) {
      payload.data = data;
    }
    return NextResponse.json(payload, { status });
  }
}
