'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  validateSlipImageFile,
  createImagePreview,
  revokeImagePreview,
  formatFileSize,
  handleFileDrop,
  type ImagePreviewData 
} from '@/lib/utils/file-upload.utils'
import { Upload, X, FileImage, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface SlipImageUploadProps {
  onImageSelect: (file: File | null) => void
  disabled?: boolean
  maxFileSize?: number // in MB, default 5MB
}

export function SlipImageUpload({ 
  onImageSelect, 
  disabled = false,
  maxFileSize = 5 
}: SlipImageUploadProps) {
  const [preview, setPreview] = useState<ImagePreviewData | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (preview) {
        revokeImagePreview(preview.previewUrl)
      }
    }
  }, [preview])

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    if (disabled) return

    setUploading(true)

    // Cleanup previous preview
    if (preview) {
      revokeImagePreview(preview.previewUrl)
      setPreview(null)
    }

    // Validate file
    const validation = validateSlipImageFile(file)
    if (!validation.valid) {
      toast.error(validation.errors[0])
      setUploading(false)
      return
    }

    // Create preview
    const previewData = createImagePreview(file)
    if (!previewData) {
      toast.error('ไม่สามารถสร้างตัวอย่างรูปภาพได้')
      setUploading(false)
      return
    }

    setPreview(previewData)
    onImageSelect(file)
    setUploading(false)
    toast.success('เลือกรูปภาพเรียบร้อยแล้ว')
  }, [disabled, preview, onImageSelect])

  // Handle file input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [disabled])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled) return

    handleFileDrop(
      e.nativeEvent,
      handleFileSelect,
      (error) => toast.error(error)
    )
  }, [disabled, handleFileSelect])

  // Handle remove image
  const handleRemoveImage = () => {
    if (preview) {
      revokeImagePreview(preview.previewUrl)
      setPreview(null)
    }
    onImageSelect(null)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle click to select file
  const handleClick = () => {
    if (disabled || uploading) return
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {preview ? (
        /* Image Preview */
        <div className="space-y-4">
          <div className="relative border-2 border-green-200 bg-green-50 rounded-lg p-4">
            <div className="flex items-start gap-4">
              {/* Preview Image */}
              <div className="relative flex-shrink-0">
                <img
                  src={preview.previewUrl}
                  alt="Slip preview"
                  className="h-24 w-24 object-cover rounded-lg border"
                />
                <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800 truncate">
                  {preview.name}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  ขนาด: {formatFileSize(preview.size)}
                </p>
                <p className="text-xs text-green-600">
                  ประเภท: {preview.type}
                </p>
              </div>

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveImage}
                disabled={disabled}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Change Image Button */}
          <Button
            variant="outline"
            onClick={handleClick}
            disabled={disabled || uploading}
            className="w-full"
          >
            <FileImage className="h-4 w-4 mr-2" />
            เปลี่ยนรูปภาพ
          </Button>
        </div>
      ) : (
        /* Upload Area */
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
            }
            ${disabled ? 'cursor-not-allowed opacity-60' : ''}
          `}
          onClick={handleClick}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
              <p className="text-sm text-gray-600">กำลังประมวลผล...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Upload className={`h-8 w-8 ${dragActive ? 'text-blue-600' : 'text-gray-400'}`} />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {dragActive ? 'วางไฟล์รูปภาพที่นี่' : 'คลิกเพื่อเลือกรูปภาพสลิป'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  หรือลากและวางไฟล์รูปภาพ
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* File Requirements Info */}
      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-600">
            <p className="font-medium mb-1">ข้อกำหนดของไฟล์:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>ไฟล์รูปภาพเท่านั้น (.jpg, .png, .webp)</li>
              <li>ขนาดไม่เกิน {maxFileSize}MB</li>
              <li>ควรเป็นรูปภาพที่ชัดเจนอ่านได้</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}