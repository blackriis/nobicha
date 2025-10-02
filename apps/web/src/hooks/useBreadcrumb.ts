import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

export interface BreadcrumbItem {
  label: string
  href?: string
  isCurrentPage?: boolean
}

export function useBreadcrumb(): BreadcrumbItem[] {
  const pathname = usePathname()

  return useMemo(() => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []

    // Always start with Admin if we're in admin section
    if (pathSegments[0] === 'admin') {
      breadcrumbs.push({
        label: 'แผงควบคุม',
        href: '/admin'
      })

      // Build breadcrumbs based on the path structure
      if (pathSegments.length > 1) {
        switch (pathSegments[1]) {
          case 'employees':
            breadcrumbs.push({
              label: 'จัดการพนักงาน',
              href: pathSegments.length === 2 ? undefined : '/admin/employees'
            })
            
            if (pathSegments.length > 2) {
              const employeeId = pathSegments[2]
              
              if (pathSegments[3] === 'edit') {
                breadcrumbs.push({
                  label: 'รายละเอียดพนักงาน',
                  href: `/admin/employees/${employeeId}`
                })
                breadcrumbs.push({
                  label: 'แก้ไขข้อมูล',
                  isCurrentPage: true
                })
              } else if (pathSegments[2] === 'add') {
                breadcrumbs.push({
                  label: 'เพิ่มพนักงานใหม่',
                  isCurrentPage: true
                })
              } else {
                breadcrumbs.push({
                  label: 'รายละเอียดพนักงาน',
                  isCurrentPage: true
                })
              }
            }
            break

          case 'branches':
            breadcrumbs.push({
              label: 'จัดการสาขา',
              href: pathSegments.length === 2 ? undefined : '/admin/branches'
            })
            
            if (pathSegments.length > 2) {
              const branchId = pathSegments[2]
              if (pathSegments[3] === 'shifts') {
                breadcrumbs.push({
                  label: 'รายละเอียดสาขา',
                  href: `/admin/branches/${branchId}`
                })
                breadcrumbs.push({
                  label: 'การจัดการกะการทำงาน',
                  isCurrentPage: true
                })
              } else {
                breadcrumbs.push({
                  label: 'รายละเอียดสาขา',
                  isCurrentPage: true
                })
              }
            }
            break

          case 'reports':
            breadcrumbs.push({
              label: 'รายงาน',
              href: pathSegments.length === 2 ? undefined : '/admin/reports'
            })
            
            if (pathSegments[2] === 'materials') {
              breadcrumbs.push({
                label: 'รายงานการใช้วัตถุดิบ',
                isCurrentPage: true
              })
            }
            break

          case 'raw-materials':
            breadcrumbs.push({
              label: 'จัดการวัตถุดิบ',
              isCurrentPage: true
            })
            break

          case 'payroll':
            breadcrumbs.push({
              label: 'จัดการเงินเดือน',
              isCurrentPage: true
            })
            break

          case 'time-entries':
            breadcrumbs.push({
              label: 'การเข้า-ออกงาน',
              isCurrentPage: true
            })
            break

          default:
            // Fallback for unknown routes
            breadcrumbs.push({
              label: pathSegments[1],
              isCurrentPage: true
            })
        }
      } else {
        // Mark admin home as current page
        breadcrumbs[0].isCurrentPage = true
      }
    }

    return breadcrumbs
  }, [pathname])
}