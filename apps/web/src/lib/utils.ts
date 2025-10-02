import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Error handling utility
export function handleApiError(error: unknown): ApiResponse<never> {
  if (error instanceof Error) {
    return { success: false, error: error.message };
  }
  return { success: false, error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' };
}
