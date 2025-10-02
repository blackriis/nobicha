/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { useAuth } from '@/components/auth'
import AdminLoginPage from '@/app/login/admin/page'
import EmployeeLoginPage from '@/app/login/employee/page'

// Mock the useAuth hook
jest.mock('@/components/auth', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock lib/auth
jest.mock('@/lib/auth', () => ({
  getRedirectUrl: jest.fn(() => '/dashboard'),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('Login Pages', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn()
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Admin Login Page', () => {
    it('should render admin login form with correct props', () => {
      render(<AdminLoginPage />)

      expect(screen.getByText('เข้าสู่ระบบผู้ดูแลระบบ')).toBeInTheDocument()
      expect(screen.getByText('สำหรับผู้ดูแลระบบเท่านั้น')).toBeInTheDocument()
      expect(screen.getByLabelText('อีเมล')).toBeInTheDocument()
      expect(screen.getByLabelText('รหัสผ่าน')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /เข้าสู่ระบบ/i })).toBeInTheDocument()
    })

    it('should show admin-specific description', () => {
      render(<AdminLoginPage />)
      expect(screen.getByText('สำหรับผู้ดูแลระบบเท่านั้น')).toBeInTheDocument()
    })
  })

  describe('Employee Login Page', () => {
    it('should render employee login form with correct props', () => {
      render(<EmployeeLoginPage />)

      expect(screen.getByText('เข้าสู่ระบบ')).toBeInTheDocument()
      expect(screen.getByText('สำหรับพนักงานในระบบบริหารจัดการพนักงาน')).toBeInTheDocument()
      expect(screen.getByLabelText('อีเมล')).toBeInTheDocument()
      expect(screen.getByLabelText('รหัสผ่าน')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /เข้าสู่ระบบ/i })).toBeInTheDocument()
    })

    it('should show employee-specific description', () => {
      render(<EmployeeLoginPage />)
      expect(screen.getByText('สำหรับพนักงานในระบบบริหารจัดการพนักงาน')).toBeInTheDocument()
    })
  })

  describe('Thai Language Support', () => {
    it('should display all text in Thai language for admin login', () => {
      render(<AdminLoginPage />)
      
      // Check Thai labels and buttons
      expect(screen.getByText('เข้าสู่ระบบผู้ดูแลระบบ')).toBeInTheDocument()
      expect(screen.getByText('สำหรับผู้ดูแลระบบเท่านั้น')).toBeInTheDocument()
      expect(screen.getByLabelText('อีเมล')).toBeInTheDocument()
      expect(screen.getByLabelText('รหัสผ่าน')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('กรุณากรอกอีเมล')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('กรุณากรอกรหัสผ่าน')).toBeInTheDocument()
    })

    it('should display all text in Thai language for employee login', () => {
      render(<EmployeeLoginPage />)
      
      // Check Thai labels and buttons
      expect(screen.getByText('เข้าสู่ระบบ')).toBeInTheDocument()
      expect(screen.getByText('สำหรับพนักงานในระบบบริหารจัดการพนักงาน')).toBeInTheDocument()
      expect(screen.getByLabelText('อีเมล')).toBeInTheDocument()
      expect(screen.getByLabelText('รหัสผ่าน')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('กรุณากรอกอีเมล')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('กรุณากรอกรหัสผ่าน')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper form structure and labels for admin login', () => {
      render(<AdminLoginPage />)

      // Check for proper form elements
      const emailInput = screen.getByLabelText('อีเมล')
      const passwordInput = screen.getByLabelText('รหัสผ่าน')
      const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/i })

      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('required')
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('required')
      expect(submitButton).toHaveAttribute('type', 'submit')
    })

    it('should have proper form structure and labels for employee login', () => {
      render(<EmployeeLoginPage />)

      // Check for proper form elements
      const emailInput = screen.getByLabelText('อีเมล')
      const passwordInput = screen.getByLabelText('รหัสผ่าน')
      const submitButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/i })

      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('required')
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('required')
      expect(submitButton).toHaveAttribute('type', 'submit')
    })
  })
})