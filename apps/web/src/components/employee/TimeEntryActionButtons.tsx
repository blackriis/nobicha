'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Camera, LogOut } from 'lucide-react'
import { timeEntryService, type TimeEntryStatus } from '@/lib/services/time-entry.service'
import { SmartStatusIndicator } from './SmartStatusIndicator'
import { cn } from '@/lib/utils'

interface TimeEntryActionButtonsProps {
  isProcessing: boolean
  employeeId?: string
  onCheckIn: () => void
  onCheckOut: () => void
}

// Constants for button styling
const BUTTON_BASE_STYLES = "w-full h-12 text-lg font-semibold shadow-lg rounded-lg text-white"
const BUTTON_CONTENT_STYLES = "flex items-center justify-center space-x-2"
const ICON_STYLES = "h-5 w-5"
const TEXT_STYLES = "text-left leading-tight"

// Button variants
const BUTTON_VARIANTS = {
  checkIn: cn(BUTTON_BASE_STYLES, "bg-primary"),
  checkOut: cn(BUTTON_BASE_STYLES, "bg-destructive")
} as const

// Action button configuration
const ACTION_CONFIG = {
  checkIn: {
    icon: Camera,
    text: 'เช็คอิน',
    variant: 'checkIn' as const,
    testId: 'checkin-button',
    action: 'checkin' as const
  },
  checkOut: {
    icon: LogOut,
    text: 'เช็คเอาท์',
    variant: 'checkOut' as const,
    testId: 'checkout-button',
    action: 'checkout' as const
  }
} as const

export function TimeEntryActionButtons({
  isProcessing,
  employeeId,
  onCheckIn,
  onCheckOut
}: TimeEntryActionButtonsProps) {
  const [status, setStatus] = useState<TimeEntryStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadStatus = useCallback(async () => {
    if (!employeeId) return
    
    try {
      setIsLoading(true)
      const statusData = await timeEntryService.getStatus()
      setStatus(statusData)
    } catch (error) {
      console.error('Error loading status:', error)
    } finally {
      setIsLoading(false)
    }
  }, [employeeId])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  const isCheckedIn = status?.isCheckedIn ?? false
  const isButtonDisabled = isProcessing || !employeeId || isLoading
  const displayText = isButtonDisabled ? 'กำลังดำเนินการ...' : ''

  // Render action button component
  const renderActionButton = (
    config: typeof ACTION_CONFIG.checkIn | typeof ACTION_CONFIG.checkOut,
    onClick: () => void
  ) => {
    const IconComponent = config.icon
    const buttonText = displayText || config.text

    return (
      <Button
        onClick={onClick}
        disabled={isButtonDisabled}
        data-testid={config.testId}
        data-action={config.action}
        size="lg"
        className={BUTTON_VARIANTS[config.variant]}
      >
        <div className={BUTTON_CONTENT_STYLES}>
          <IconComponent className={ICON_STYLES} />
          <div className={TEXT_STYLES}>
            <div>{buttonText}</div>
          </div>
        </div>
      </Button>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4 py-8">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-700 mb-4">
            กำลังตรวจสอบสถานะ...
          </div>
          <Progress value={undefined} className="w-full h-2" />
        </div>
      </div>
    )
  }

  // Check-in state
  if (!isCheckedIn) {
    return (
      <div className="space-y-4">
        <SmartStatusIndicator 
          isCheckedIn={false}
          currentSessionHours={0}
        />
        {renderActionButton(ACTION_CONFIG.checkIn, onCheckIn)}
      </div>
    )
  }

  // Check-out state
  return (
    <div className="space-y-6">
      <SmartStatusIndicator 
        isCheckedIn={true}
        currentSessionHours={status?.activeEntry?.currentSessionHours ?? 0}
        branchName={status?.activeEntry?.branch.name}
      />
      {renderActionButton(ACTION_CONFIG.checkOut, onCheckOut)}
    </div>
  )
}