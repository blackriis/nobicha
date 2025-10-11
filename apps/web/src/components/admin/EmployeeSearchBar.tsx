'use client'

import { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmployeeSearchBarProps {
 value: string
 onChange: (value: string) => void
 placeholder?: string
 debounceMs?: number
}

export function EmployeeSearchBar({ 
 value, 
 onChange, 
 placeholder = "ค้นหาชื่อ, อีเมล...",
 debounceMs = 300
}: EmployeeSearchBarProps) {
 const [localValue, setLocalValue] = useState(value)

 // Debounce search input
 const debouncedOnChange = useCallback(
  debounce((newValue: string) => {
   onChange(newValue)
  }, debounceMs),
  [onChange, debounceMs]
 )

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const newValue = e.target.value
  setLocalValue(newValue)
  debouncedOnChange(newValue)
 }

 const handleClear = () => {
  setLocalValue('')
  onChange('')
 }

 return (
  <div className="relative flex-1 max-w-sm">
   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
   <Input
    type="text"
    placeholder={placeholder}
    value={localValue}
    onChange={handleInputChange}
    className="pl-10 pr-10"
   />
   {localValue && (
    <Button
     variant="ghost"
     size="sm"
     onClick={handleClear}
     className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
    >
     <X className="h-3 w-3" />
    </Button>
   )}
  </div>
 )
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
 func: T,
 delay: number
): (...args: Parameters<T>) => void {
 let timeoutId: NodeJS.Timeout
 return (...args: Parameters<T>) => {
  clearTimeout(timeoutId)
  timeoutId = setTimeout(() => func(...args), delay)
 }
}