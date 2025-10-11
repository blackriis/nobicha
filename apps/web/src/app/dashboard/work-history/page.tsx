import React from 'react'
import { WorkHistoryPage } from '@/components/employee/WorkHistoryPage'

export default function WorkHistoryRoute() {
 return <WorkHistoryPage />
}

// Metadata for the page
export const metadata = {
 title: 'ประวัติการทำงาน | Employee Management System',
 description: 'ประวัติการ check-in/check-out รายวัน รายสัปดาห์ และรายเดือน'
}