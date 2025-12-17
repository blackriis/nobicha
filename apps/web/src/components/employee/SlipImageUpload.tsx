'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
 validateSlipImageFile,
 createImagePreview,
 revokeImagePreview,
 formatFileSize,
 handleFileDrop,
 compressImage,
 type ImagePreviewData
} from '@/lib/utils/file-upload.utils'
import { Upload, X, FileImage, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface SlipImageUploadProps {
 onImageSelect: (file: File | null) => void
 disabled?: boolean
 maxFileSize?: number // in MB, default 5MB
 enableCompression?: boolean // เปิด/ปิดการบีบอัด
 compressionOptions?: {
  maxWidth?: number
  quality?: number
 }
}

export function SlipImageUpload({
 onImageSelect,
 disabled = false,
 maxFileSize = 5,
 enableCompression = true,
 compressionOptions = {
  maxWidth: 1024,
  quality: 0.8
 }
}: SlipImageUploadProps) {
 const [preview, setPreview] = useState<ImagePreviewData | null>(null)
 const [dragActive, setDragActive] = useState(false)
 const [uploading, setUploading] = useState(false)
 const [compressing, setCompressing] = useState(false)
 const [originalSize, setOriginalSize] = useState<number | null>(null)
 const fileInputRef = useRef<HTMLInputElement>(null)

 // Cleanup preview URL on unmount
 useEffect(() => {
  return () => {
   if (preview) {
    revokeImagePreview(preview.previewUrl)
   }
  }
 }, [preview])

 // Handle file selection with compression
 const handleFileSelect = useCallback(async (file: File) => {
  if (disabled) return

  setUploading(true)
  setOriginalSize(file.size)

  // Cleanup previous preview
  if (preview) {
   revokeImagePreview(preview.previewUrl)
   setPreview(null)
  }

  // Validate original file
  const validation = validateSlipImageFile(file)
  if (!validation.valid) {
   toast.error(validation.errors[0])
   setUploading(false)
   return
  }

  let processedFile = file

  // Apply compression if enabled
  if (enableCompression) {
   setCompressing(true)
   try {
    // Check if file needs compression (only compress if larger than 500KB)
    if (file.size > 500 * 1024) {
     processedFile = await compressImage(
      file,
      compressionOptions?.maxWidth || 1024,
      compressionOptions?.quality || 0.8
     )

     const compressionRatio = ((file.size - processedFile.size) / file.size * 100).toFixed(1)
     toast.success(`บีบอัดรูปภาพสำเร็จ ลดลง ${compressionRatio}%`)
    }
   } catch (error) {
    console.error('Compression error:', error)
    toast.error('การบีบอัดรูปภาพล้มเหลว ใช้ไฟล์ต้นฉบับ')
    // Use original file if compression fails
   } finally {
    setCompressing(false)
   }
  }

  // Validate processed file again (in case compression changed something)
  const processedValidation = validateSlipImageFile(processedFile)
  if (!processedValidation.valid) {
   toast.error('ไฟล์ที่บีบอัดไม่ผ่านการตรวจสอบ')
   setUploading(false)
   return
  }

  // Create preview
  const previewData = createImagePreview(processedFile)
  if (!previewData) {
   toast.error('ไม่สามารถสร้างตัวอย่างรูปภาพได้')
   setUploading(false)
   return
  }

  setPreview(previewData)
  onImageSelect(processedFile)
  setUploading(false)

  // Show success message
  if (enableCompression && originalSize && originalSize !== processedFile.size) {
   const savedSpace = formatFileSize(originalSize - processedFile.size)
   toast.success(`เลือกรูปภาพเรียบร้อย (ประหยัดพื้นที่ ${savedSpace})`)
  } else {
   toast.success('เลือกรูปภาพเรียบร้อยแล้ว')
  }
 }, [disabled, preview, onImageSelect, enableCompression, compressionOptions, originalSize])

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
  setOriginalSize(null)

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
        {/* Show compression info */}
        {enableCompression && originalSize && originalSize !== preview.size && (
         <p className="text-xs text-green-600">
          ประหยัด: {formatFileSize(originalSize - preview.size)} ({((originalSize - preview.size) / originalSize * 100).toFixed(1)}%)
         </p>
        )}
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
     {uploading || compressing ? (
      <div className="flex flex-col items-center gap-3">
       <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
       <p className="text-sm text-gray-600">
        {compressing ? (
         <>
          <Loader2 className="inline h-4 w-4 mr-2 animate-spin" />
          กำลังบีบอัดรูปภาพ...
         </>
        ) : (
         'กำลังประมวลผล...'
        )}
       </p>
       {enableCompression && (
        <p className="text-xs text-gray-500">
         รูปภาพที่มีขนาดเกิน 500KB จะถูกบีบอัดอัตโนมัติ
        </p>
       )}
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
        {enableCompression && (
         <p className="text-xs text-blue-600 mt-2">
          <Loader2 className="inline h-3 w-3 mr-1" />
          บีบอัดอัตโนมัติ (สูงสุด {compressionOptions?.maxWidth || 1024}px, คุณภาพ {compressionOptions?.quality || 0.8})
         </p>
        )}
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
       {enableCompression && (
        <li>รูปภาพจะถูกบีบอัดอัตโนมัติเพื่อประสิทธิภาพ</li>
       )}
      </ul>
     </div>
    </div>
   </div>
  </div>
 )
}