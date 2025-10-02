import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UploadService } from '@/lib/services/upload.service';

// Mock Supabase
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockRemove = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: mockRemove,
      })),
    },
  },
}));

describe('UploadService', () => {
  let uploadService: UploadService;
  const mockEmployeeId = 'emp-123';
  const mockBlob = new Blob(['test image data'], { type: 'image/jpeg' });

  beforeEach(() => {
    uploadService = new UploadService();
    
    // Set blob size
    Object.defineProperty(mockBlob, 'size', { value: 1024 }); // 1KB
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadSelfie', () => {
    beforeEach(() => {
      mockUpload.mockResolvedValue({ 
        data: { path: 'test-path' }, 
        error: null 
      });
      
      mockGetPublicUrl.mockReturnValue({ 
        data: { publicUrl: 'https://example.com/test-path' } 
      });
    });

    it('should successfully upload selfie for check-in', async () => {
      const result = await uploadService.uploadSelfie(mockBlob, mockEmployeeId, 'checkin');

      expect(result.url).toBe('https://example.com/test-path');
      expect(result.size).toBe(1024);
      expect(result.path).toMatch(/\d{4}\/\d{2}\/emp-123\/checkin_images\/emp-123_\d{8}_\d{6}_checkin\.jpg/);
    });

    it('should successfully upload selfie for check-out', async () => {
      const result = await uploadService.uploadSelfie(mockBlob, mockEmployeeId, 'checkout');

      expect(result.url).toBe('https://example.com/test-path');
      expect(result.path).toMatch(/checkout_images\/emp-123_\d{8}_\d{6}_checkout\.jpg/);
    });

    it('should call upload with correct parameters', async () => {
      await uploadService.uploadSelfie(mockBlob, mockEmployeeId, 'checkin');

      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}\/\d{2}\/emp-123\/checkin_images\/emp-123_\d{8}_\d{6}_checkin\.jpg/),
        expect.any(File),
        {
          cacheControl: '3600',
          upsert: false
        }
      );
    });

    it('should validate file size and reject large files', async () => {
      const largeBlob = new Blob(['large file'], { type: 'image/jpeg' });
      Object.defineProperty(largeBlob, 'size', { value: 3 * 1024 * 1024 }); // 3MB

      await expect(uploadService.uploadSelfie(largeBlob, mockEmployeeId, 'checkin'))
        .rejects.toThrow('FILE_TOO_LARGE');
    });

    it('should validate file type and reject invalid types', async () => {
      const invalidBlob = new Blob(['test'], { type: 'text/plain' });

      await expect(uploadService.uploadSelfie(invalidBlob, mockEmployeeId, 'checkin'))
        .rejects.toThrow('INVALID_FILE_TYPE');
    });

    it('should retry on upload failure', async () => {
      mockUpload
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ data: { path: 'test-path' }, error: null });

      const onRetry = vi.fn();
      
      const result = await uploadService.uploadSelfie(
        mockBlob, 
        mockEmployeeId, 
        'checkin',
        { onRetry }
      );

      expect(mockUpload).toHaveBeenCalledTimes(3);
      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(result.url).toBe('https://example.com/test-path');
    });

    it('should fail after max retries exceeded', async () => {
      mockUpload.mockRejectedValue(new Error('Persistent error'));

      await expect(uploadService.uploadSelfie(
        mockBlob, 
        mockEmployeeId, 
        'checkin',
        { maxRetries: 2 }
      )).rejects.toThrow('UPLOAD_FAILED');

      expect(mockUpload).toHaveBeenCalledTimes(2);
    });

    it('should call progress callback', async () => {
      const onProgress = vi.fn();
      
      await uploadService.uploadSelfie(
        mockBlob, 
        mockEmployeeId, 
        'checkin',
        { onProgress }
      );

      expect(onProgress).toHaveBeenCalledWith(100);
    });

    it('should handle Supabase upload error', async () => {
      mockUpload.mockResolvedValue({ 
        data: null, 
        error: { message: 'Storage error' } 
      });

      await expect(uploadService.uploadSelfie(mockBlob, mockEmployeeId, 'checkin'))
        .rejects.toThrow('STORAGE_ERROR');
    });
  });

  describe('deleteFile', () => {
    it('should successfully delete file', async () => {
      mockRemove.mockResolvedValue({ error: null });

      await expect(uploadService.deleteFile('test-path')).resolves.not.toThrow();
      expect(mockRemove).toHaveBeenCalledWith(['test-path']);
    });

    it('should throw error on delete failure', async () => {
      mockRemove.mockResolvedValue({ error: { message: 'Delete failed' } });

      await expect(uploadService.deleteFile('test-path'))
        .rejects.toThrow('STORAGE_ERROR');
    });
  });

  describe('getUploadErrorMessage', () => {
    it('should return correct Thai messages for each error type', () => {
      expect(uploadService.getUploadErrorMessage('NETWORK_ERROR'))
        .toBe('เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย กรุณาลองใหม่อีกครั้ง');
      
      expect(uploadService.getUploadErrorMessage('STORAGE_ERROR'))
        .toBe('เกิดข้อผิดพลาดในระบบจัดเก็บไฟล์ กรุณาติดต่อผู้ดูแลระบบ');
      
      expect(uploadService.getUploadErrorMessage('FILE_TOO_LARGE'))
        .toBe('ขนาดไฟล์ใหญ่เกินไป (สูงสุด 2MB)');
      
      expect(uploadService.getUploadErrorMessage('INVALID_FILE_TYPE'))
        .toBe('ประเภทไฟล์ไม่ถูกต้อง รองรับเฉพาะ JPEG และ PNG');
      
      expect(uploadService.getUploadErrorMessage('UPLOAD_FAILED'))
        .toBe('อัปโหลดไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      
      expect(uploadService.getUploadErrorMessage('UNKNOWN_ERROR'))
        .toBe('เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
    });
  });

  describe('private methods', () => {
    it('should generate correct filename format', () => {
      const filename = (uploadService as any).generateFilename(mockEmployeeId, 'checkin');
      
      expect(filename).toMatch(/^emp-123_\d{8}_\d{6}_checkin\.jpg$/);
    });

    it('should generate correct file path structure', () => {
      const path = (uploadService as any).generateFilePath(
        mockEmployeeId, 
        'checkin', 
        'test-filename.jpg'
      );
      
      expect(path).toMatch(/^\d{4}\/\d{2}\/emp-123\/checkin_images\/test-filename\.jpg$/);
    });

    it('should handle upload errors correctly', () => {
      const networkError = new Error('network timeout');
      const storageError = new Error('bucket not found');
      const unknownError = new Error('something else');

      expect((uploadService as any).handleUploadError(networkError).message)
        .toBe('NETWORK_ERROR');
      
      expect((uploadService as any).handleUploadError(storageError).message)
        .toBe('STORAGE_ERROR');
      
      expect((uploadService as any).handleUploadError(unknownError).message)
        .toBe('UNKNOWN_ERROR');
    });
  });
});