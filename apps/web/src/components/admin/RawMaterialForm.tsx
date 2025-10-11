'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
 rawMaterialsService, 
 type RawMaterial, 
 type RawMaterialInput 
} from '@/lib/services/raw-materials.service'
import { 
 validateRawMaterialInput, 
 sanitizeRawMaterialInput,
 COMMON_UNITS,
 getUnitSuggestions
} from '@/lib/utils/raw-materials.utils'
import { X, Save, Loader2 } from 'lucide-react'

const rawMaterialSchema = z.object({
 name: z.string()
  .min(1, 'ชื่อวัตถุดิบเป็นข้อมูลที่จำเป็น')
  .max(100, 'ชื่อวัตถุดิบต้องมีความยาวไม่เกิน 100 ตัวอักษร')
  .refine(
   (name) => /^[\u0E00-\u0E7F\w\s.-]+$/.test(name), 
   'ชื่อวัตถุดิบมีเฉพาะตัวอักษรไทย อังกฤษ ตัวเลข เว้นวรรค จุด และ เครื่องหมายขีด'
  ),
 unit: z.string()
  .min(1, 'หน่วยนับเป็นข้อมูลที่จำเป็น')
  .max(20, 'หน่วยนับต้องมีความยาวไม่เกิน 20 ตัวอักษร')
  .refine(
   (unit) => /^[\u0E00-\u0E7F\w\s.-]+$/.test(unit), 
   'หน่วยนับมีเฉพาะตัวอักษรไทย อังกฤษ ตัวเลข เว้นวรรค จุด และ เครื่องหมายขีด'
  ),
 cost_price: z.number()
  .min(0.01, 'ราคาต้นทุนต้องมากกว่า 0')
  .max(999999999.99, 'ราคาต้นทุนต้องไม่เกิน 999,999,999.99')
  .refine(
   (price) => {
    const str = price.toString()
    const decimalPart = str.split('.')[1]
    return !decimalPart || decimalPart.length <= 2
   },
   'ราคาต้นทุนสามารถมีทศนิยมได้สูงสุด 2 ตำแหน่ง'
  )
})

interface RawMaterialFormProps {
 rawMaterial?: RawMaterial | null
 onSave: (rawMaterial: RawMaterial) => void
 onCancel: () => void
}

export function RawMaterialForm({ rawMaterial, onSave, onCancel }: RawMaterialFormProps) {
 const [loading, setLoading] = useState(false)
 const [error, setError] = useState<string | null>(null)
 const [unitSuggestions, setUnitSuggestions] = useState<string[]>(COMMON_UNITS.slice(0, 5))
 const [showUnitSuggestions, setShowUnitSuggestions] = useState(false)

 const isEditing = !!rawMaterial

 const form = useForm<RawMaterialInput>({
  resolver: zodResolver(rawMaterialSchema),
  defaultValues: {
   name: rawMaterial?.name || '',
   unit: rawMaterial?.unit || '',
   cost_price: rawMaterial?.cost_price || 0
  }
 })

 const { watch, setValue, handleSubmit, formState: { errors } } = form

 const unitValue = watch('unit')

 // Update unit suggestions based on input
 useEffect(() => {
  const suggestions = getUnitSuggestions(unitValue)
  setUnitSuggestions(suggestions)
 }, [unitValue])

 const onSubmit = async (data: RawMaterialInput) => {
  try {
   setLoading(true)
   setError(null)

   // Client-side validation
   const validation = validateRawMaterialInput(data)
   if (!validation.valid) {
    setError(validation.errors[0])
    return
   }

   // Sanitize input
   const sanitizedData = sanitizeRawMaterialInput(data) as RawMaterialInput

   // Call service
   let result
   if (isEditing && rawMaterial) {
    result = await rawMaterialsService.updateRawMaterial(rawMaterial.id, sanitizedData)
   } else {
    result = await rawMaterialsService.createRawMaterial(sanitizedData)
   }

   if (!result.success) {
    setError(result.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    return
   }

   // Success
   onSave(result.data!)

  } catch (error) {
   console.error('Form submission error:', error)
   setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
  } finally {
   setLoading(false)
  }
 }

 const handleUnitSuggestionClick = (unit: string) => {
  setValue('unit', unit)
  setShowUnitSuggestions(false)
 }

 const handleCostPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value
  
  // Allow empty input
  if (value === '') {
   setValue('cost_price', 0)
   return
  }

  // Parse number
  const parsed = parseFloat(value)
  if (!isNaN(parsed)) {
   // Round to 2 decimal places
   const rounded = Math.round(parsed * 100) / 100
   setValue('cost_price', rounded)
  }
 }

 return (
  <Card className="w-full max-w-2xl mx-auto">
   <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle>
     {isEditing ? 'แก้ไขวัตถุดิบ' : 'เพิ่มวัตถุดิบใหม่'}
    </CardTitle>
    <Button
     variant="ghost"
     size="sm"
     onClick={onCancel}
     disabled={loading}
    >
     <X className="h-4 w-4" />
    </Button>
   </CardHeader>

   <CardContent>
    <Form {...form}>
     <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
       <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
       </div>
      )}

      <FormField
       control={form.control}
       name="name"
       render={({ field }) => (
        <FormItem>
         <FormLabel>ชื่อวัตถุดิบ *</FormLabel>
         <FormControl>
          <Input
           placeholder="กรอกชื่อวัตถุดิบ เช่น น้ำมันพืช, แป้งสาลี"
           {...field}
           disabled={loading}
          />
         </FormControl>
         <FormMessage />
        </FormItem>
       )}
      />

      <FormField
       control={form.control}
       name="unit"
       render={({ field }) => (
        <FormItem>
         <FormLabel>หน่วยนับ *</FormLabel>
         <FormControl>
          <div className="relative">
           <Input
            placeholder="กรอกหน่วยนับ เช่น กิโลกรัม, ลิตร"
            {...field}
            disabled={loading}
            onFocus={() => setShowUnitSuggestions(true)}
            onBlur={() => {
             // Delay hiding suggestions to allow click
             setTimeout(() => setShowUnitSuggestions(false), 200)
            }}
           />
           
           {showUnitSuggestions && unitSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md max-h-60 overflow-auto">
             {unitSuggestions.map((unit, index) => (
              <button
               key={index}
               type="button"
               onClick={() => handleUnitSuggestionClick(unit)}
               className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              >
               {unit}
              </button>
             ))}
            </div>
           )}
          </div>
         </FormControl>
         <FormMessage />
        </FormItem>
       )}
      />

      <FormField
       control={form.control}
       name="cost_price"
       render={({ field }) => (
        <FormItem>
         <FormLabel>ราคาต้นทุนต่อหน่วย (บาท) *</FormLabel>
         <FormControl>
          <div className="relative">
           <Input
            type="number"
            step="0.01"
            min="0"
            max="999999999.99"
            placeholder="กรอกราคาต้นทุน เช่น 25.50"
            {...field}
            value={field.value || ''}
            onChange={handleCostPriceChange}
            disabled={loading}
            className="pr-12"
           />
           <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            ฿
           </div>
          </div>
         </FormControl>
         <FormMessage />
         {watch('cost_price') > 0 && (
          <p className="text-sm text-gray-600">
           แสดง: {rawMaterialsService.formatCurrency(watch('cost_price'))} ต่อ {watch('unit') || 'หน่วย'}
          </p>
         )}
        </FormItem>
       )}
      />

      <div className="flex justify-end gap-3 pt-4">
       <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={loading}
       >
        ยกเลิก
       </Button>
       <Button
        type="submit"
        disabled={loading}
       >
        {loading ? (
         <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          กำลังบันทึก...
         </>
        ) : (
         <>
          <Save className="mr-2 h-4 w-4" />
          {isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มวัตถุดิบ'}
         </>
        )}
       </Button>
      </div>
     </form>
    </Form>

    {isEditing && rawMaterial && (
     <div className="mt-6 pt-6 border-t">
      <div className="text-sm text-gray-500 space-y-1">
       <p><span className="font-medium">รหัส:</span> {rawMaterial.id}</p>
       <p>
        <span className="font-medium">สร้างเมื่อ:</span>{' '}
        {rawMaterialsService.formatDate(rawMaterial.created_at)}
       </p>
      </div>
     </div>
    )}
   </CardContent>
  </Card>
 )
}