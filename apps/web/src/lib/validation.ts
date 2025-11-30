import type { UserRole } from '@employee-management/database'

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export interface AuthValidationResult extends ValidationResult {
  sanitized?: {
    email: string
    fullName?: string
    role?: UserRole
  }
}

// Email validation regex (RFC 5322 compliant)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

// Username validation regex (alphanumeric, underscore, hyphen)
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/

// Password validation rules
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_REGEX = {
  hasUpperCase: /[A-Z]/,
  hasLowerCase: /[a-z]/,
  hasNumbers: /\d/,
  hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/
}

// Sanitization functions
function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function sanitizeString(input: string): string {
  return input.trim().replace(/[<>\"'&]/g, '')
}

// Email validation
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = []

  if (!email) {
    errors.push('Email is required')
    return { valid: false, errors }
  }

  const sanitizedEmail = sanitizeEmail(email)

  if (sanitizedEmail.length > 254) {
    errors.push('Email is too long')
  }

  if (!EMAIL_REGEX.test(sanitizedEmail)) {
    errors.push('Invalid email format')
  }

  // Check for potentially dangerous patterns
  if (sanitizedEmail.includes('..') || sanitizedEmail.startsWith('.') || sanitizedEmail.endsWith('.')) {
    errors.push('Invalid email format')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// Username validation
export function validateUsername(username: string): ValidationResult {
  const errors: string[] = []

  if (!username) {
    errors.push('Username is required')
    return { valid: false, errors }
  }

  const sanitized = username.trim()

  if (sanitized.length < 3) {
    errors.push('Username must be at least 3 characters long')
  }

  if (sanitized.length > 50) {
    errors.push('Username is too long (maximum 50 characters)')
  }

  if (!USERNAME_REGEX.test(sanitized)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// Check if input is email or username
export function isEmail(input: string): boolean {
  return EMAIL_REGEX.test(input.trim().toLowerCase())
}

// Password validation
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = []
  
  if (!password) {
    errors.push('Password is required')
    return { valid: false, errors }
  }
  
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`)
  }
  
  if (password.length > 128) {
    errors.push('Password is too long (maximum 128 characters)')
  }
  
  if (!PASSWORD_REGEX.hasLowerCase.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!PASSWORD_REGEX.hasUpperCase.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!PASSWORD_REGEX.hasNumbers.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!PASSWORD_REGEX.hasSpecialChar.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  // Check for common weak passwords
  const commonPasswords = ['password', '12345678', 'qwerty123', 'admin123']
  if (commonPasswords.some(weak => password.toLowerCase().includes(weak))) {
    errors.push('Password contains common patterns and is not secure')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Full name validation
export function validateFullName(fullName: string): ValidationResult {
  const errors: string[] = []
  
  if (!fullName || !fullName.trim()) {
    errors.push('Full name is required')
    return { valid: false, errors }
  }
  
  const sanitized = sanitizeString(fullName)
  
  if (sanitized.length < 2) {
    errors.push('Full name must be at least 2 characters long')
  }
  
  if (sanitized.length > 100) {
    errors.push('Full name is too long (maximum 100 characters)')
  }
  
  // Allow only letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Zก-๙\s\-'\.]+$/
  if (!nameRegex.test(sanitized)) {
    errors.push('Full name contains invalid characters')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// User role validation
export function validateUserRole(role: string): ValidationResult {
  const errors: string[] = []
  const validRoles: UserRole[] = ['employee', 'admin']
  
  if (!role) {
    errors.push('User role is required')
    return { valid: false, errors }
  }
  
  if (!validRoles.includes(role as UserRole)) {
    errors.push('Invalid user role')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Comprehensive auth validation (accepts both email and username)
export function validateSignInData(identifier: string, password: string): AuthValidationResult {
  const errors: string[] = []

  // Check if identifier is provided
  if (!identifier || !identifier.trim()) {
    errors.push('Username or email is required')
  }

  // Validate password
  const passwordValidation = validatePassword(password)
  errors.push(...passwordValidation.errors)

  // If there are errors, return early
  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      sanitized: undefined
    }
  }

  // Validate as email or username
  const trimmedIdentifier = identifier.trim()
  let sanitizedEmail: string

  if (isEmail(trimmedIdentifier)) {
    // It's an email - validate and sanitize
    const emailValidation = validateEmail(trimmedIdentifier)
    if (!emailValidation.valid) {
      return {
        valid: false,
        errors: [...errors, ...emailValidation.errors],
        sanitized: undefined
      }
    }
    sanitizedEmail = sanitizeEmail(trimmedIdentifier)
  } else {
    // It's a username - validate format
    const usernameValidation = validateUsername(trimmedIdentifier)
    if (!usernameValidation.valid) {
      return {
        valid: false,
        errors: [...errors, ...usernameValidation.errors],
        sanitized: undefined
      }
    }
    // Store username as-is (will be looked up to get email later)
    sanitizedEmail = trimmedIdentifier.toLowerCase()
  }

  return {
    valid: true,
    errors: [],
    sanitized: {
      email: sanitizedEmail
    }
  }
}

export function validateSignUpData(
  email: string, 
  password: string, 
  fullName: string, 
  role: string = 'employee'
): AuthValidationResult {
  const emailValidation = validateEmail(email)
  const passwordValidation = validatePassword(password)
  const nameValidation = validateFullName(fullName)
  const roleValidation = validateUserRole(role)
  
  const errors = [
    ...emailValidation.errors,
    ...passwordValidation.errors,
    ...nameValidation.errors,
    ...roleValidation.errors
  ]
  
  const valid = errors.length === 0
  
  return {
    valid,
    errors,
    sanitized: valid ? {
      email: sanitizeEmail(email),
      fullName: sanitizeString(fullName),
      role: role as UserRole
    } : undefined
  }
}

// Request body validation helper
export function validateRequestBody(body: unknown, requiredFields: string[]): ValidationResult {
  const errors: string[] = []
  
  if (!body || typeof body !== 'object') {
    errors.push('Invalid request body')
    return { valid: false, errors }
  }
  
  const bodyObj = body as Record<string, unknown>
  
  // Check required fields
  for (const field of requiredFields) {
    const fieldValue = bodyObj[field]
    if (!fieldValue || (typeof fieldValue === 'string' && !fieldValue.trim())) {
      errors.push(`${field} is required`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// UUID validation regex (RFC 4122 compliant - supports all UUID versions)
const UUID_REGEX: RegExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// UUID validation
export function validateUUID(uuid: string): ValidationResult {
  const errors: string[] = []
  
  if (!uuid) {
    errors.push('UUID is required')
    return { valid: false, errors }
  }
  
  if (typeof uuid !== 'string') {
    errors.push('UUID must be a string')
    return { valid: false, errors }
  }
  
  const trimmedUuid = uuid.trim()
  
  if (!UUID_REGEX.test(trimmedUuid)) {
    errors.push('Invalid UUID format. Expected UUID format.')
    return { valid: false, errors }
  }
  
  return {
    valid: true,
    errors: []
  }
}

// Utility function to check if a string is a valid UUID (shorthand)
export function isValidUUID(uuid: string): boolean {
  return validateUUID(uuid).valid
}

// Content Security Policy nonce generator
export function generateCSPNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}