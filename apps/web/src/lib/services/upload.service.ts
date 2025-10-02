/**
 * Upload Service
 * Handle file uploads to Supabase Storage with retry logic
 */

import { supabaseAdmin } from '../supabase'; // Use admin client to bypass RLS

export type UploadError = 
  | 'NETWORK_ERROR'
  | 'STORAGE_ERROR'
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE_TYPE'
  | 'UPLOAD_FAILED'
  | 'UNKNOWN_ERROR';

export interface UploadOptions {
  maxRetries?: number;
  retryDelay?: number;
  onProgress?: (progress: number) => void;
  onRetry?: (attempt: number) => void;
}

export interface UploadResult {
  url: string;
  path: string;
  size: number;
}

export class UploadService {
  private readonly BUCKET_NAME = 'employee-selfies'; // Secure bucket with RLS policies
  private readonly MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

  /**
   * Upload selfie image to Supabase Storage
   */
  async uploadSelfie(
    blob: Blob,
    employeeId: string,
    action: 'checkin' | 'checkout',
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const { maxRetries = 3, retryDelay = 1000, onProgress, onRetry } = options;

    // SECURITY: Validate employeeId format (must be valid UUID)
    if (!this.isValidUUID(employeeId)) {
      throw new Error('SECURITY_ERROR: Invalid employee ID format');
    }

    // Validate file
    this.validateFile(blob);

    // Generate filename and path with security validation
    const filename = this.generateFilename(employeeId, action);
    const filePath = this.generateSecureFilePath(employeeId, action, filename);
    
    console.log('Upload selfie params:', {
      employeeId,
      action,
      filename,
      filePath,
      blobSize: blob.size,
      blobType: blob.type
    });

    // Retry logic
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          onRetry?.(attempt);
          await this.delay(retryDelay * attempt);
        }

        const result = await this.performUpload(blob, filePath, onProgress);
        return {
          url: result.publicUrl,
          path: filePath,
          size: blob.size
        };
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw this.handleUploadError(lastError);
        }
      }
    }

    throw new Error('UPLOAD_FAILED');
  }

  /**
   * Validate uploaded file
   */
  private validateFile(blob: Blob): void {
    console.log('Validating file:', {
      size: blob.size,
      maxSize: this.MAX_FILE_SIZE,
      type: blob.type,
      allowedTypes: this.ALLOWED_TYPES
    });

    if (blob.size > this.MAX_FILE_SIZE) {
      throw new Error(`FILE_TOO_LARGE: File size ${blob.size} exceeds maximum ${this.MAX_FILE_SIZE}`);
    }

    if (!this.ALLOWED_TYPES.includes(blob.type)) {
      throw new Error(`INVALID_FILE_TYPE: File type ${blob.type} not in allowed types: ${this.ALLOWED_TYPES.join(', ')}`);
    }
    
    console.log('File validation passed');
  }

  /**
   * Generate filename with timestamp
   */
  private generateFilename(employeeId: string, action: 'checkin' | 'checkout'): string {
    const timestamp = new Date().toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .split('.')[0];
    
    return `${employeeId}_${timestamp}_${action}.jpg`;
  }

  /**
   * Generate secure file path following storage structure
   * SECURITY: Enforces user isolation - users can only upload to their own directory
   */
  private generateSecureFilePath(employeeId: string, action: 'checkin' | 'checkout', filename: string): string {
    // SECURITY: Sanitize inputs to prevent path traversal
    const sanitizedEmployeeId = this.sanitizePathComponent(employeeId);
    const sanitizedAction = this.sanitizePathComponent(action);
    const sanitizedFilename = this.sanitizePathComponent(filename);
    
    // SECURITY: Use the new secure path structure matching RLS policies
    return `${sanitizedAction}/${sanitizedEmployeeId}/${sanitizedFilename}`;
  }

  /**
   * Legacy method - kept for backward compatibility
   */
  private generateFilePath(employeeId: string, action: 'checkin' | 'checkout', filename: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    return `${year}/${month}/${employeeId}/${action}_images/${filename}`;
  }

  /**
   * Perform actual upload to Supabase Storage
   */
  private async performUpload(
    blob: Blob, 
    path: string, 
    onProgress?: (progress: number) => void
  ): Promise<{ publicUrl: string }> {
    // Convert blob to File for Supabase upload
    const file = new File([blob], path.split('/').pop() || 'selfie.jpg', {
      type: blob.type
    });

    // Note: Bucket existence is validated during upload - no need to pre-check

    // Real upload to Supabase Storage
    console.log('Uploading file to Supabase Storage:', { path, bucketName: this.BUCKET_NAME, fileSize: file.size, fileType: file.type });
    
    const { data, error } = await supabaseAdmin.storage
      .from(this.BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      // Log complete error object for debugging
      console.error('Upload error - Full object:', error);
      console.error('Upload error details:', {
        message: error?.message || 'No message',
        statusCode: error?.statusCode || 'No status code',
        status: error?.status || 'No status',
        path,
        bucketName: this.BUCKET_NAME,
        errorType: typeof error,
        errorCode: error?.error || 'No error code',
        details: error?.details || 'No details'
      });
      
      const errorMessage = error?.message || error?.toString() || 'Unknown upload error';
      
      // Provide specific error messages for common issues
      if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
        throw new Error(`STORAGE_ERROR: Storage bucket '${this.BUCKET_NAME}' not found. Please run storage migration (006_storage_setup.sql)`);
      }
      
      if (errorMessage.includes('row-level security') || errorMessage.includes('RLS')) {
        throw new Error(`AUTH_ERROR: Authentication required for selfie upload. Please log in first.`);
      }
      
      throw new Error(`UPLOAD_FAILED: ${errorMessage}`);
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabaseAdmin.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(path);
    
    onProgress?.(100);
    
    console.log('UPLOAD SUCCESS - returning public URL:', urlData.publicUrl);
    return { publicUrl: urlData.publicUrl };
  }

  /**
   * Delete uploaded file
   */
  async deleteFile(path: string): Promise<void> {
    const { error } = await supabaseAdmin.storage
      .from(this.BUCKET_NAME)
      .remove([path]);

    if (error) {
      throw new Error('STORAGE_ERROR');
    }
  }

  /**
   * Handle upload errors
   */
  private handleUploadError(error: Error): Error {
    // Preserve original error message for better debugging
    const originalMessage = error?.message || 'Unknown error';
    
    if (originalMessage.includes('network')) {
      return new Error(`NETWORK_ERROR: ${originalMessage}`);
    }
    
    if (originalMessage.includes('storage') || originalMessage.includes('bucket')) {
      return new Error(`STORAGE_ERROR: ${originalMessage}`);
    }

    if (originalMessage.includes('AUTH_ERROR') || originalMessage.includes('STORAGE_ERROR') || originalMessage.includes('UPLOAD_FAILED')) {
      // Already properly formatted, return as is
      return error;
    }

    return new Error(`UNKNOWN_ERROR: ${originalMessage}`);
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * SECURITY: Validate UUID format
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * SECURITY: Sanitize path components to prevent path traversal attacks
   */
  private sanitizePathComponent(component: string): string {
    // Remove dangerous characters and path traversal attempts
    return component
      .replace(/[^a-zA-Z0-9\-_.]/g, '') // Allow only safe characters
      .replace(/\.\./g, '') // Remove path traversal
      .replace(/\//g, '') // Remove directory separators
      .trim();
  }

  /**
   * Get upload error message in Thai
   */
  getUploadErrorMessage(error: UploadError): string {
    switch (error) {
      case 'NETWORK_ERROR':
        return 'เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย กรุณาลองใหม่อีกครั้ง';
      case 'STORAGE_ERROR':
        return 'เกิดข้อผิดพลาดในระบบจัดเก็บไฟล์ กรุณาติดต่อผู้ดูแลระบบ';
      case 'FILE_TOO_LARGE':
        return 'ขนาดไฟล์ใหญ่เกินไป (สูงสุด 2MB)';
      case 'INVALID_FILE_TYPE':
        return 'ประเภทไฟล์ไม่ถูกต้อง รองรับเฉพาะ JPEG และ PNG';
      case 'UPLOAD_FAILED':
        return 'อัปโหลดไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
      default:
        return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
    }
  }
}

// Singleton instance
export const uploadService = new UploadService();