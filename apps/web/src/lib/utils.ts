import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

// API Error Handler
export function handleApiError(error: unknown): ApiResponse {
  if (error instanceof Error) {
    console.error('API Error:', error)
    return {
      success: false,
      error: error.message
    }
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    console.error('API Error:', error)
    return {
      success: false,
      error
    }
  }
  
  // Handle unknown error types
  console.error('Unknown API Error:', error)
  return {
    success: false,
    error: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
  }
}
