'use client'

import PayrollExportOptions from './PayrollExportOptions'
import type { PayrollCycle } from '@employee-management/database'

type PayrollView = 'dashboard' | 'calculation' | 'summary' | 'bonus-deduction' | 'export' | 'history'

interface PayrollExportProps {
  cycle: PayrollCycle
  onNavigate: (view: PayrollView, cycle?: PayrollCycle) => void
  onError: (error: string) => void
}

export function PayrollExport({ cycle, onNavigate, onError }: PayrollExportProps) {
  const handleClose = () => {
    onNavigate('dashboard', cycle)
  }

  const handleExportError = (error: string) => {
    onError(`ส่งออกรายงานล้มเหลว: ${error}`)
  }

  return (
    <div className="space-y-6">
      <PayrollExportOptions
        cycleId={cycle.id}
        cycleName={cycle.cycle_name}
        onClose={handleClose}
        onError={handleExportError}
      />
    </div>
  )
}