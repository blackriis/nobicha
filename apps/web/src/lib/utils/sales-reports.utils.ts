/**
 * Sales Reports Validation and Utility Functions
 */

export interface SalesValidationResult {
  valid: boolean
  errors: string[]
}

export interface SalesReportFormData {
  totalSales: string
  slipImage: File | null
}

/**
 * Validate sales amount input
 */
export function validateSalesAmount(amountStr: string): SalesValidationResult {
  const errors: string[] = []

  if (!amountStr || !amountStr.trim()) {
    errors.push('กรุณากรอกยอดขาย')
    return { valid: false, errors }
  }

  // Remove comma separators for validation
  const cleanAmount = amountStr.replace(/,/g, '')
  const amount = parseFloat(cleanAmount)

  if (isNaN(amount)) {
    errors.push('ยอดขายต้องเป็นตัวเลขเท่านั้น')
  } else {
    // Check if positive
    if (amount <= 0) {
      errors.push('ยอดขายต้องมีค่ามากกว่า 0 บาท')
    }

    // Check maximum value (12 digits + 2 decimal places = 9,999,999,999.99)
    if (amount > 9999999999.99) {
      errors.push('ยอดขายเกินจำนวนที่อนุญาต (สูงสุด 9,999,999,999.99 บาท)')
    }

    // Check decimal places (maximum 2)
    const decimalMatch = cleanAmount.match(/\.(\d+)$/)
    if (decimalMatch && decimalMatch[1].length > 2) {
      errors.push('ยอดขายสามารถมีทศนิยมได้สูงสุด 2 ตำแหน่ง')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Format sales amount for input display (with comma separators)
 */
export function formatSalesAmountForInput(amount: string): string {
  // Remove non-numeric characters except decimal point
  const cleaned = amount.replace(/[^0-9.]/g, '')
  
  // Ensure only one decimal point
  const parts = cleaned.split('.')
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('')
  }
  
  // Limit decimal places to 2
  if (parts.length === 2 && parts[1].length > 2) {
    return parts[0] + '.' + parts[1].substring(0, 2)
  }
  
  // Add comma separators to integer part
  if (parts[0]) {
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
  
  return parts.join('.')
}

/**
 * Parse formatted sales amount to number
 */
export function parseSalesAmount(formattedAmount: string): number {
  const cleaned = formattedAmount.replace(/,/g, '')
  return parseFloat(cleaned) || 0
}

/**
 * Format currency for display in Thai format
 */
export function formatThaiCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Format date for Thai display
 */
export function formatThaiDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return dateObj.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Bangkok'
  })
}

/**
 * Format time for Thai display
 */
export function formatThaiTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return dateObj.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok'
  })
}

/**
 * Format datetime for Thai display
 */
export function formatThaiDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return dateObj.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok'
  })
}

/**
 * Get current date in YYYY-MM-DD format for reports
 */
export function getCurrentReportDate(): string {
  const now = new Date()
  // Adjust for Bangkok timezone
  const bangkokTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
  return bangkokTime.toISOString().split('T')[0]
}

/**
 * Check if a date string is today in Bangkok timezone
 */
export function isToday(dateString: string): boolean {
  const today = getCurrentReportDate()
  return dateString === today
}

/**
 * Validate complete sales report form data
 */
export function validateSalesReportForm(formData: SalesReportFormData): SalesValidationResult {
  const errors: string[] = []

  // Validate sales amount
  const amountValidation = validateSalesAmount(formData.totalSales)
  if (!amountValidation.valid) {
    errors.push(...amountValidation.errors)
  }

  // Validate slip image
  if (!formData.slipImage) {
    errors.push('กรุณาแนบรูปภาพสลิปยืนยันยอดขาย')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Generate summary text for sales report
 */
export function generateReportSummary(totalSales: number, branchName: string): string {
  const formattedAmount = formatThaiCurrency(totalSales)
  const date = formatThaiDate(new Date())
  
  return `รายงานยอดขายสาขา${branchName} วันที่ ${date} ยอดขายรวม ${formattedAmount}`
}