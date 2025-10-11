'use client'

import { useState, useEffect, useReducer, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
 rawMaterialsService, 
 type RawMaterial,
 type RawMaterialsListParams 
} from '@/lib/services/raw-materials.service'
import { Search, ChevronDown, ChevronUp, Plus, Edit2, Trash2 } from 'lucide-react'

interface RawMaterialsListProps {
 onAddRawMaterial: () => void
 onEditRawMaterial: (rawMaterial: RawMaterial) => void
 onDeleteRawMaterial: (rawMaterial: RawMaterial) => void
 refreshTrigger?: number
}

type SortField = 'name' | 'cost_per_unit' | 'created_at'
type SortOrder = 'asc' | 'desc'

interface State {
 currentPage: number
 totalPages: number
 totalItems: number
 searchTerm: string
 sortField: SortField
 sortOrder: SortOrder
}

type Action =
 | { type: 'SET_PAGE'; page: number }
 | { type: 'SET_TOTAL_PAGES'; totalPages: number }
 | { type: 'SET_TOTAL_ITEMS'; totalItems: number }
 | { type: 'SET_SEARCH_TERM'; searchTerm: string }
 | { type: 'SET_SORT_FIELD'; sortField: SortField }
 | { type: 'TOGGLE_SORT_ORDER' }
 | { type: 'RESET_PAGE' }

const initialState: State = {
 currentPage: 1,
 totalPages: 1,
 totalItems: 0,
 searchTerm: '',
 sortField: 'name',
 sortOrder: 'asc',
}

function reducer(state: State, action: Action): State {
 switch (action.type) {
  case 'SET_PAGE':
   return { ...state, currentPage: action.page }
  case 'SET_TOTAL_PAGES':
   return { ...state, totalPages: action.totalPages }
  case 'SET_TOTAL_ITEMS':
   return { ...state, totalItems: action.totalItems }
  case 'SET_SEARCH_TERM':
   return { ...state, searchTerm: action.searchTerm }
  case 'SET_SORT_FIELD':
   return { ...state, sortField: action.sortField, sortOrder: 'asc' }
  case 'TOGGLE_SORT_ORDER':
   return { ...state, sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc' }
  case 'RESET_PAGE':
   return { ...state, currentPage: 1 }
  default:
   return state
 }
}

function SortIcon({ field, currentField, order }: { field: SortField, currentField: SortField, order: SortOrder }) {
 if (field !== currentField) return null
 return order === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
}

function LoadingState() {
 return (
  <Card>
   <CardContent className="p-6">
    <div className="text-center">กำลังโหลดข้อมูลวัตถุดิบ...</div>
   </CardContent>
  </Card>
 )
}

function ErrorState({ error, onRetry }: { error: string, onRetry: () => void }) {
 return (
  <Card>
   <CardContent className="p-6">
    <div className="text-center text-red-600">
     <p>{error}</p>
     <Button 
      onClick={onRetry} 
      variant="outline" 
      className="mt-2"
     >
      ลองใหม่
     </Button>
    </div>
   </CardContent>
  </Card>
 )
}

function EmptyState({ searchTerm, onAdd }: { searchTerm: string, onAdd: () => void }) {
 if (searchTerm) {
  return (
   <div className="p-6 text-center">
    <p className="text-gray-500 dark:text-gray-400 mb-2">ไม่พบวัตถุดิบที่ค้นหา</p>
    <p className="text-sm text-gray-400 dark:text-gray-500">ลองเปลี่ยนคำค้นหาหรือเพิ่มวัตถุดิบใหม่</p>
   </div>
  )
 }
 return (
  <div className="p-6 text-center">
   <p className="text-gray-500 dark:text-gray-400 mb-4">ยังไม่มีวัตถุดิบในระบบ</p>
   <Button onClick={onAdd}>เพิ่มวัตถุดิบแรก</Button>
  </div>
 )
}

export function RawMaterialsList({
 onAddRawMaterial,
 onEditRawMaterial,
 onDeleteRawMaterial,
 refreshTrigger = 0
}: RawMaterialsListProps) {
 const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)

 const [state, dispatch] = useReducer(reducer, initialState)
 const { currentPage, totalPages, totalItems, searchTerm, sortField, sortOrder } = state

 const itemsPerPage = 20

 const fetchRawMaterials = useCallback(async () => {
  try {
   setLoading(true)
   setError(null)

   const params: RawMaterialsListParams = {
    page: currentPage,
    limit: itemsPerPage,
    sortBy: sortField,
    sortOrder: sortOrder
   }

   if (searchTerm.trim()) {
    params.search = searchTerm.trim()
   }

   const result = await rawMaterialsService.getRawMaterials(params)

   if (!result.success) {
    throw new Error(result.error || 'ไม่สามารถดึงข้อมูลวัตถุดิบได้')
   }

   setRawMaterials(result.data?.data || [])
   dispatch({ type: 'SET_TOTAL_PAGES', totalPages: result.data?.pagination.totalPages || 1 })
   dispatch({ type: 'SET_TOTAL_ITEMS', totalItems: result.data?.pagination.total || 0 })

  } catch (error) {
   console.error('Error fetching raw materials:', error)
   setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล')
  } finally {
   setLoading(false)
  }
 }, [currentPage, sortField, sortOrder, searchTerm])

 useEffect(() => {
  fetchRawMaterials()
 }, [refreshTrigger, fetchRawMaterials])

 // Debounced search effect
 useEffect(() => {
  const debounceTimer = setTimeout(() => {
   if (currentPage !== 1) {
    dispatch({ type: 'RESET_PAGE' }) // Reset to first page on search
   } else {
    fetchRawMaterials()
   }
  }, 300)

  return () => clearTimeout(debounceTimer)
 }, [searchTerm, currentPage, fetchRawMaterials])

 const handleSort = (field: SortField) => {
  if (field === sortField) {
   dispatch({ type: 'TOGGLE_SORT_ORDER' })
  } else {
   dispatch({ type: 'SET_SORT_FIELD', sortField: field })
  }
 }

 const handleDelete = (rawMaterial: RawMaterial) => {
  if (window.confirm(`คุณต้องการลบวัตถุดิบ "${rawMaterial.name}" หรือไม่?`)) {
   onDeleteRawMaterial(rawMaterial)
  }
 }

 const handlePageChange = (page: number) => {
  if (page >= 1 && page <= totalPages) {
   dispatch({ type: 'SET_PAGE', page })
  }
 }

 if (loading && rawMaterials.length === 0) {
  return <LoadingState />
 }

 if (error && rawMaterials.length === 0) {
  return <ErrorState error={error} onRetry={fetchRawMaterials} />
 }

 return (
  <div className="space-y-4">
   {/* Header */}
   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
     <h2 className="text-2xl font-semibold">จัดการวัตถุดิบ</h2>
     <p className="text-gray-600 dark:text-gray-400">
      จำนวนวัตถุดิบทั้งหมด: {totalItems.toLocaleString('th-TH')} รายการ
     </p>
    </div>
    <Button onClick={onAddRawMaterial}>
     <Plus className="h-4 w-4 mr-2" />
     เพิ่มวัตถุดิบใหม่
    </Button>
   </div>

   {/* Search Bar */}
   <Card>
    <CardContent className="p-4">
     <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
      <Input
       placeholder="ค้นหาวัตถุดิบ..."
       value={searchTerm}
       onChange={(e) => dispatch({ type: 'SET_SEARCH_TERM', searchTerm: e.target.value })}
       className="pl-10"
      />
     </div>
    </CardContent>
   </Card>

   {/* Raw Materials Table */}
   <Card>
    <CardContent className="p-0">
     {rawMaterials.length === 0 ? (
      <EmptyState searchTerm={searchTerm} onAdd={onAddRawMaterial} />
     ) : (
      <>
       <div className="overflow-x-auto">
        <table className="w-full">
         <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
          <tr>
           <th className="px-6 py-3 text-left">
            <button
             onClick={() => handleSort('name')}
             className="flex items-center gap-1 font-medium text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300"
            >
             ชื่อวัตถุดิบ
             <SortIcon field="name" currentField={sortField} order={sortOrder} />
            </button>
           </th>
           <th className="px-6 py-3 text-left">
            <span className="font-medium text-gray-900 dark:text-gray-100">หน่วยนับ</span>
           </th>
           <th className="px-6 py-3 text-right">
            <button
             onClick={() => handleSort('cost_per_unit')}
             className="flex items-center gap-1 font-medium text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300 ml-auto"
            >
             ราคาต้นทุน
             <SortIcon field="cost_per_unit" currentField={sortField} order={sortOrder} />
            </button>
           </th>
           <th className="px-6 py-3 text-left">
            <button
             onClick={() => handleSort('created_at')}
             className="flex items-center gap-1 font-medium text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300"
            >
             วันที่สร้าง
             <SortIcon field="created_at" currentField={sortField} order={sortOrder} />
            </button>
           </th>
           <th className="px-6 py-3 text-center">
            <span className="font-medium text-gray-900 dark:text-gray-100">การจัดการ</span>
           </th>
          </tr>
         </thead>
         <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {rawMaterials.map((material) => (
           <tr key={material.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td className="px-6 py-4">
             <div className="font-medium text-gray-900 dark:text-gray-100">
              {material.name}
             </div>
            </td>
            <td className="px-6 py-4">
             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
              {material.unit}
             </span>
            </td>
            <td className="px-6 py-4 text-right">
             <span className="font-mono text-gray-900 dark:text-gray-100">
              {rawMaterialsService.formatCurrency(material.cost_per_unit)}
             </span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
             {rawMaterialsService.formatDate(material.created_at)}
            </td>
            <td className="px-6 py-4">
             <div className="flex items-center justify-center gap-2">
              <Button
               variant="ghost"
               size="sm"
               onClick={() => onEditRawMaterial(material)}
               className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
               <Edit2 className="h-4 w-4" />
              </Button>
              <Button
               variant="ghost"
               size="sm"
               onClick={() => handleDelete(material)}
               className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
               <Trash2 className="h-4 w-4" />
              </Button>
             </div>
            </td>
           </tr>
          ))}
         </tbody>
        </table>
       </div>

       {/* Pagination */}
       {totalPages > 1 && (
        <div className="px-6 py-4 border-t bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700">
         <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
           แสดงรายการ {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} 
           จากทั้งหมด {totalItems.toLocaleString('th-TH')} รายการ
          </div>
          <div className="flex items-center gap-2">
           <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
           >
            ก่อนหน้า
           </Button>
           
           <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
             let pageNum
             if (totalPages <= 5) {
              pageNum = i + 1
             } else if (currentPage <= 3) {
              pageNum = i + 1
             } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i
             } else {
              pageNum = currentPage - 2 + i
             }

             return (
              <Button
               key={pageNum}
               variant={currentPage === pageNum ? "default" : "outline"}
               size="sm"
               onClick={() => handlePageChange(pageNum)}
               disabled={loading}
               className="w-10"
              >
               {pageNum}
              </Button>
             )
            })}
           </div>

           <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
           >
            ถัดไป
           </Button>
          </div>
         </div>
        </div>
       )}
      </>
     )}
    </CardContent>
   </Card>

   {loading && rawMaterials.length > 0 && (
    <div className="text-center py-2">
     <span className="text-sm text-gray-500 dark:text-gray-400">กำลังโหลด...</span>
    </div>
   )}
  </div>
 )
}