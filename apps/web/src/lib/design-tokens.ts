/**
 * Design Tokens for Employee Management System
 * Centralized design system tokens for consistency across components
 */

export const designTokens = {
  // Color System
  colors: {
    // Status Colors
    success: {
      50: 'bg-green-50',
      100: 'bg-green-100', 
      500: 'bg-green-500',
      600: 'bg-green-600',
      text: 'text-green-600',
      textLight: 'text-green-500',
      border: 'border-green-200',
      borderDark: 'border-green-500'
    },
    error: {
      50: 'bg-red-50',
      100: 'bg-red-100',
      500: 'bg-red-500', 
      600: 'bg-red-600',
      text: 'text-red-600',
      textLight: 'text-red-500',
      border: 'border-red-200',
      borderDark: 'border-red-500'
    },
    warning: {
      50: 'bg-amber-50',
      100: 'bg-amber-100',
      500: 'bg-amber-500',
      600: 'bg-amber-600', 
      text: 'text-amber-600',
      textLight: 'text-amber-500',
      border: 'border-amber-200',
      borderDark: 'border-amber-500'
    },
    info: {
      50: 'bg-blue-50',
      100: 'bg-blue-100',
      500: 'bg-blue-500',
      600: 'bg-blue-600',
      text: 'text-blue-600',
      textLight: 'text-blue-500', 
      border: 'border-blue-200',
      borderDark: 'border-blue-500'
    },
    // Neutral Colors
    gray: {
      50: 'bg-gray-50',
      100: 'bg-gray-100',
      200: 'bg-gray-200',
      300: 'bg-gray-300',
      400: 'bg-gray-400',
      500: 'bg-gray-500',
      600: 'bg-gray-600',
      700: 'bg-gray-700',
      800: 'bg-gray-800',
      900: 'bg-gray-900',
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        tertiary: 'text-gray-500',
        disabled: 'text-gray-400'
      }
    }
  },

  // Spacing System (4px base grid)
  spacing: {
    0: '0',
    1: '0.25rem', // 4px
    2: '0.5rem',  // 8px 
    3: '0.75rem', // 12px
    4: '1rem',    // 16px
    5: '1.25rem', // 20px
    6: '1.5rem',  // 24px
    8: '2rem',    // 32px
    10: '2.5rem', // 40px
    12: '3rem',   // 48px
    16: '4rem',   // 64px
    20: '5rem',   // 80px
    24: '6rem'    // 96px
  },

  // Shadow System
  shadows: {
    none: 'shadow-none',
    sm: 'shadow-sm',     // Subtle elements
    default: 'shadow-md', // Cards, buttons
    lg: 'shadow-lg',     // Modals, dropdowns
    xl: 'shadow-xl'      // Major containers
  },

  // Border Radius System
  borderRadius: {
    none: 'rounded-none',
    sm: 'rounded-sm',     // 2px
    default: 'rounded',   // 4px  
    md: 'rounded-md',     // 6px
    lg: 'rounded-lg',     // 8px
    xl: 'rounded-xl',     // 12px
    full: 'rounded-full'  // Circle
  },

  // Typography System
  typography: {
    fontSize: {
      xs: 'text-xs',     // 12px
      sm: 'text-sm',     // 14px
      base: 'text-base', // 16px
      lg: 'text-lg',     // 18px
      xl: 'text-xl',     // 20px
      '2xl': 'text-2xl', // 24px
      '3xl': 'text-3xl'  // 30px
    },
    fontWeight: {
      normal: 'font-normal',   // 400
      medium: 'font-medium',   // 500
      semibold: 'font-semibold', // 600
      bold: 'font-bold'        // 700
    }
  },

  // Component Specific Tokens
  components: {
    button: {
      height: {
        sm: 'h-8',     // 32px
        default: 'h-10', // 40px
        lg: 'h-12',     // 48px
        xl: 'h-14'      // 56px
      },
      padding: {
        sm: 'px-3 py-1.5',
        default: 'px-4 py-2', 
        lg: 'px-6 py-3',
        xl: 'px-8 py-4'
      }
    },
    card: {
      padding: {
        sm: 'p-4',    // 16px
        default: 'p-6', // 24px
        lg: 'p-8'     // 32px
      },
      shadow: 'shadow-md',
      border: 'border border-gray-200',
      borderRadius: 'rounded-lg'
    },
    input: {
      height: 'h-10', // 40px
      padding: 'px-3 py-2',
      border: 'border border-gray-300',
      borderRadius: 'rounded-md',
      focus: 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
    }
  },

  // Animation Tokens
  animations: {
    transition: {
      fast: 'transition-all duration-150 ease-in-out',
      default: 'transition-all duration-200 ease-in-out', 
      slow: 'transition-all duration-300 ease-in-out'
    },
    scale: {
      hover: 'hover:scale-105',
      active: 'active:scale-95'
    }
  }
} as const;

// Helper functions for easier usage
export const getStatusColor = (status: 'success' | 'error' | 'warning' | 'info', variant: 'bg' | 'text' | 'border' = 'bg') => {
  const statusColors = designTokens.colors[status];
  switch (variant) {
    case 'text':
      return statusColors.text;
    case 'border':
      return statusColors.border;
    default:
      return statusColors[50];
  }
};

export const getComponentStyle = (component: 'button' | 'card' | 'input', property: string) => {
  return designTokens.components[component][property as keyof typeof designTokens.components[typeof component]];
};

export default designTokens;