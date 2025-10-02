// Test data สำหรับ CheckInOutCard component

export const TEST_DATA = {
  // Employee data
  EMPLOYEES: {
    VALID: 'employee-123',
    INVALID: null,
    MISSING: undefined,
  },

  // Branch data
  BRANCHES: {
    CENTRAL_WORLD: {
      id: 'branch-1',
      name: 'สาขาเซ็นทรัลเวิลด์',
      latitude: 13.7563,
      longitude: 100.5018,
    },
    SIAM_PARAGON: {
      id: 'branch-2',
      name: 'สาขาสยามพารากอน',
      latitude: 13.7307,
      longitude: 100.5232,
    },
    TERMINAL_21: {
      id: 'branch-3',
      name: 'สาขาเทอร์มินอล 21',
      latitude: 13.7295,
      longitude: 100.5239,
    },
  },

  // Geolocation data
  GEOLOCATION: {
    BANGKOK_CENTER: {
      latitude: 13.7563,
      longitude: 100.5018,
      accuracy: 10,
    },
    BANGKOK_ACCURATE: {
      latitude: 13.7563,
      longitude: 100.5018,
      accuracy: 5,
    },
    BANGKOK_INACCURATE: {
      latitude: 13.7563,
      longitude: 100.5018,
      accuracy: 1000,
    },
    INVALID_COORDINATES: {
      latitude: 0,
      longitude: 0,
      accuracy: 10,
    },
    NULL_COORDINATES: {
      latitude: null,
      longitude: null,
      accuracy: 10,
    },
  },

  // Time entry status
  TIME_ENTRY_STATUS: {
    NOT_CHECKED_IN: {
      isCheckedIn: false,
      activeEntry: null,
      lastEntry: null,
    },
    CHECKED_IN_SHORT: {
      isCheckedIn: true,
      activeEntry: {
        id: 'entry-123',
        checkInTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        branchId: 'branch-1',
        branchName: 'สาขาเซ็นทรัลเวิลด์',
      },
      lastEntry: null,
    },
    CHECKED_IN_NORMAL: {
      isCheckedIn: true,
      activeEntry: {
        id: 'entry-123',
        checkInTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
        branchId: 'branch-1',
        branchName: 'สาขาเซ็นทรัลเวิลด์',
      },
      lastEntry: null,
    },
    CHECKED_IN_LONG: {
      isCheckedIn: true,
      activeEntry: {
        id: 'entry-123',
        checkInTime: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString(), // 13 hours ago
        branchId: 'branch-1',
        branchName: 'สาขาเซ็นทรัลเวิลด์',
      },
      lastEntry: null,
    },
  },

  // API responses
  API_RESPONSES: {
    CHECK_IN_SUCCESS: {
      message: 'เช็คอินสำเร็จ',
      entryId: 'entry-123',
      checkInTime: new Date().toISOString(),
      branchId: 'branch-1',
      branchName: 'สาขาเซ็นทรัลเวิลด์',
    },
    CHECK_OUT_SUCCESS: {
      message: 'เช็คเอาท์สำเร็จ',
      entryId: 'entry-123',
      checkOutTime: new Date().toISOString(),
      workingHours: 8.5,
    },
    CHECK_IN_ERROR: {
      error: 'Network connection failed',
      message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
    },
    CHECK_OUT_ERROR: {
      error: 'Upload failed',
      message: 'ไม่สามารถอัพโหลดรูปภาพได้',
    },
  },

  // Error messages
  ERROR_MESSAGES: {
    GEOLOCATION_PERMISSION_DENIED: 'กรุณาอนุญาตการเข้าถึงตำแหน่งในเบราว์เซอร์',
    GEOLOCATION_POSITION_UNAVAILABLE: 'ไม่สามารถระบุตำแหน่งได้ กรุณาตรวจสอบ GPS และลองใหม่อีกครั้ง',
    GEOLOCATION_TIMEOUT: 'หมดเวลาการค้นหาตำแหน่ง กรุณาลองใหม่อีกครั้ง',
    NETWORK_ERROR: 'ปัญหาการเชื่อมต่อเครือข่าย กรุณาตรวจสอบอินเทอร์เน็ต',
    UPLOAD_ERROR: 'ไม่สามารถอัพโหลดรูปภาพได้ กรุณาตรวจสอบการเชื่อมต่อ',
    SERVICE_ERROR: 'เกิดข้อผิดพลาดในการบันทึกเวลา',
    MISSING_DATA: 'ข้อมูลไม่ครบถ้วน',
  },

  // Success messages
  SUCCESS_MESSAGES: {
    CHECK_IN: 'เช็คอินสำเร็จ',
    CHECK_OUT: 'เช็คเอาท์สำเร็จ',
    UPLOAD_SUCCESS: 'อัพโหลดรูปภาพสำเร็จ',
  },

  // Confirmation messages
  CONFIRMATION_MESSAGES: {
    SHORT_WORK_TITLE: 'เช็คเอาท์ก่อนเวลา?',
    SHORT_WORK_DESCRIPTION: 'คุณทำงานน้อยกว่า 2 ชั่วโมง คุณแน่ใจหรือไม่ว่าต้องการเช็คเอาท์?',
    LONG_WORK_TITLE: 'เช็คเอาท์หลังทำงานนาน?',
    LONG_WORK_DESCRIPTION: 'คุณทำงานเกิน 12 ชั่วโมงแล้ว ควรพักผ่อน คุณแน่ใจหรือไม่ว่าพร้อมเช็คเอาท์?',
  },

  // Step data
  STEPS: {
    CHECK_IN: [
      { id: 'branch', title: 'เลือกสาขา', description: 'เลือกสาขาที่ต้องการเช็คอิน' },
      { id: 'selfie', title: 'ถ่าย Selfie', description: 'ถ่ายรูปยืนยันตัวตน' },
      { id: 'confirm', title: 'ยืนยัน', description: 'บันทึกเวลาเข้างาน' },
    ],
    CHECK_OUT: [
      { id: 'selfie', title: 'ถ่าย Selfie', description: 'ถ่ายรูปยืนยันตัวตน' },
      { id: 'confirm', title: 'ยืนยัน', description: 'บันทึกเวลาออกงาน' },
    ],
  },

  // Test images
  IMAGES: {
    VALID_SELFIE: 'https://example.com/selfie.jpg',
    INVALID_SELFIE: 'invalid-url',
    LARGE_SELFIE: 'data:image/jpeg;base64,' + 'x'.repeat(10000000), // 10MB
  },

  // Network status
  NETWORK: {
    ONLINE: true,
    OFFLINE: false,
  },

  // Timeouts
  TIMEOUTS: {
    GEOLOCATION: 15000,
    API_REQUEST: 30000,
    AUTO_HIDE_MESSAGE: 5000,
  },
};

// Helper functions สำหรับสร้าง test data
export const createTestData = {
  // สร้าง mock geolocation position
  geolocationPosition: (overrides = {}) => ({
    coords: {
      latitude: 13.7563,
      longitude: 100.5018,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      ...overrides.coords,
    },
    timestamp: Date.now(),
    ...overrides,
  }),

  // สร้าง mock time entry status
  timeEntryStatus: (overrides = {}) => ({
    isCheckedIn: false,
    activeEntry: null,
    lastEntry: null,
    ...overrides,
  }),

  // สร้าง mock check in request
  checkInRequest: (overrides = {}) => ({
    branchId: 'branch-1',
    latitude: 13.7563,
    longitude: 100.5018,
    selfieUrl: 'https://example.com/selfie.jpg',
    ...overrides,
  }),

  // สร้าง mock check out request
  checkOutRequest: (overrides = {}) => ({
    latitude: 13.7563,
    longitude: 100.5018,
    selfieUrl: 'https://example.com/selfie.jpg',
    ...overrides,
  }),

  // สร้าง mock API response
  apiResponse: (overrides = {}) => ({
    message: 'ดำเนินการสำเร็จ',
    ...overrides,
  }),

  // สร้าง mock error
  error: (message = 'เกิดข้อผิดพลาด', code = 'UNKNOWN_ERROR') => ({
    message,
    code,
    name: 'TestError',
  }),
};

// Test scenarios
export const TEST_SCENARIOS = {
  // Happy path scenarios
  HAPPY_PATH: {
    CHECK_IN_SUCCESS: 'check-in-success',
    CHECK_OUT_SUCCESS: 'check-out-success',
    NORMAL_WORKING_HOURS: 'normal-working-hours',
  },

  // Error scenarios
  ERROR_SCENARIOS: {
    GEOLOCATION_PERMISSION_DENIED: 'geolocation-permission-denied',
    GEOLOCATION_TIMEOUT: 'geolocation-timeout',
    NETWORK_ERROR: 'network-error',
    SERVICE_ERROR: 'service-error',
    UPLOAD_ERROR: 'upload-error',
  },

  // Edge cases
  EDGE_CASES: {
    SHORT_WORKING_HOURS: 'short-working-hours',
    LONG_WORKING_HOURS: 'long-working-hours',
    OFFLINE_MODE: 'offline-mode',
    INVALID_COORDINATES: 'invalid-coordinates',
    LARGE_IMAGE: 'large-image',
  },

  // User interactions
  USER_INTERACTIONS: {
    CANCEL_BRANCH_SELECTION: 'cancel-branch-selection',
    CANCEL_SELFIE_CAPTURE: 'cancel-selfie-capture',
    CANCEL_CONFIRMATION: 'cancel-confirmation',
    RETRY_GPS: 'retry-gps',
    RETRY_CAMERA: 'retry-camera',
  },
};

export default TEST_DATA;
