'use client'

import { Button } from '@/components/ui/button'
import { 
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select'
import { 
 ChevronLeft, 
 ChevronRight, 
 ChevronsLeft, 
 ChevronsRight 
} from 'lucide-react'

interface TablePaginationProps {
 currentPage: number
 totalPages: number
 totalItems: number
 itemsPerPage: number
 onPageChange: (page: number) => void
 onItemsPerPageChange: (itemsPerPage: number) => void
}

export function TablePagination({
 currentPage,
 totalPages,
 totalItems,
 itemsPerPage,
 onPageChange,
 onItemsPerPageChange
}: TablePaginationProps) {
 const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)
 const endItem = Math.min(currentPage * itemsPerPage, totalItems)

 const canGoPrevious = currentPage > 1
 const canGoNext = currentPage < totalPages

 const goToFirstPage = () => onPageChange(1)
 const goToPreviousPage = () => onPageChange(Math.max(1, currentPage - 1))
 const goToNextPage = () => onPageChange(Math.min(totalPages, currentPage + 1))
 const goToLastPage = () => onPageChange(totalPages)

 // Generate page numbers to display
 const getVisiblePages = () => {
  const delta = 2
  const pages: number[] = []
  
  for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
   pages.push(i)
  }
  
  return pages
 }

 if (totalItems === 0) {
  return null
 }

 return (
  <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
   {/* Items per page and info */}
   <div className="flex items-center space-x-6 text-sm text-gray-700">
    <div className="flex items-center space-x-2">
     <span>แสดง</span>
     <Select value={itemsPerPage.toString()} onValueChange={(value) => onItemsPerPageChange(parseInt(value))}>
      <SelectTrigger className="w-[70px] h-8">
       <SelectValue />
      </SelectTrigger>
      <SelectContent>
       <SelectItem value="10">10</SelectItem>
       <SelectItem value="20">20</SelectItem>
       <SelectItem value="50">50</SelectItem>
       <SelectItem value="100">100</SelectItem>
      </SelectContent>
     </Select>
     <span>รายการต่อหน้า</span>
    </div>
    
    <div>
     แสดง {startItem}-{endItem} จาก {totalItems} รายการ
    </div>
   </div>

   {/* Pagination controls */}
   <div className="flex items-center space-x-2">
    {/* First page */}
    <Button
     variant="outline"
     size="sm"
     onClick={goToFirstPage}
     disabled={!canGoPrevious}
     className="h-8 w-8 p-0"
    >
     <ChevronsLeft className="h-4 w-4" />
    </Button>

    {/* Previous page */}
    <Button
     variant="outline"
     size="sm"
     onClick={goToPreviousPage}
     disabled={!canGoPrevious}
     className="h-8 w-8 p-0"
    >
     <ChevronLeft className="h-4 w-4" />
    </Button>

    {/* Page numbers */}
    <div className="flex items-center space-x-1">
     {getVisiblePages().map((page) => (
      <Button
       key={page}
       variant={page === currentPage ? "default" : "outline"}
       size="sm"
       onClick={() => onPageChange(page)}
       className="h-8 w-8 p-0"
      >
       {page}
      </Button>
     ))}
    </div>

    {/* Next page */}
    <Button
     variant="outline"
     size="sm"
     onClick={goToNextPage}
     disabled={!canGoNext}
     className="h-8 w-8 p-0"
    >
     <ChevronRight className="h-4 w-4" />
    </Button>

    {/* Last page */}
    <Button
     variant="outline"
     size="sm"
     onClick={goToLastPage}
     disabled={!canGoNext}
     className="h-8 w-8 p-0"
    >
     <ChevronsRight className="h-4 w-4" />
    </Button>
   </div>
  </div>
 )
}