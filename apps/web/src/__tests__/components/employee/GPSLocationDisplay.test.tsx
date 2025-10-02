import React from 'react';
import { render, screen } from '@testing-library/react';
import { GPSLocationDisplay } from '@/components/employee/GPSLocationDisplay';
import { timeEntryService } from '@/lib/services/time-entry.service';
import { vi } from 'vitest';

// Mock the time entry service
vi.mock('@/lib/services/time-entry.service', () => ({
  timeEntryService: {
    calculateDistanceFromBranch: vi.fn(),
  },
}));

// Mock supabase to prevent import errors
vi.mock('@/lib/supabase', () => ({
  createSupabaseClientSide: vi.fn(() => ({
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  })),
}));

const mockTimeEntryService = vi.mocked(timeEntryService);

describe('GPSLocationDisplay Component', () => {
  const defaultProps = {
    checkInLocation: {
      latitude: 13.7563,
      longitude: 100.5018,
      distance_from_branch: 95.5,
    },
    branchLocation: {
      latitude: 13.7555,
      longitude: 100.5015,
    },
    branchName: 'สาขาเซ็นทรัล',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render GPS location information correctly', () => {
      render(<GPSLocationDisplay {...defaultProps} />);

      // Check header
      expect(screen.getByText('ตำแหน่ง GPS ณ เวลาเช็คอิน')).toBeInTheDocument();

      // Check distance information
      expect(screen.getByText(/ระยะห่างจากสาขาเซ็นทรัล:/)).toBeInTheDocument();
      expect(screen.getByText('96 เมตร')).toBeInTheDocument();
      expect(screen.getByText('อยู่ในรัศมี')).toBeInTheDocument();
    });

    it('should display coordinates with correct formatting', () => {
      render(<GPSLocationDisplay {...defaultProps} />);

      // Check check-in coordinates
      expect(screen.getByText('ตำแหน่งเช็คอิน')).toBeInTheDocument();
      expect(screen.getByText('13.756300° N')).toBeInTheDocument();
      expect(screen.getByText('100.501800° E')).toBeInTheDocument();

      // Check branch coordinates  
      expect(screen.getByText('ตำแหน่งสาขา')).toBeInTheDocument();
      expect(screen.getByText('13.755500° N')).toBeInTheDocument();
      expect(screen.getByText('100.501500° E')).toBeInTheDocument();
    });

    it('should show Google Maps links', () => {
      render(<GPSLocationDisplay {...defaultProps} />);

      const checkInMapLink = screen.getByText('ดูตำแหน่งเช็คอินใน Google Maps');
      const branchMapLink = screen.getByText('ดูตำแหน่งสาขาใน Google Maps');

      expect(checkInMapLink.closest('a')).toHaveAttribute(
        'href',
        'https://www.google.com/maps?q=13.7563,100.5018'
      );
      expect(branchMapLink.closest('a')).toHaveAttribute(
        'href',
        'https://www.google.com/maps?q=13.7555,100.5015'
      );
    });

    it('should display range policy notice', () => {
      render(<GPSLocationDisplay {...defaultProps} />);

      expect(screen.getByText('นโยบายระยะห่าง:')).toBeInTheDocument();
      expect(screen.getByText(/พนักงานสามารถเช็คอิน\/เช็คเอาท์ได้เมื่ออยู่ในรัศมี 100 เมตร/)).toBeInTheDocument();
    });
  });

  describe('Distance Calculation', () => {
    it('should use provided distance_from_branch when available', () => {
      render(<GPSLocationDisplay {...defaultProps} />);

      expect(screen.getByText('96 เมตร')).toBeInTheDocument();
      expect(mockTimeEntryService.calculateDistanceFromBranch).not.toHaveBeenCalled();
    });

    it('should calculate distance when distance_from_branch is not provided', () => {
      const propsWithoutDistance = {
        ...defaultProps,
        checkInLocation: {
          latitude: 13.7563,
          longitude: 100.5018,
          // No distance_from_branch provided
        },
      };

      mockTimeEntryService.calculateDistanceFromBranch.mockReturnValue(105.3);

      render(<GPSLocationDisplay {...propsWithoutDistance} />);

      expect(mockTimeEntryService.calculateDistanceFromBranch).toHaveBeenCalledWith(
        { latitude: 13.7563, longitude: 100.5018 },
        { latitude: 13.7555, longitude: 100.5015 }
      );
      expect(screen.getByText('105 เมตร')).toBeInTheDocument();
    });
  });

  describe('Distance Display and Status', () => {
    it('should show "อยู่ในรัศมี" status for distance <= 100 meters', () => {
      const propsWithinRange = {
        ...defaultProps,
        checkInLocation: {
          ...defaultProps.checkInLocation,
          distance_from_branch: 50,
        },
      };

      render(<GPSLocationDisplay {...propsWithinRange} />);

      expect(screen.getByText('50 เมตร')).toBeInTheDocument();
      expect(screen.getByText('อยู่ในรัศมี')).toBeInTheDocument();
      
      const badge = screen.getByText('อยู่ในรัศมี');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200');
    });

    it('should show "นอกรัศมี" status for distance > 100 meters', () => {
      const propsOutOfRange = {
        ...defaultProps,
        checkInLocation: {
          ...defaultProps.checkInLocation,
          distance_from_branch: 150,
        },
      };

      render(<GPSLocationDisplay {...propsOutOfRange} />);

      expect(screen.getByText('150 เมตร')).toBeInTheDocument();
      expect(screen.getByText('นอกรัศมี')).toBeInTheDocument();
      
      const badge = screen.getByText('นอกรัศมี');
      expect(badge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-200');
    });

    it('should show accuracy notice for out-of-range check-ins', () => {
      const propsOutOfRange = {
        ...defaultProps,
        checkInLocation: {
          ...defaultProps.checkInLocation,
          distance_from_branch: 150,
        },
      };

      render(<GPSLocationDisplay {...propsOutOfRange} />);

      expect(screen.getByText('หมายเหตุ:')).toBeInTheDocument();
      expect(screen.getByText(/การเช็คอินนอกรัศมีอาจเกิดจากความผิดพลาดของ GPS/)).toBeInTheDocument();
    });

    it('should not show accuracy notice for in-range check-ins', () => {
      render(<GPSLocationDisplay {...defaultProps} />);

      expect(screen.queryByText('หมายเหตุ:')).not.toBeInTheDocument();
      expect(screen.queryByText(/การเช็คอินนอกรัศมีอาจเกิดจาก/)).not.toBeInTheDocument();
    });
  });

  describe('Distance Formatting', () => {
    it('should format distance in meters for values < 1000', () => {
      const testCases = [
        { distance: 0.5, expected: '1 เมตร' },
        { distance: 50.7, expected: '51 เมตร' },
        { distance: 999.4, expected: '999 เมตร' },
        { distance: 999.9, expected: '1000 เมตร' },
      ];

      testCases.forEach(({ distance, expected }) => {
        const props = {
          ...defaultProps,
          checkInLocation: {
            ...defaultProps.checkInLocation,
            distance_from_branch: distance,
          },
        };

        const { rerender } = render(<GPSLocationDisplay {...props} />);
        expect(screen.getByText(expected)).toBeInTheDocument();
        rerender(<div />); // Clear for next test
      });
    });

    it('should format distance in kilometers for values >= 1000', () => {
      const testCases = [
        { distance: 1000, expected: '1.00 กิโลเมตร' },
        { distance: 1500, expected: '1.50 กิโลเมตร' },
        { distance: 2345.67, expected: '2.35 กิโลเมตร' },
      ];

      testCases.forEach(({ distance, expected }) => {
        const props = {
          ...defaultProps,
          checkInLocation: {
            ...defaultProps.checkInLocation,
            distance_from_branch: distance,
          },
        };

        const { rerender } = render(<GPSLocationDisplay {...props} />);
        expect(screen.getByText(expected)).toBeInTheDocument();
        rerender(<div />); // Clear for next test
      });
    });
  });

  describe('Coordinate Formatting', () => {
    it('should format negative coordinates correctly', () => {
      const propsWithNegativeCoords = {
        ...defaultProps,
        checkInLocation: {
          latitude: -34.6037,
          longitude: -58.3816,
          distance_from_branch: 50,
        },
        branchLocation: {
          latitude: -34.6000,
          longitude: -58.3800,
        },
      };

      render(<GPSLocationDisplay {...propsWithNegativeCoords} />);

      expect(screen.getByText('34.603700° S')).toBeInTheDocument();
      expect(screen.getByText('58.381600° W')).toBeInTheDocument();
      expect(screen.getByText('34.600000° S')).toBeInTheDocument();
      expect(screen.getByText('58.380000° W')).toBeInTheDocument();
    });

    it('should handle zero coordinates', () => {
      const propsWithZeroCoords = {
        ...defaultProps,
        checkInLocation: {
          latitude: 0,
          longitude: 0,
          distance_from_branch: 50,
        },
        branchLocation: {
          latitude: 0,
          longitude: 0,
        },
      };

      render(<GPSLocationDisplay {...propsWithZeroCoords} />);

      expect(screen.getAllByText('0.000000° N')).toHaveLength(2);
      expect(screen.getAllByText('0.000000° E')).toHaveLength(2);
    });

    it('should handle mixed positive/negative coordinates', () => {
      const propsWithMixedCoords = {
        ...defaultProps,
        checkInLocation: {
          latitude: 13.7563,
          longitude: -100.5018,
          distance_from_branch: 50,
        },
        branchLocation: {
          latitude: -13.7555,
          longitude: 100.5015,
        },
      };

      render(<GPSLocationDisplay {...propsWithMixedCoords} />);

      expect(screen.getByText('13.756300° N')).toBeInTheDocument();
      expect(screen.getByText('100.501800° W')).toBeInTheDocument();
      expect(screen.getByText('13.755500° S')).toBeInTheDocument();
      expect(screen.getByText('100.501500° E')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive grid classes', () => {
      const { container } = render(<GPSLocationDisplay {...defaultProps} />);

      // Check coordinate grid has responsive classes
      const coordinateGrid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2');
      expect(coordinateGrid).toBeInTheDocument();

      // Check map links grid has responsive classes  
      const mapLinksGrid = container.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-2')[1];
      expect(mapLinksGrid).toBeInTheDocument();
    });

    it('should have proper spacing and layout classes', () => {
      const { container } = render(<GPSLocationDisplay {...defaultProps} />);

      // Check main card structure
      expect(container.querySelector('.space-y-4')).toBeInTheDocument();
      
      // Check coordinate sections have proper spacing
      expect(container.querySelector('.space-y-3')).toBeInTheDocument();
      
      // Check gap between grid items
      expect(container.querySelector('.gap-4')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes and semantic structure', () => {
      render(<GPSLocationDisplay {...defaultProps} />);

      // Check external links have proper attributes
      const mapLinks = screen.getAllByRole('link');
      mapLinks.forEach(link => {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    it('should have proper heading structure', () => {
      render(<GPSLocationDisplay {...defaultProps} />);

      // Main title should be in card header
      expect(screen.getByText('ตำแหน่ง GPS ณ เวลาเช็คอิน')).toBeInTheDocument();
      
      // Section headings should be h4
      expect(screen.getByText('ตำแหน่งเช็คอิน')).toBeInTheDocument();
      expect(screen.getByText('ตำแหน่งสาขา')).toBeInTheDocument();
    });

    it('should have descriptive text for screen readers', () => {
      render(<GPSLocationDisplay {...defaultProps} />);

      // Check for descriptive labels
      expect(screen.getByText('ละติจูด:')).toBeInTheDocument();
      expect(screen.getByText('ลองจิจูด:')).toBeInTheDocument();
      expect(screen.getByText(/ระยะห่างจาก/)).toBeInTheDocument();
    });
  });
});