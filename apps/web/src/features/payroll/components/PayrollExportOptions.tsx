'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { PayrollService } from '../services/payroll.service'

interface PayrollExportOptionsProps {
  cycleId: string
  cycleName: string
  onClose?: () => void
  onError?: (error: string) => void
}

export default function PayrollExportOptions({ 
  cycleId, 
  cycleName, 
  onClose,
  onError 
}: PayrollExportOptionsProps) {
  const [exporting, setExporting] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json'>('csv')
  const [includeDetails, setIncludeDetails] = useState(true)
  const [exportStatus, setExportStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  const handleExport = async () => {
    setExporting(true)
    setExportStatus({ type: null, message: '' })
    
    try {
      const result = await PayrollService.exportPayrollReport(
        cycleId, 
        selectedFormat, 
        includeDetails
      )
      
      if (result.success) {
        if (selectedFormat === 'csv' && result.data instanceof Blob) {
          // Download CSV file
          const filename = `payroll-${cycleName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`
          PayrollService.downloadCSVFile(result.data, filename)
          
          setExportStatus({
            type: 'success',
            message: `ส่งออกไฟล์ CSV เรียบร้อยแล้ว: ${filename}`
          })
        } else if (selectedFormat === 'json') {
          // Download JSON file
          const filename = `payroll-${cycleName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`
          const jsonString = JSON.stringify(result.data, null, 2)
          const blob = new Blob([jsonString], { type: 'application/json' })
          PayrollService.downloadCSVFile(blob, filename)
          
          setExportStatus({
            type: 'success',
            message: `ส่งออกไฟล์ JSON เรียบร้อยแล้ว: ${filename}`
          })
        }
      } else {
        const errorMessage = result.error || 'เกิดข้อผิดพลาดในการส่งออก'
        setExportStatus({
          type: 'error',
          message: errorMessage
        })
        if (onError) {
          onError(errorMessage)
        }
      }
    } catch (err) {
      const errorMessage = 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
      setExportStatus({
        type: 'error',
        message: errorMessage
      })
      console.error('Export error:', err)
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setExporting(false)
    }
  }

  const exportOptions = [
    {
      format: 'csv' as const,
      title: 'Excel/CSV File',
      description: 'ไฟล์ที่เปิดได้ด้วย Excel หรือ Google Sheets',
      icon: '📊',
      pros: ['เปิดง่ายด้วย Excel', 'ขนาดไฟล์เล็ก', 'เหมาะสำหรับการพิมพ์'],
      cons: ['ไม่มีสีหรือการจัดรูปแบบ', 'ข้อมูลเป็น Plain Text']
    },
    {
      format: 'json' as const,
      title: 'JSON Data',
      description: 'ข้อมูลในรูปแบบ JSON สำหรับระบบอื่น',
      icon: '🔧',
      pros: ['มีโครงสร้างข้อมูลครบถ้วน', 'เหมาะสำหรับการพัฒนาต่อ'],
      cons: ['ต้องใช้เครื่องมือพิเศษในการดู', 'ไม่เหมาะสำหรับคนทั่วไป']
    }
  ]

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            ส่งออกรายงานเงินเดือน
          </h3>
          <p className="text-sm text-gray-600">
            รอบ: {cycleName}
          </p>
        </div>
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose}>
            ✕ ปิด
          </Button>
        )}
      </div>

      {/* Format Selection */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">เลือกรูปแบบไฟล์:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exportOptions.map((option) => (
            <div
              key={option.format}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedFormat === option.format
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedFormat(option.format)}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{option.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h5 className="font-medium text-gray-900">{option.title}</h5>
                    {selectedFormat === option.format && (
                      <Badge className="bg-blue-100 text-blue-800">เลือกแล้ว</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                  
                  <div className="text-xs text-gray-500">
                    <div className="mb-1">
                      <span className="text-green-600">✓ ข้อดี:</span> {option.pros.join(', ')}
                    </div>
                    <div>
                      <span className="text-orange-600">⚠ ข้อจำกัด:</span> {option.cons.join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Options */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">ตัวเลือกการส่งออก:</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-900">
                รวมรายละเอียดพนักงาน
              </span>
              <p className="text-xs text-gray-500">
                รวมข้อมูลส่วนตัว, สาขา, และรายละเอียดการคำนวณของพนักงานแต่ละคน
              </p>
            </div>
            <Switch
              checked={includeDetails}
              onCheckedChange={setIncludeDetails}
            />
          </div>
        </div>
      </div>

      {/* Export Status */}
      {exportStatus.type && (
        <div className={`mb-4 p-3 rounded-lg ${
          exportStatus.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`text-sm ${
            exportStatus.type === 'success' ? 'text-green-600' : 'text-red-600'
          }`}>
            {exportStatus.type === 'success' ? '✅' : '❌'} {exportStatus.message}
          </p>
        </div>
      )}

      {/* Preview Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h5 className="font-medium text-gray-900 mb-2">ตัวอย่างข้อมูลที่จะส่งออก:</h5>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• ข้อมูลรอบการจ่ายเงินเดือน (ชื่อ, วันที่, สถานะ)</p>
          <p>• สรุปยอดรวม (จำนวนพนักงาน, ค่าแรง, โบนัส, หักเงิน, เงินเดือนสุทธิ)</p>
          <p>• สรุปตามสาขา (ถ้ามี)</p>
          {includeDetails && (
            <>
              <p>• รายละเอียดพนักงานแต่ละคน</p>
              <p>• ข้อมูลการติดต่อและสาขา</p>
              <p>• รายละเอียดการคำนวณเงินเดือน</p>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          <p>💡 แนะนำ: ใช้ CSV สำหรับการดูข้อมูลทั่วไป, JSON สำหรับนำไปพัฒนาต่อ</p>
        </div>
        
        <div className="space-x-2">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
          )}
          <Button 
            onClick={handleExport}
            disabled={exporting}
            className="min-w-[120px]"
          >
            {exporting ? (
              <span className="flex items-center space-x-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>กำลังส่งออก...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <span>📥</span>
                <span>ส่งออก {selectedFormat.toUpperCase()}</span>
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Format Details */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          {selectedFormat === 'csv' ? (
            <div>
              <p className="font-medium mb-1">รายละเอียดไฟล์ CSV:</p>
              <p>• รองรับภาษาไทยและสัญลักษณ์พิเศษ (UTF-8 with BOM)</p>
              <p>• เปิดได้ทันทีด้วย Microsoft Excel หรือ Google Sheets</p>
              <p>• มีข้อมูลสรุปและรายละเอียดในไฟล์เดียวกัน</p>
            </div>
          ) : (
            <div>
              <p className="font-medium mb-1">รายละเอียดไฟล์ JSON:</p>
              <p>• ข้อมูลในรูปแบบโครงสร้างที่ครบถ้วน</p>
              <p>• เหมาะสำหรับการนำไปประมวลผลหรือพัฒนาระบบอื่น</p>
              <p>• รวมข้อมูล metadata และการตรวจสอบความถูกต้อง</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}