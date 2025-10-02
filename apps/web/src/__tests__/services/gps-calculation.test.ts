import { timeEntryService } from '@/lib/services/time-entry.service';
import { locationService } from '@/lib/services/location.service';
import { vi } from 'vitest';

// Mock location service
vi.mock('@/lib/services/location.service', () => ({
  locationService: {
    calculateDistanceBetweenPoints: vi.fn(),
  },
}));

// Mock supabase to prevent import errors
vi.mock('@/lib/supabase', () => ({
  createSupabaseClientSide: vi.fn(() => ({
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  })),
}));

const mockLocationService = vi.mocked(locationService);

describe('Time Entry Service GPS Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateDistanceFromBranch', () => {
    it('should call locationService with correct parameters', () => {
      const checkInLocation = { latitude: 13.7563, longitude: 100.5018 };
      const branchLocation = { latitude: 13.7555, longitude: 100.5015 };
      
      mockLocationService.calculateDistanceBetweenPoints.mockReturnValue(95.5);

      const result = timeEntryService.calculateDistanceFromBranch(checkInLocation, branchLocation);

      expect(mockLocationService.calculateDistanceBetweenPoints).toHaveBeenCalledWith(
        checkInLocation,
        branchLocation
      );
      expect(result).toBe(95.5);
    });

    it('should handle decimal coordinate values correctly', () => {
      const checkInLocation = { latitude: 13.123456789, longitude: 100.987654321 };
      const branchLocation = { latitude: 13.111111111, longitude: 100.999999999 };
      
      mockLocationService.calculateDistanceBetweenPoints.mockReturnValue(1234.5678);

      const result = timeEntryService.calculateDistanceFromBranch(checkInLocation, branchLocation);

      expect(result).toBe(1234.5678);
    });
  });

  describe('formatDistanceForDisplay', () => {
    it('should format distance in meters for values < 1000', () => {
      expect(timeEntryService.formatDistanceForDisplay(0)).toBe('0 เมตร');
      expect(timeEntryService.formatDistanceForDisplay(50.7)).toBe('51 เมตร');
      expect(timeEntryService.formatDistanceForDisplay(999.9)).toBe('1000 เมตร');
      expect(timeEntryService.formatDistanceForDisplay(150)).toBe('150 เมตร');
    });

    it('should format distance in kilometers for values >= 1000', () => {
      expect(timeEntryService.formatDistanceForDisplay(1000)).toBe('1.00 กิโลเมตร');
      expect(timeEntryService.formatDistanceForDisplay(1500)).toBe('1.50 กิโลเมตร');
      expect(timeEntryService.formatDistanceForDisplay(2345.67)).toBe('2.35 กิโลเมตร');
      expect(timeEntryService.formatDistanceForDisplay(10000)).toBe('10.00 กิโลเมตร');
    });

    it('should handle edge cases', () => {
      expect(timeEntryService.formatDistanceForDisplay(999.4)).toBe('999 เมตร');
      expect(timeEntryService.formatDistanceForDisplay(999.5)).toBe('1000 เมตร');
      expect(timeEntryService.formatDistanceForDisplay(1000.001)).toBe('1.00 กิโลเมตร');
    });
  });

  describe('validateGPSCoordinates', () => {
    it('should validate correct GPS coordinates', () => {
      const validCases = [
        { lat: 0, lng: 0 },
        { lat: 90, lng: 180 },
        { lat: -90, lng: -180 },
        { lat: 13.7563, lng: 100.5018 }, // Bangkok coordinates
        { lat: 45.123456, lng: -122.654321 }, // Portland coordinates
      ];

      validCases.forEach(({ lat, lng }) => {
        const result = timeEntryService.validateGPSCoordinates(lat, lng);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid latitude values', () => {
      const invalidLatCases = [
        { lat: 91, lng: 0, expectedError: 'Latitude must be between -90 and 90 degrees' },
        { lat: -91, lng: 0, expectedError: 'Latitude must be between -90 and 90 degrees' },
        { lat: NaN, lng: 0, expectedError: 'Latitude must be a valid number' },
      ];

      invalidLatCases.forEach(({ lat, lng, expectedError }) => {
        const result = timeEntryService.validateGPSCoordinates(lat, lng);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(expectedError);
      });
    });

    it('should reject invalid longitude values', () => {
      const invalidLngCases = [
        { lat: 0, lng: 181, expectedError: 'Longitude must be between -180 and 180 degrees' },
        { lat: 0, lng: -181, expectedError: 'Longitude must be between -180 and 180 degrees' },
        { lat: 0, lng: NaN, expectedError: 'Longitude must be a valid number' },
      ];

      invalidLngCases.forEach(({ lat, lng, expectedError }) => {
        const result = timeEntryService.validateGPSCoordinates(lat, lng);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(expectedError);
      });
    });

    it('should handle multiple validation errors', () => {
      const result = timeEntryService.validateGPSCoordinates(100, 200);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('Latitude must be between -90 and 90 degrees');
      expect(result.errors).toContain('Longitude must be between -180 and 180 degrees');
    });

    it('should handle non-number inputs', () => {
      const result = timeEntryService.validateGPSCoordinates('invalid' as any, 'invalid' as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('Latitude must be a valid number');
      expect(result.errors).toContain('Longitude must be a valid number');
    });
  });

  describe('formatGPSCoordinatesForDisplay', () => {
    it('should format positive coordinates correctly', () => {
      expect(timeEntryService.formatGPSCoordinatesForDisplay(13.7563, 100.5018)).toBe('13.756300°N, 100.501800°E');
      expect(timeEntryService.formatGPSCoordinatesForDisplay(45.123456, 122.654321)).toBe('45.123456°N, 122.654321°E');
    });

    it('should format negative coordinates correctly', () => {
      expect(timeEntryService.formatGPSCoordinatesForDisplay(-34.6037, -58.3816)).toBe('34.603700°S, 58.381600°W');
      expect(timeEntryService.formatGPSCoordinatesForDisplay(-45.123456, -122.654321)).toBe('45.123456°S, 122.654321°W');
    });

    it('should handle zero coordinates', () => {
      expect(timeEntryService.formatGPSCoordinatesForDisplay(0, 0)).toBe('0.000000°N, 0.000000°E');
      expect(timeEntryService.formatGPSCoordinatesForDisplay(0, -1)).toBe('0.000000°N, 1.000000°W');
      expect(timeEntryService.formatGPSCoordinatesForDisplay(-1, 0)).toBe('1.000000°S, 0.000000°E');
    });

    it('should handle mixed sign coordinates', () => {
      expect(timeEntryService.formatGPSCoordinatesForDisplay(13.7563, -100.5018)).toBe('13.756300°N, 100.501800°W');
      expect(timeEntryService.formatGPSCoordinatesForDisplay(-13.7563, 100.5018)).toBe('13.756300°S, 100.501800°E');
    });

    it('should format coordinates with 6 decimal places', () => {
      expect(timeEntryService.formatGPSCoordinatesForDisplay(1.1, 2.2)).toBe('1.100000°N, 2.200000°E');
      expect(timeEntryService.formatGPSCoordinatesForDisplay(1.123, 2.456)).toBe('1.123000°N, 2.456000°E');
    });
  });
});

describe('GPS Calculation Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Distance Calculation Workflow', () => {
    it('should calculate distance and format it correctly', () => {
      const checkInLocation = { latitude: 13.7563, longitude: 100.5018 };
      const branchLocation = { latitude: 13.7555, longitude: 100.5015 };
      
      // Mock distance calculation result (95.5 meters)
      mockLocationService.calculateDistanceBetweenPoints.mockReturnValue(95.5);

      const distance = timeEntryService.calculateDistanceFromBranch(checkInLocation, branchLocation);
      const formattedDistance = timeEntryService.formatDistanceForDisplay(distance);

      expect(distance).toBe(95.5);
      expect(formattedDistance).toBe('96 เมตร');
    });

    it('should handle long distances correctly', () => {
      const checkInLocation = { latitude: 13.7563, longitude: 100.5018 }; // Bangkok
      const branchLocation = { latitude: 18.7061, longitude: 98.9817 }; // Chiang Mai
      
      // Mock distance calculation result (approximately 600 km)
      mockLocationService.calculateDistanceBetweenPoints.mockReturnValue(600000);

      const distance = timeEntryService.calculateDistanceFromBranch(checkInLocation, branchLocation);
      const formattedDistance = timeEntryService.formatDistanceForDisplay(distance);

      expect(distance).toBe(600000);
      expect(formattedDistance).toBe('600.00 กิโลเมตร');
    });

    it('should validate and format coordinates correctly', () => {
      const lat = 13.7563;
      const lng = 100.5018;

      const validation = timeEntryService.validateGPSCoordinates(lat, lng);
      const formatted = timeEntryService.formatGPSCoordinatesForDisplay(lat, lng);

      expect(validation.isValid).toBe(true);
      expect(formatted).toBe('13.756300°N, 100.501800°E');
    });
  });

  describe('Error Handling Workflow', () => {
    it('should handle invalid coordinates in complete workflow', () => {
      const invalidLat = 100; // Invalid latitude
      const invalidLng = 200; // Invalid longitude

      const validation = timeEntryService.validateGPSCoordinates(invalidLat, invalidLng);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(2);

      // Should not call distance calculation for invalid coordinates
      expect(mockLocationService.calculateDistanceBetweenPoints).not.toHaveBeenCalled();
    });

    it('should handle edge case coordinates', () => {
      const edgeCases = [
        { lat: 90, lng: 180 },   // North Pole, International Date Line
        { lat: -90, lng: -180 }, // South Pole, International Date Line
        { lat: 0, lng: 0 },      // Equator, Prime Meridian
      ];

      edgeCases.forEach(({ lat, lng }) => {
        const validation = timeEntryService.validateGPSCoordinates(lat, lng);
        const formatted = timeEntryService.formatGPSCoordinatesForDisplay(lat, lng);

        expect(validation.isValid).toBe(true);
        expect(formatted).toContain('°');
        expect(formatted).toMatch(/[NSEW]/);
      });
    });
  });
});