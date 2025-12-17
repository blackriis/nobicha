import { useRef, useEffect, useState, useCallback } from 'react'

/**
 * Focus management hook for forms and modal dialogs
 *
 * Features:
 * - Trap focus within a container
 * - Return focus to trigger element when closing
 * - Focus first input/form element automatically
 * - Handle ESC key
 * - Manage tab order
 */
interface FocusManagementOptions {
  /** Auto focus first focusable element on mount */
  autoFocus?: boolean
  /** Return focus to trigger element on unmount */
  restoreFocus?: boolean
  /** Trap focus within container */
  trapFocus?: boolean
  /** Handle ESC key callback */
  onEscape?: () => void
}

interface FocusManagementReturn {
  /** Ref for the container element */
  containerRef: React.RefObject<HTMLElement>
  /** Ref for the trigger element */
  triggerRef: React.RefObject<HTMLElement>
  /** Manually set focus to first focusable element */
  focusFirst: () => void
  /** Manually set focus to last focusable element */
  focusLast: () => void
}

export function useFocusManagement(options: FocusManagementOptions = {}): FocusManagementReturn {
  const {
    autoFocus = true,
    restoreFocus = true,
    trapFocus = true,
    onEscape
  } = options

  const containerRef = useRef<HTMLElement>(null)
  const triggerRef = useRef<HTMLElement>(null)
  const previousActiveElementRef = useRef<Element | null>(null)

  // Get all focusable elements within container
  const getFocusableElements = (): HTMLElement[] => {
    const container = containerRef.current
    if (!container) return []

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      'details summary',
      'audio[controls]',
      'video[controls]',
      '[contenteditable]:not([contenteditable="false"])'
    ]

    const elements = container.querySelectorAll(focusableSelectors.join(', ')) as NodeListOf<HTMLElement>
    return Array.from(elements).filter(el => {
      // Check if element is visible and not disabled
      const style = window.getComputedStyle(el)
      return el.offsetParent !== null && style.display !== 'none' && style.visibility !== 'hidden'
    })
  }

  // Focus first element
  const focusFirst = () => {
    const elements = getFocusableElements()
    if (elements.length > 0) {
      elements[0].focus()
    }
  }

  // Focus last element
  const focusLast = () => {
    const elements = getFocusableElements()
    if (elements.length > 0) {
      elements[elements.length - 1].focus()
    }
  }

  // Handle tab key cycling
  const handleTabKey = (e: KeyboardEvent) => {
    if (!trapFocus) return

    const focusableElements = getFocusableElements()
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (e.shiftKey) {
      // Shift + Tab - going backwards
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab - going forwards
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }

  // Handle keyboard events
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Tab':
        handleTabKey(e)
        break
      case 'Escape':
        if (onEscape) {
          e.preventDefault()
          onEscape()
        }
        break
    }
  }

  // Store the trigger element when called
  const setTriggerElement = (element: HTMLElement) => {
    triggerRef.current = element
    previousActiveElementRef.current = element
  }

  // Auto focus on mount
  useEffect(() => {
    if (autoFocus && containerRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        focusFirst()
      }, 50)

      return () => clearTimeout(timer)
    }
  }, [autoFocus])

  // Add keyboard event listeners
  useEffect(() => {
    const container = containerRef.current
    if (!container || (!trapFocus && !onEscape)) return

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [trapFocus, onEscape])

  // Restore focus on unmount
  useEffect(() => {
    return () => {
      if (restoreFocus && previousActiveElementRef.current && 'focus' in previousActiveElementRef.current) {
        ;(previousActiveElementRef.current as HTMLElement).focus()
      }
    }
  }, [restoreFocus])

  return {
    containerRef,
    triggerRef,
    focusFirst,
    focusLast
  }
}

/**
 * Enhanced focus management for form elements specifically
 */
interface FormFieldError {
  fieldId: string
  message: string
}

export function useFormFocusManagement(onSubmit?: () => void): FocusManagementReturn & {
  handleFormSubmit: (e: React.FormEvent) => void
  fieldErrors: FormFieldError[]
} {
  const focusManagement = useFocusManagement({
    autoFocus: true,
    trapFocus: true,
    onEscape: () => {
      // Optional: Handle ESC to cancel/close form - no console logging in production
    }
  })

  // Store validation errors in state instead of DOM manipulation
  const [fieldErrors, setFieldErrors] = useState<FormFieldError[]>([])

  // Clear specific field error
  const clearFieldError = useCallback((fieldId: string) => {
    setFieldErrors(prev => prev.filter(error => error.fieldId !== fieldId))
  }, [])

  // Set field error
  const setFieldError = useCallback((fieldId: string, message: string) => {
    setFieldErrors(prev => [
      ...prev.filter(error => error.fieldId !== fieldId),
      { fieldId, message }
    ])
  }, [])

  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()

    // Clear previous errors
    setFieldErrors([])

    // Basic validation to ensure required fields are focused if empty
    const container = focusManagement.containerRef.current
    if (!container) return

    const requiredElements = container.querySelectorAll('[required]') as NodeListOf<HTMLInputElement>
    const errors: FormFieldError[] = []

    for (const element of requiredElements) {
      if (!element.value.trim()) {
        const fieldId = element.id
        const fieldLabel = element.getAttribute('aria-label') || element.name || 'Field'

        // Focus the first invalid field
        element.focus()
        element.setAttribute('aria-invalid', 'true')
        element.setAttribute('aria-describedby', `${fieldId}-error`)

        // Add error to state instead of creating DOM element
        errors.push({
          fieldId,
          message: `${fieldLabel} จำเป็นต้องกรอก`
        })

        // Stop at first invalid field
        break
      } else {
        // Clear any existing error for valid fields
        element.setAttribute('aria-invalid', 'false')
        element.removeAttribute('aria-describedby')
      }
    }

    if (errors.length > 0) {
      setFieldErrors(errors)
      return // Don't submit if there are errors
    }

    // If validation passes, call submit handler
    if (onSubmit) {
      onSubmit()
    }
  }, [focusManagement.containerRef, onSubmit, setFieldError])

  return {
    ...focusManagement,
    handleFormSubmit,
    fieldErrors,
    clearFieldError,
    setFieldError
  }
}