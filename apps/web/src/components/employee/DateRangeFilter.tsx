'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { DateRangeFilter } from '@/lib/services/time-entry.service'

const ranges: { value: DateRangeFilter; label: string }[] = [
  { value: 'today', label: 'วันนี้' },
  { value: 'week', label: '7 วันที่ผ่านมา' },
  { value: 'month', label: '30 วันที่ผ่านมา' }
]

interface DateRangeFilterProps {
  value: DateRangeFilter
  onChange: (range: DateRangeFilter) => void
  disabled?: boolean
}

function DateRangeFilterComponent({ value, onChange, disabled = false }: DateRangeFilterProps) {
  return (
    <div className="flex gap-2 mb-4" data-testid="date-range-filter">
      {ranges.map(({ value: rangeValue, label }) => (
        <Button
          key={rangeValue}
          variant={value === rangeValue ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(rangeValue)}
          disabled={disabled}
          className="text-sm"
          data-testid={`filter-${rangeValue}`}
        >
          {label}
        </Button>
      ))}
    </div>
  )
}

export default React.memo(DateRangeFilterComponent)