import { createSupabaseClientSide } from '@/lib/supabase';
import { locationService } from './location.service';
import { uploadService } from './upload.service';
import type { TimeEntryDetail } from 'packages/database';

// Types for time entry operations
export interface CheckInRequest {
  branchId: string;
  latitude: number;
  longitude: number;
  selfieUrl: string;
}

export interface CheckOutRequest {
  latitude: number;
  longitude: number;
  selfieUrl: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  branchId: string;
  checkInTime: string;
  checkOutTime?: string;
  totalHours?: number;
  checkInSelfieUrl?: string;
  checkOutSelfieUrl?: string;
  branch?: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  };
}

export interface TimeEntryStatus {
  isCheckedIn: boolean;
  activeEntry?: {
    id: string;
    checkInTime: string;
    currentSessionHours: number;
    branch: {
      id: string;
      name: string;
      latitude: number;
      longitude: number;
    };
  };
  todayStats: {
    totalEntries: number;
    totalHours: number;
    completedSessions: TimeEntry[];
  };
}

export interface CheckInResponse {
  success: boolean;
  timeEntry: {
    id: string;
    checkInTime: string;
    branchId: string;
    branchName: string;
  };
  message: string;
}

export interface CheckOutResponse {
  success: boolean;
  timeEntry: {
    id: string;
    checkInTime: string;
    checkOutTime: string;
    totalHours: number;
    branchId: string;
    branchName: string;
  };
  message: string;
}

// Types for work history feature (Story 2.4)
export type DateRangeFilter = 'today' | 'week' | 'month';

export interface TimeEntryHistory extends TimeEntry {
  branch: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  };
}

export interface TimeEntryHistoryResponse {
  success: boolean;
  data: TimeEntryHistory[];
  dateRange: DateRangeFilter;
  totalCount: number;
  error?: string;
}

class TimeEntryService {
  private supabase = createSupabaseClientSide();

  /**
   * Check in employee at specified branch
   */
  async checkIn(request: CheckInRequest): Promise<CheckInResponse> {
    try {
      const response = await fetch('/api/employee/time-entries/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Check-in failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Check-in service error:', error);
      throw error;
    }
  }

  /**
   * Check out employee from current active session
   */
  async checkOut(request: CheckOutRequest): Promise<CheckOutResponse> {
    try {
      const response = await fetch('/api/employee/time-entries/check-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Check-out failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Check-out service error:', error);
      throw error;
    }
  }

  /**
   * Get current time entry status for employee
   */
  async getStatus(): Promise<TimeEntryStatus> {
    try {
      const response = await fetch('/api/employee/time-entries/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get status');
      }

      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error('Status service error:', error);
      throw error;
    }
  }

  /**
   * Get latest check-in branch for today (for daily sales reporting)
   */
  async getTodaysLatestCheckInBranch(): Promise<{
    success: boolean;
    data?: {
      branchId: string;
      branchName: string;
      checkInTime: string;
    };
    error?: string;
  }> {
    try {
      const response = await fetch('/api/employee/time-entries/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error || 'Failed to get check-in status'
        };
      }

      const data = await response.json();
      const status = data.status as TimeEntryStatus;

      // If there's an active entry, that's the latest check-in
      if (status.isCheckedIn && status.activeEntry) {
        return {
          success: true,
          data: {
            branchId: status.activeEntry.branch.id,
            branchName: status.activeEntry.branch.name,
            checkInTime: status.activeEntry.checkInTime
          }
        };
      }

      // Check today's entries for the latest check-in (even if checked out)
      if (status.todayStats.totalEntries > 0 && status.todayStats.completedSessions.length > 0) {
        // Find the most recent completed session
        const latestSession = status.todayStats.completedSessions
          .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime())[0];
        
        if (latestSession && latestSession.branch) {
          return {
            success: true,
            data: {
              branchId: latestSession.branch.id,
              branchName: latestSession.branch.name,
              checkInTime: latestSession.checkInTime
            }
          };
        }
      }

      return {
        success: false,
        error: 'กรุณาเช็คอินที่สาขาก่อนทำการรายงานยอดขาย'
      };

    } catch (error) {
      console.error('Get latest check-in branch error:', error);
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการตรวจสอบสถานะเช็คอิน'
      };
    }
  }

  /**
   * Get available branches for check-in based on current GPS location
   */
  async getAvailableBranches(): Promise<Array<{
    id: string;
    name: string;
    distance: number;
    canCheckIn: boolean;
  }>> {
    try {
      // Get user's current location
      const locationResult = await locationService.getCurrentPosition();
      
      if (!locationResult.success || !locationResult.data) {
        throw new Error(locationResult.error || 'ไม่สามารถระบุตำแหน่งได้');
      }

      const position = locationResult.data;
      
      // Call the available branches API with GPS coordinates
      const response = await fetch('/api/employee/available-branches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: position.latitude,
          longitude: position.longitude
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ไม่สามารถโหลดข้อมูลสาขาได้');
      }
      
      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error('ไม่สามารถโหลดข้อมูลสาขาได้');
      }
      
      // Map API response to expected format
      const branches = result.data.can_check_in_branches || [];
      return branches.map((branch: any) => ({
        id: branch.id,
        name: branch.name,
        distance: branch.distance || 0,
        canCheckIn: true // All branches in can_check_in_branches are valid
      }));

    } catch (error) {
      console.error('Available branches service error:', error);
      throw error;
    }
  }

  /**
   * Validate check-in requirements
   */
  async validateCheckIn(branchId: string, latitude: number, longitude: number): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Check if user already has active check-in
      const status = await this.getStatus();
      if (status.isCheckedIn) {
        errors.push('คุณมีการ check-in ที่ยังไม่ได้ check-out อยู่แล้ว');
      }

      // Validate GPS location
      const availableBranches = await this.getAvailableBranches();
      const selectedBranch = availableBranches.find(b => b.id === branchId);
      
      if (!selectedBranch) {
        errors.push('ไม่พบสาขาที่เลือก');
      } else if (!selectedBranch.canCheckIn) {
        errors.push(`คุณอยู่ห่างจากสาขา ${Math.round(selectedBranch.distance)} เมตร (อนุญาตสูงสุด 100 เมตร)`);
      }

      return {
        isValid: errors.length === 0,
        errors
      };

    } catch (error) {
      console.error('Check-in validation error:', error);
      return {
        isValid: false,
        errors: ['ไม่สามารถตรวจสอบข้อมูลได้ กรุณาลองใหม่']
      };
    }
  }

  /**
   * Validate check-out requirements
   */
  async validateCheckOut(latitude: number, longitude: number): Promise<{
    isValid: boolean;
    errors: string[];
    activeEntry?: TimeEntryStatus['activeEntry'];
  }> {
    const errors: string[] = [];

    try {
      // Check if user has active check-in
      const status = await this.getStatus();
      
      if (!status.isCheckedIn || !status.activeEntry) {
        errors.push('ไม่พบการ check-in ที่ยังไม่ได้ check-out');
        return {
          isValid: false,
          errors
        };
      }

      // Validate GPS location against check-in branch
      const distance = locationService.calculateDistanceBetweenPoints(
        { latitude, longitude },
        { 
          latitude: status.activeEntry.branch.latitude, 
          longitude: status.activeEntry.branch.longitude 
        }
      );

      if (distance > 100) {
        errors.push(`คุณอยู่ห่างจากสาขา ${Math.round(distance)} เมตร (อนุญาตสูงสุด 100 เมตร)`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        activeEntry: status.activeEntry
      };

    } catch (error) {
      console.error('Check-out validation error:', error);
      return {
        isValid: false,
        errors: ['ไม่สามารถตรวจสอบข้อมูลได้ กรุณาลองใหม่']
      };
    }
  }

  /**
   * Format time for display
   */
  formatWorkingHours(hours: number): string {
    if (typeof hours !== 'number' || isNaN(hours) || hours < 0) {
      return '0 ชั่วโมง';
    }
    
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    if (wholeHours === 0) {
      return `${minutes} นาที`;
    } else if (minutes === 0) {
      return `${wholeHours} ชั่วโมง`;
    } else {
      return `${wholeHours} ชั่วโมง ${minutes} นาที`;
    }
  }

  /**
   * Calculate recommended work type (hourly vs daily)
   */
  getWorkType(totalHours: number): 'hourly' | 'daily' {
    return totalHours <= 12 ? 'hourly' : 'daily';
  }

  /**
   * Complete check-in process with selfie upload
   */
  async checkInWithSelfie(
    branchId: string,
    latitude: number,
    longitude: number,
    selfieBlob: Blob,
    employeeId: string,
    onProgress?: (progress: number) => void
  ): Promise<CheckInResponse> {
    try {
      // Upload selfie first
      onProgress?.(0);
      const uploadResult = await uploadService.uploadSelfie(
        selfieBlob,
        employeeId,
        'checkin',
        {
          onProgress: (progress) => onProgress?.(progress * 0.8), // Reserve 20% for API call
          maxRetries: 3
        }
      );

      onProgress?.(80);

      // Perform check-in with selfie URL
      const checkInResult = await this.checkIn({
        branchId,
        latitude,
        longitude,
        selfieUrl: uploadResult.url
      });

      onProgress?.(100);
      return checkInResult;

    } catch (error) {
      console.error('Check-in with selfie error:', error);
      throw error;
    }
  }

  /**
   * Complete check-out process with selfie upload
   */
  async checkOutWithSelfie(
    latitude: number,
    longitude: number,
    selfieBlob: Blob,
    employeeId: string,
    onProgress?: (progress: number) => void
  ): Promise<CheckOutResponse> {
    try {
      // Upload selfie first
      onProgress?.(0);
      const uploadResult = await uploadService.uploadSelfie(
        selfieBlob,
        employeeId,
        'checkout',
        {
          onProgress: (progress) => onProgress?.(progress * 0.8), // Reserve 20% for API call
          maxRetries: 3
        }
      );

      onProgress?.(80);

      // Perform check-out with selfie URL
      const checkOutResult = await this.checkOut({
        latitude,
        longitude,
        selfieUrl: uploadResult.url
      });

      onProgress?.(100);
      return checkOutResult;

    } catch (error) {
      console.error('Check-out with selfie error:', error);
      throw error;
    }
  }

  /**
   * Validate and prepare check-in with selfie requirements
   */
  async validateCheckInWithSelfie(
    branchId: string,
    latitude: number,
    longitude: number,
    selfieBlob?: Blob
  ): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Validate basic check-in requirements
      const basicValidation = await this.validateCheckIn(branchId, latitude, longitude);
      if (!basicValidation.isValid) {
        errors.push(...basicValidation.errors);
      }

      // Validate selfie
      if (!selfieBlob) {
        errors.push('จำเป็นต้องมีรูปเซลฟี่สำหรับการ check-in');
      } else {
        // Check file size (2MB limit)
        if (selfieBlob.size > 2 * 1024 * 1024) {
          errors.push('รูปเซลฟี่มีขนาดใหญ่เกินไป (สูงสุด 2MB)');
        }

        // Check file type
        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(selfieBlob.type)) {
          errors.push('ประเภทไฟล์ไม่ถูกต้อง รองรับเฉพาะ JPEG และ PNG');
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      };

    } catch (error) {
      console.error('Check-in with selfie validation error:', error);
      return {
        isValid: false,
        errors: ['ไม่สามารถตรวจสอบข้อมูลได้ กรุณาลองใหม่']
      };
    }
  }

  /**
   * Get time entry history for employee (Story 2.4)
   */
  async getTimeEntryHistory(dateRange: DateRangeFilter = 'today'): Promise<TimeEntryHistoryResponse> {
    try {
      const response = await fetch(`/api/employee/time-entries/history?dateRange=${dateRange}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          data: [],
          dateRange,
          totalCount: 0,
          error: error.error || 'ไม่สามารถดึงประวัติการทำงานได้'
        };
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data || [],
        dateRange: result.dateRange,
        totalCount: result.totalCount || 0
      };

    } catch (error) {
      console.error('Get time entry history error:', error);
      return {
        success: false,
        data: [],
        dateRange,
        totalCount: 0,
        error: 'เกิดข้อผิดพลาดในการดึงประวัติการทำงาน'
      };
    }
  }

  /**
   * Get date range label in Thai for display
   */
  getDateRangeLabel(dateRange: DateRangeFilter): string {
    switch (dateRange) {
      case 'today':
        return 'วันนี้';
      case 'week':
        return '7 วันที่ผ่านมา';
      case 'month':
        return '30 วันที่ผ่านมา';
      default:
        return 'วันนี้';
    }
  }

  /**
   * Format date for display in Thai format
   */
  formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString);
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543; // Convert to Buddhist Era
    
    return `${day} ${month} ${year}`;
  }

  /**
   * Format time for display (24-hour format)
   */
  formatTimeForDisplay(dateTimeString: string): string {
    if (!dateTimeString) {
      return '--:--';
    }
    
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string provided to formatTimeForDisplay:', dateTimeString);
      return '--:--';
    }
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Get work status for display
   */
  getWorkStatus(checkOutTime?: string): 'กำลังทำงาน' | 'เสร็จสิ้น' {
    return checkOutTime ? 'เสร็จสิ้น' : 'กำลังทำงาน';
  }

  /**
   * Validate and prepare check-out with selfie requirements
   */
  async validateCheckOutWithSelfie(
    latitude: number,
    longitude: number,
    selfieBlob?: Blob
  ): Promise<{
    isValid: boolean;
    errors: string[];
    activeEntry?: TimeEntryStatus['activeEntry'];
  }> {
    const errors: string[] = [];

    try {
      // Validate basic check-out requirements
      const basicValidation = await this.validateCheckOut(latitude, longitude);
      if (!basicValidation.isValid) {
        errors.push(...basicValidation.errors);
      }

      // Validate selfie
      if (!selfieBlob) {
        errors.push('จำเป็นต้องมีรูปเซลฟี่สำหรับการ check-out');
      } else {
        // Check file size (2MB limit)
        if (selfieBlob.size > 2 * 1024 * 1024) {
          errors.push('รูปเซลฟี่มีขนาดใหญ่เกินไป (สูงสุด 2MB)');
        }

        // Check file type
        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(selfieBlob.type)) {
          errors.push('ประเภทไฟล์ไม่ถูกต้อง รองรับเฉพาะ JPEG และ PNG');
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        activeEntry: basicValidation.activeEntry
      };

    } catch (error) {
      console.error('Check-out with selfie validation error:', error);
      return {
        isValid: false,
        errors: ['ไม่สามารถตรวจสอบข้อมูลได้ กรุณาลองใหม่'],
        activeEntry: undefined
      };
    }
  }

  /**
   * Get time entry detail for modal display (Story 5.1)
   */
  async getTimeEntryDetail(id: string): Promise<{
    success: boolean;
    data?: TimeEntryDetail;
    error?: string;
  }> {
    try {
      const response = await fetch(`/api/employee/time-entries/${id}/detail`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error || 'ไม่สามารถดึงรายละเอียดการทำงานได้'
        };
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data
      };

    } catch (error) {
      console.error('Get time entry detail error:', error);
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงรายละเอียดการทำงาน'
      };
    }
  }

  /**
   * Optimize selfie image URL for display (Story 5.1)
   */
  optimizeSelfieUrl(url: string, size: 'small' | 'medium' | 'large' = 'medium'): string | null {
    if (!url || url.trim() === '') return null;
    
    // If it's already a Supabase Storage URL, add transformation parameters
    if (url.includes('supabase')) {
      const sizeParams = {
        small: 'width=150&height=150',
        medium: 'width=300&height=300', 
        large: 'width=600&height=600'
      };
      
      // Add transform parameters to Supabase URL
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}${sizeParams[size]}&quality=80`;
    }
    
    // Return original URL if not Supabase Storage
    return url;
  }

  /**
   * Calculate distance from branch for check-in location (Story 5.1)
   */
  calculateDistanceFromBranch(
    checkInLocation: { latitude: number; longitude: number },
    branchLocation: { latitude: number; longitude: number }
  ): number {
    return locationService.calculateDistanceBetweenPoints(
      checkInLocation,
      branchLocation
    );
  }

  /**
   * Format selfie alt text for accessibility (Story 5.1)
   */
  formatSelfieAltText(type: 'check-in' | 'check-out', employeeName?: string, branchName?: string): string {
    const typeText = type === 'check-in' ? 'เช็คอิน' : 'เช็คเอาท์';
    const employee = employeeName || 'พนักงาน';
    const branch = branchName || 'สาขา';
    
    return `รูปเซลฟี่${typeText}ของ${employee}ที่${branch}`;
  }

  /**
   * Check if image failed to load and provide fallback (Story 5.1)
   */
  handleImageError(url: string): string {
    console.warn('Failed to load selfie image:', url);
    return '/placeholder-selfie.svg';
  }

  /**
   * Format distance for display (Story 5.2)
   */
  formatDistanceForDisplay(distance: number): string {
    if (distance < 1000) {
      return `${Math.round(distance)} เมตร`;
    } else {
      return `${(distance / 1000).toFixed(2)} กิโลเมตร`;
    }
  }

  /**
   * Validate GPS coordinates format and range (Story 5.2)
   */
  validateGPSCoordinates(latitude: number, longitude: number): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Latitude validation (-90 to 90)
    if (typeof latitude !== 'number' || isNaN(latitude)) {
      errors.push('Latitude must be a valid number');
    } else if (latitude < -90 || latitude > 90) {
      errors.push('Latitude must be between -90 and 90 degrees');
    }

    // Longitude validation (-180 to 180)
    if (typeof longitude !== 'number' || isNaN(longitude)) {
      errors.push('Longitude must be a valid number');
    } else if (longitude < -180 || longitude > 180) {
      errors.push('Longitude must be between -180 and 180 degrees');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format GPS coordinates for display (Story 5.2)
   */
  formatGPSCoordinatesForDisplay(latitude: number, longitude: number): string {
    const lat = Math.abs(latitude).toFixed(6);
    const lng = Math.abs(longitude).toFixed(6);
    const latDir = latitude >= 0 ? 'N' : 'S';
    const lngDir = longitude >= 0 ? 'E' : 'W';
    
    return `${lat}°${latDir}, ${lng}°${lngDir}`;
  }
}

export const timeEntryService = new TimeEntryService();