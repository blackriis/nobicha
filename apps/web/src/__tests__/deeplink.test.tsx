/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LoginForm } from '@/components/auth/LoginForm'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}))

// Mock AuthProvider
jest.mock('@/components/auth', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const mockPush = jest.fn()
const mockGet = jest.fn()
const mockSignIn = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  
  // Reset mocks
  mockPush.mockClear()
  mockGet.mockClear()
  mockSignIn.mockClear()
  
  // Setup router mock
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ;(require('next/navigation').useRouter as jest.Mock).mockReturnValue({
    push: mockPush
  })
  
  // Setup searchParams mock
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ;(require('next/navigation').useSearchParams as jest.Mock).mockReturnValue({
    get: mockGet
  })
  
  // Setup auth mock
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ;(require('@/components/auth').useAuth as jest.Mock).mockReturnValue({
    user: null,
    loading: false,
    signIn: mockSignIn,
    signOut: jest.fn()
  })
})

describe('Deeplink Integration', () => {
  beforeEach(() => {
    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: ''
    })
  })

  it('should redirect to saved path from query parameter after login', async () => {
    // Setup query parameter with redirect path
    mockGet.mockReturnValue('/admin/employees')
    mockSignIn.mockResolvedValue({})

    render(<LoginForm role="admin" title="Admin Login" description="Login for admin" />)
    
    const emailInput = screen.getByTestId('email-input')
    const passwordInput = screen.getByTestId('password-input')
    const loginButton = screen.getByTestId('login-button')

    fireEvent.change(emailInput, { target: { value: 'admin@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/employees')
    })
  })

  it('should redirect to saved path from cookie after login', async () => {
    // Setup cookie with redirect path
    document.cookie = 'redirectTo=/admin/employees; path=/'

    // Mock no query parameter
    mockGet.mockReturnValue(null)
    mockSignIn.mockResolvedValue({})

    render(<LoginForm role="admin" title="Admin Login" description="Login for admin" />)
    
    const emailInput = screen.getByTestId('email-input')
    const passwordInput = screen.getByTestId('password-input')
    const loginButton = screen.getByTestId('login-button')

    fireEvent.change(emailInput, { target: { value: 'admin@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/employees')
    })
  })

  it('should fall back to role-based default when no redirect path is saved', async () => {
    // No query parameter or cookie
    mockGet.mockReturnValue(null)
    mockSignIn.mockResolvedValue({})

    render(<LoginForm role="employee" title="Employee Login" description="Login for employee" />)
    
    const emailInput = screen.getByTestId('email-input')
    const passwordInput = screen.getByTestId('password-input')
    const loginButton = screen.getByTestId('login-button')

    fireEvent.change(emailInput, { target: { value: 'emp@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should clear redirect cookie after using it', async () => {
    // Setup cookie with redirect path
    document.cookie = 'redirectTo=/admin/branches; path=/'

    mockGet.mockReturnValue(null)
    mockSignIn.mockResolvedValue({})

    // Spy on cookie setting
    const cookieSpy = jest.spyOn(document, 'cookie', 'set')

    render(<LoginForm role="admin" title="Admin Login" description="Login for admin" />)
    
    const emailInput = screen.getByTestId('email-input')
    const passwordInput = screen.getByTestId('password-input')
    const loginButton = screen.getByTestId('login-button')

    fireEvent.change(emailInput, { target: { value: 'admin@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/branches')
      expect(cookieSpy).toHaveBeenCalledWith(
        'redirectTo=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      )
    })

    cookieSpy.mockRestore()
  })

  it('should ignore invalid redirect paths', async () => {
    // Setup query parameter with invalid path
    mockGet.mockReturnValue('https://evil.com')
    mockSignIn.mockResolvedValue({})

    render(<LoginForm role="admin" title="Admin Login" description="Login for admin" />)
    
    const emailInput = screen.getByTestId('email-input')
    const passwordInput = screen.getByTestId('password-input')
    const loginButton = screen.getByTestId('login-button')

    fireEvent.change(emailInput, { target: { value: 'admin@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(loginButton)

    await waitFor(() => {
      // Should fall back to default role-based redirect
      expect(mockPush).toHaveBeenCalledWith('/admin')
    })
  })
})