import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// Component prop types for UI mocks
interface DialogProps {
  children: React.ReactNode
  open?: boolean
}

interface ComponentWithChildren {
  children: React.ReactNode
}

interface ComponentWithHtmlFor {
  children: React.ReactNode
  htmlFor?: string
}

interface ButtonProps {
  children: React.ReactNode
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  [key: string]: unknown
}

interface InputProps {
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  [key: string]: unknown
}

interface CardProps {
  children: React.ReactNode
  className?: string
}

// Ensure React is available globally for JSX
globalThis.React = React

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    route: '/',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock Radix UI components to avoid portal/DOM issues
vi.mock('@radix-ui/react-dialog', () => ({
  Dialog: ({ children, open }: DialogProps) => open ? React.createElement('div', { 'data-testid': 'dialog' }, children) : null,
  DialogContent: ({ children }: ComponentWithChildren) => React.createElement('div', { 'data-testid': 'dialog-content' }, children),
  DialogHeader: ({ children }: ComponentWithChildren) => React.createElement('div', { 'data-testid': 'dialog-header' }, children),
  DialogTitle: ({ children }: ComponentWithChildren) => React.createElement('h2', { 'data-testid': 'dialog-title' }, children),
}))

// Mock Shadcn UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: DialogProps) => open ? React.createElement('div', { 'data-testid': 'dialog' }, children) : null,
  DialogContent: ({ children }: ComponentWithChildren) => React.createElement('div', { 'data-testid': 'dialog-content' }, children),
  DialogHeader: ({ children }: ComponentWithChildren) => React.createElement('div', { 'data-testid': 'dialog-header' }, children),
  DialogTitle: ({ children }: ComponentWithChildren) => React.createElement('h2', { 'data-testid': 'dialog-title' }, children),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: ButtonProps) => 
    React.createElement('button', { onClick, disabled, ...props }, children)
}))

vi.mock('@/components/ui/input', () => ({
  Input: ({ onChange, ...props }: InputProps) => 
    React.createElement('input', { onChange, ...props })
}))

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: ComponentWithHtmlFor) => React.createElement('label', { htmlFor }, children)
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: CardProps) => React.createElement('div', { className }, children),
  CardContent: ({ children, className }: CardProps) => React.createElement('div', { className }, children),
  CardDescription: ({ children, className }: CardProps) => React.createElement('div', { className }, children),
  CardHeader: ({ children, className }: CardProps) => React.createElement('div', { className }, children),
  CardTitle: ({ children, className }: CardProps) => React.createElement('div', { className }, children),
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: CardProps) => React.createElement('span', { className }, children),
}))

vi.mock('@/components/ui/separator', () => ({
  Separator: ({ className }: { className?: string }) => React.createElement('hr', { className }),
}))

vi.mock('@/components/ui/table', () => ({
  Table: ({ children, className }: CardProps) => React.createElement('table', { className }, children),
  TableBody: ({ children, className }: CardProps) => React.createElement('tbody', { className }, children),
  TableCell: ({ children, className }: CardProps) => React.createElement('td', { className }, children),
  TableHead: ({ children, className }: CardProps) => React.createElement('thead', { className }, children),
  TableHeader: ({ children, className }: CardProps) => React.createElement('th', { className }, children),
  TableRow: ({ children, className }: CardProps) => React.createElement('tr', { className }, children),
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value, defaultValue }: { children: React.ReactNode, onValueChange?: (value: string) => void, value?: string, defaultValue?: string }) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onValueChange) {
        onValueChange(e.target.value)
      }
    }
    return React.createElement('select', { 
      'data-testid': 'select', 
      'data-value': value || defaultValue,
      value: value || defaultValue,
      onChange: handleChange
    }, children)
  },
  SelectContent: ({ children }: ComponentWithChildren) => React.createElement('div', { 'data-testid': 'select-content' }, children),
  SelectItem: ({ children, value }: { children: React.ReactNode, value: string }) => 
    React.createElement('option', { value }, children),
  SelectTrigger: ({ children, className }: CardProps) => React.createElement('div', { className }, children),
  SelectValue: ({ placeholder }: { placeholder?: string }) => React.createElement('span', {}, placeholder),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Search: () => React.createElement('div', { 'data-testid': 'search-icon' }),
  X: () => React.createElement('div', { 'data-testid': 'x-icon' }),
  Users: () => React.createElement('div', { 'data-testid': 'users-icon' }),
  ChevronUp: () => React.createElement('div', { 'data-testid': 'chevron-up-icon' }),
  ChevronDown: () => React.createElement('div', { 'data-testid': 'chevron-down-icon' }),
  ArrowUpDown: () => React.createElement('div', { 'data-testid': 'arrow-up-down-icon' }),
  ChevronLeft: () => React.createElement('div', { 'data-testid': 'chevron-left-icon' }),
  ChevronRight: () => React.createElement('div', { 'data-testid': 'chevron-right-icon' }),
  Filter: () => React.createElement('div', { 'data-testid': 'filter-icon' }),
  Download: () => React.createElement('div', { 'data-testid': 'download-icon' }),
  UserPlus: () => React.createElement('div', { 'data-testid': 'user-plus-icon' }),
}))

// Mock window.confirm for component tests
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn(() => true),
})

// Mock window.alert 
Object.defineProperty(window, 'alert', {
  writable: true,
  value: vi.fn(),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock fetch globally
global.fetch = vi.fn()

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'

// Mock Next.js headers and cookies for server components
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => ({ value: 'mock-session-token' })),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(() => new Map()),
}))

// Don't mock supabase-server globally - let individual tests handle it
// This was causing conflicts with test-specific mocks

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  createClientComponentClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
          single: vi.fn(),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(),
          })),
        })),
      })),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
    },
  })),
  createSupabaseClientSide: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
        })),
      })),
    })),
  })),
}))

// Setup console to suppress logs during tests unless needed
const originalConsoleError = console.error
console.error = (...args: unknown[]) => {
  if (
    typeof args[0] === 'string' && 
    (args[0].includes('Warning:') || args[0].includes('React') || args[0].includes('act'))
  ) {
    return
  }
  originalConsoleError.call(console, ...args)
}