import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EmployeeList } from '@/components/admin/EmployeeList'

// Mock all UI components to prevent rendering issues
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="employee-card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  MoreHorizontal: () => <div>More</div>,
  Clock: () => <div>Clock</div>,
  MapPin: () => <div>MapPin</div>,
  Mail: () => <div>Mail</div>,
  Phone: () => <div>Phone</div>,
  Calendar: () => <div>Calendar</div>,
  Edit: () => <div>Edit</div>,
  Trash2: () => <div>Trash2</div>,
  Eye: () => <div>Eye</div>,
  CheckCircle2: () => <div>CheckCircle2</div>,
  XCircle: () => <div>XCircle</div>,
  AlertCircle: () => <div>AlertCircle</div>,
  User: () => <div>User</div>,
}))

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Setup test environment
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('EmployeeList', () => {
  describe('Loading State', () => {
    it('should show loading skeleton when data is loading', () => {
      render(<EmployeeList searchTerm="" filterStatus="all" />)
      
      // Should show loading skeleton with animation
      const skeletonElements = document.querySelectorAll('.animate-pulse')
      expect(skeletonElements.length).toBeGreaterThan(0)
    })

    it('should hide loading state after data loads', async () => {
      render(<EmployeeList searchTerm="" filterStatus="all" />)
      
      // Fast-forward the setTimeout
      vi.advanceTimersByTime(1000)
      
      await waitFor(() => {
        expect(screen.getByText('สมชาย ใจดี')).toBeInTheDocument()
      })
    })
  })

  describe('Employee Data Rendering', () => {
    beforeEach(async () => {
      render(<EmployeeList searchTerm="" filterStatus="all" />)
      vi.advanceTimersByTime(1000)
      await waitFor(() => {
        expect(screen.getByText('สมชาย ใจดี')).toBeInTheDocument()
      })
    })

    it('should render employee names correctly', () => {
      expect(screen.getByText('สมชาย ใจดี')).toBeInTheDocument()
      expect(screen.getByText('สมหญิง รักงาน')).toBeInTheDocument()
      expect(screen.getByText('วิชัย กิจหนัก')).toBeInTheDocument()
      expect(screen.getByText('มาลี สวยงาม')).toBeInTheDocument()
      expect(screen.getByText('ธนา วิ่งเร็ว')).toBeInTheDocument()
    })

    it('should display employee codes as badges', () => {
      expect(screen.getByText('EMP001')).toBeInTheDocument()
      expect(screen.getByText('EMP002')).toBeInTheDocument()
      expect(screen.getByText('EMP003')).toBeInTheDocument()
      expect(screen.getByText('EMP004')).toBeInTheDocument()
      expect(screen.getByText('EMP005')).toBeInTheDocument()
    })

    it('should show positions when available', () => {
      expect(screen.getByText('พนักงานขาย')).toBeInTheDocument()
      expect(screen.getByText('พนักงานบัญชี')).toBeInTheDocument()
      expect(screen.getByText('ผู้จัดการสาขา')).toBeInTheDocument()
      expect(screen.getByText('พนักงานการตลาด')).toBeInTheDocument()
      expect(screen.getByText('พนักงานจัดส่ง')).toBeInTheDocument()
    })

    it('should display contact information correctly', () => {
      expect(screen.getByText('somchai@company.com')).toBeInTheDocument()
      expect(screen.getByText('081-234-5678')).toBeInTheDocument()
      expect(screen.getByText('สาขาสีลม')).toBeInTheDocument()
    })

    it('should show work statistics', () => {
      expect(screen.getByText('168 ชม.')).toBeInTheDocument()
      expect(screen.getByText('95%')).toBeInTheDocument()
      expect(screen.getByText('160 ชม.')).toBeInTheDocument()
      expect(screen.getByText('88%')).toBeInTheDocument()
    })
  })

  describe('Status Badges', () => {
    beforeEach(async () => {
      render(<EmployeeList searchTerm="" filterStatus="all" />)
      vi.advanceTimersByTime(1000)
      await waitFor(() => {
        expect(screen.getByText('สมชาย ใจดี')).toBeInTheDocument()
      })
    })

    it('should show "กำลังทำงาน" badge for currently working employees', () => {
      const workingBadges = screen.getAllByText('กำลังทำงาน')
      expect(workingBadges.length).toBeGreaterThan(0)
    })

    it('should show "ไม่ใช้งาน" badge for inactive employees', () => {
      expect(screen.getByText('ไม่ใช้งาน')).toBeInTheDocument()
    })

    it('should show "ใช้งานอยู่" badge for active but not working employees', () => {
      expect(screen.getByText('ใช้งานอยู่')).toBeInTheDocument()
    })
  })

  describe('Search and Filter Functionality', () => {
    it('should filter employees by name', async () => {
      render(<EmployeeList searchTerm="สมชาย" filterStatus="all" />)
      vi.advanceTimersByTime(1000)
      
      await waitFor(() => {
        expect(screen.getByText('สมชาย ใจดี')).toBeInTheDocument()
        expect(screen.queryByText('สมหญิง รักงาน')).not.toBeInTheDocument()
      })
    })

    it('should filter employees by email', async () => {
      render(<EmployeeList searchTerm="somchai@company.com" filterStatus="all" />)
      vi.advanceTimersByTime(1000)
      
      await waitFor(() => {
        expect(screen.getByText('สมชาย ใจดี')).toBeInTheDocument()
        expect(screen.queryByText('สมหญิง รักงาน')).not.toBeInTheDocument()
      })
    })

    it('should filter active employees only', async () => {
      render(<EmployeeList searchTerm="" filterStatus="active" />)
      vi.advanceTimersByTime(1000)
      
      await waitFor(() => {
        expect(screen.getByText('สมชาย ใจดี')).toBeInTheDocument()
        expect(screen.getByText('สมหญิง รักงาน')).toBeInTheDocument()
        expect(screen.queryByText('มาลี สวยงาม')).not.toBeInTheDocument() // inactive employee
      })
    })

    it('should filter inactive employees only', async () => {
      render(<EmployeeList searchTerm="" filterStatus="inactive" />)
      vi.advanceTimersByTime(1000)
      
      await waitFor(() => {
        expect(screen.getByText('มาลี สวยงาม')).toBeInTheDocument()
        expect(screen.queryByText('สมชาย ใจดี')).not.toBeInTheDocument()
      })
    })
  })

  describe('Empty States', () => {
    it('should show no data message when no employees match filters', async () => {
      render(<EmployeeList searchTerm="nonexistent" filterStatus="all" />)
      vi.advanceTimersByTime(1000)
      
      await waitFor(() => {
        expect(screen.getByText('ไม่พบข้อมูลพนักงาน')).toBeInTheDocument()
        expect(screen.getByText('ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองข้อมูล')).toBeInTheDocument()
      })
    })
  })

  describe('UI Interactions', () => {
    beforeEach(async () => {
      render(<EmployeeList searchTerm="" filterStatus="all" />)
      vi.advanceTimersByTime(1000)
      await waitFor(() => {
        expect(screen.getByText('สมชาย ใจดี')).toBeInTheDocument()
      })
    })

    it('should have clickable action buttons', () => {
      const viewButtons = screen.getAllByText('ดูรายละเอียด')
      const editButtons = screen.getAllByText('แก้ไข')
      
      expect(viewButtons.length).toBeGreaterThan(0)
      expect(editButtons.length).toBeGreaterThan(0)
    })

    it('should show employee count information', async () => {
      await waitFor(() => {
        expect(screen.getByText('แสดง 5 จาก 5 คน')).toBeInTheDocument()
      })
    })
  })

  describe('Component Structure', () => {
    beforeEach(async () => {
      render(<EmployeeList searchTerm="" filterStatus="all" />)
      vi.advanceTimersByTime(1000)
      await waitFor(() => {
        expect(screen.getByText('สมชาย ใจดี')).toBeInTheDocument()
      })
    })

    it('should render employee cards', () => {
      const employeeCards = screen.getAllByTestId('employee-card')
      expect(employeeCards.length).toBe(5) // 5 employees in mock data
    })

    it('should have proper accessibility text content', () => {
      // Verify important Thai text is accessible
      expect(screen.getByText('ดูรายละเอียด')).toBeInTheDocument()
      expect(screen.getByText('แก้ไข')).toBeInTheDocument()
      expect(screen.getByText('อัตราการเข้างาน:')).toBeInTheDocument()
    })
  })
})