/**
 * File Upload Utilities
 * Utilities for handling file uploads and validations
 */

export interface FileValidationResult {
  valid: boolean
  errors: string[]
}

export interface ImagePreviewData {
  file: File
  previewUrl: string
  name: string
  size: number
  type: string
}

/**
 * Validate image file for sales slip upload
 */
export function validateSlipImageFile(file: File): FileValidationResult {
  const errors: string[] = []

  if (!file) {
    errors.push('กรุณาเลือกไฟล์')
    return { valid: false, errors }
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    errors.push('กรุณาเลือกไฟล์รูปภาพเท่านั้น (.jpg, .png, .webp)')
  }

  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    errors.push('ขนาดไฟล์เกิน 5MB กรุณาเลือกไฟล์ที่มีขนาดเล็กกว่า')
  }

  // Check minimum size (1KB to avoid empty files)
  const minSize = 1024 // 1KB
  if (file.size < minSize) {
    errors.push('ไฟล์มีขนาดเล็กเกินไป')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Create image preview URL and metadata
 */
export function createImagePreview(file: File): ImagePreviewData | null {
  try {
    const validation = validateSlipImageFile(file)
    if (!validation.valid) {
      return null
    }

    const previewUrl = URL.createObjectURL(file)
    
    return {
      file,
      previewUrl,
      name: file.name,
      size: file.size,
      type: file.type
    }
  } catch (error) {
    console.error('Error creating image preview:', error)
    return null
  }
}

/**
 * Cleanup object URL to prevent memory leaks
 */
export function revokeImagePreview(previewUrl: string): void {
  try {
    URL.revokeObjectURL(previewUrl)
  } catch (error) {
    console.error('Error revoking object URL:', error)
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * Convert file to base64 string (for small files only)
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Only allow files under 1MB for base64 conversion
    if (file.size > 1024 * 1024) {
      reject(new Error('File too large for base64 conversion'))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to convert file to base64'))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/**
 * Compress image file (basic compression)
 */
export async function compressImage(file: File, maxWidth: number = 1024, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      try {
        // Calculate new dimensions
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        // Set canvas size
        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          file.type,
          quality
        )
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Handle file drop events
 */
export function handleFileDrop(
  event: DragEvent,
  onFileSelect: (file: File) => void,
  onError: (error: string) => void
): void {
  event.preventDefault()
  event.stopPropagation()

  const files = event.dataTransfer?.files
  if (!files || files.length === 0) {
    onError('ไม่พบไฟล์ที่ต้องการอัปโหลด')
    return
  }

  if (files.length > 1) {
    onError('กรุณาเลือกไฟล์เพียงไฟล์เดียว')
    return
  }

  const file = files[0]
  const validation = validateSlipImageFile(file)
  
  if (!validation.valid) {
    onError(validation.errors[0])
    return
  }

  onFileSelect(file)
}