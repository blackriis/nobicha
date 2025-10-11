'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
 Dialog, 
 DialogContent, 
 DialogDescription, 
 DialogFooter, 
 DialogHeader, 
 DialogTitle 
} from '@/components/ui/dialog'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'

interface DeleteConfirmationDialogProps {
 isOpen: boolean
 onClose: () => void
 onConfirm: () => Promise<void>
 title: string
 description: string
 itemName: string
 isDangerous?: boolean
 loading?: boolean
}

export function DeleteConfirmationDialog({
 isOpen,
 onClose,
 onConfirm,
 title,
 description,
 itemName,
 isDangerous = true,
 loading = false
}: DeleteConfirmationDialogProps) {
 const [confirming, setConfirming] = useState(false)

 const handleConfirm = async () => {
  try {
   setConfirming(true)
   await onConfirm()
  } catch (error) {
   console.error('Delete confirmation error:', error)
  } finally {
   setConfirming(false)
  }
 }

 const handleClose = () => {
  if (!confirming && !loading) {
   onClose()
  }
 }

 return (
  <Dialog open={isOpen} onOpenChange={handleClose}>
   <DialogContent className="sm:max-w-md">
    <DialogHeader>
     <div className="flex items-center gap-3">
      <div className={`rounded-full p-2 ${isDangerous ? 'bg-red-100' : 'bg-orange-100'}`}>
       {isDangerous ? (
        <Trash2 className={`h-5 w-5 ${isDangerous ? 'text-red-600' : 'text-orange-600'}`} />
       ) : (
        <AlertTriangle className={`h-5 w-5 ${isDangerous ? 'text-red-600' : 'text-orange-600'}`} />
       )}
      </div>
      <DialogTitle className="text-lg">{title}</DialogTitle>
     </div>
    </DialogHeader>

    <DialogDescription className="text-gray-600 leading-relaxed">
     {description}
    </DialogDescription>

    {itemName && (
     <div className={`p-3 rounded-lg ${isDangerous ? 'bg-red-50' : 'bg-orange-50'} border ${isDangerous ? 'border-red-200' : 'border-orange-200'}`}>
      <div className="flex items-center gap-2">
       <AlertTriangle className={`h-4 w-4 ${isDangerous ? 'text-red-600' : 'text-orange-600'} flex-shrink-0`} />
       <span className={`font-medium ${isDangerous ? 'text-red-800' : 'text-orange-800'}`}>
        รายการที่จะลบ:
       </span>
      </div>
      <div className={`mt-1 font-mono text-sm ${isDangerous ? 'text-red-700' : 'text-orange-700'} break-all`}>
       "{itemName}"
      </div>
     </div>
    )}

    <div className={`text-sm ${isDangerous ? 'text-red-600' : 'text-orange-600'} bg-yellow-50 border border-yellow-200 rounded-lg p-3`}>
     <div className="flex items-start gap-2">
      <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
      <div>
       <div className="font-medium mb-1">คำเตือน</div>
       <div>การดำเนินการนี้ไม่สามารถย้อนกลับได้ กรุณาตรวจสอบให้แน่ใจก่อนกดยืนยัน</div>
      </div>
     </div>
    </div>

    <DialogFooter className="gap-2">
     <Button
      variant="outline"
      onClick={handleClose}
      disabled={confirming || loading}
     >
      ยกเลิก
     </Button>
     <Button
      variant={isDangerous ? "destructive" : "default"}
      onClick={handleConfirm}
      disabled={confirming || loading}
     >
      {confirming || loading ? (
       <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        กำลังลบ...
       </>
      ) : (
       <>
        <Trash2 className="mr-2 h-4 w-4" />
        ยืนยันลบ
       </>
      )}
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 )
}

// Specialized component for raw material deletion
interface RawMaterialDeleteDialogProps {
 isOpen: boolean
 onClose: () => void
 onConfirm: () => Promise<void>
 rawMaterialName: string
 loading?: boolean
}

export function RawMaterialDeleteDialog({
 isOpen,
 onClose,
 onConfirm,
 rawMaterialName,
 loading = false
}: RawMaterialDeleteDialogProps) {
 return (
  <DeleteConfirmationDialog
   isOpen={isOpen}
   onClose={onClose}
   onConfirm={onConfirm}
   title="ยืนยันการลบวัตถุดิบ"
   description="คุณต้องการลบวัตถุดิบนี้หรือไม่? หากวัตถุดิบนี้มีการใช้งานในระบบแล้ว จะไม่สามารถลบได้"
   itemName={rawMaterialName}
   isDangerous={true}
   loading={loading}
  />
 )
}