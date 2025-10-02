import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('Fixed employees API called')
    
    const adminClient = await createSupabaseServerClient()
    
    // Step 1: Get time entries
    const { data: timeEntries, error: timeError } = await adminClient
      .from('time_entries')
      .select('*')
      .order('check_in_time', { ascending: false })
      .limit(50)
    
    if (timeError) {
      console.error('Time entries error:', timeError)
      return NextResponse.json({
        success: false,
        error: timeError.message
      }, { status: 500 })
    }
    
    console.log('Time entries found:', timeEntries?.length || 0)
    
    // Step 2: Get users data
    const userIds = [...new Set(timeEntries?.map(entry => entry.user_id) || [])]
    const { data: users, error: usersError } = await adminClient
      .from('users')
      .select('id, full_name, employee_id')
      .in('id', userIds)
    
    if (usersError) {
      console.error('Users error:', usersError)
      return NextResponse.json({
        success: false,
        error: usersError.message
      }, { status: 500 })
    }
    
    console.log('Users found:', users?.length || 0)
    
    // Step 3: Get branches data
    const branchIds = [...new Set(timeEntries?.map(entry => entry.branch_id) || [])]
    const { data: branches, error: branchesError } = await adminClient
      .from('branches')
      .select('id, name')
      .in('id', branchIds)
    
    if (branchesError) {
      console.error('Branches error:', branchesError)
      return NextResponse.json({
        success: false,
        error: branchesError.message
      }, { status: 500 })
    }
    
    console.log('Branches found:', branches?.length || 0)
    
    // Step 4: Combine data
    const usersMap = new Map(users?.map(user => [user.id, user]) || [])
    const branchesMap = new Map(branches?.map(branch => [branch.id, branch]) || [])
    
    const combinedData = timeEntries?.map(entry => ({
      ...entry,
      users: usersMap.get(entry.user_id),
      branches: branchesMap.get(entry.branch_id)
    })) || []
    
    // Step 5: Process employee reports (same logic as original)
    const employeeMap = new Map()
    
    combinedData.forEach((entry) => {
      const userId = entry.user_id
      const userData = entry.users
      const branchData = entry.branches
      
      if (!userData || !branchData) {
        console.warn('Missing user or branch data for entry:', entry.id)
        return
      }
      
      if (!employeeMap.has(userId)) {
        employeeMap.set(userId, {
          userId,
          fullName: userData.full_name,
          employeeId: userData.employee_id,
          totalHours: 0,
          totalSessions: 0,
          branches: new Set(),
          lastCheckIn: null,
          status: 'offline'
        })
      }
      
      const employee = employeeMap.get(userId)
      employee.totalHours += entry.total_hours || 0
      employee.totalSessions += 1
      employee.branches.add(branchData.name)
      
      if (!entry.check_out_time && (!employee.lastCheckIn || entry.check_in_time > employee.lastCheckIn)) {
        employee.lastCheckIn = entry.check_in_time
        employee.status = 'working'
      }
    })

    const employeeReports = Array.from(employeeMap.values()).map(employee => ({
      userId: employee.userId,
      fullName: employee.fullName,
      employeeId: employee.employeeId,
      totalHours: Math.round(employee.totalHours * 100) / 100,
      totalSessions: employee.totalSessions,
      averageHoursPerSession: employee.totalSessions > 0 ? 
        Math.round((employee.totalHours / employee.totalSessions) * 100) / 100 : 0,
      branches: Array.from(employee.branches),
      status: employee.status,
      lastCheckIn: employee.lastCheckIn
    }))

    // Sort by total hours
    employeeReports.sort((a, b) => b.totalHours - a.totalHours)

    const summary = {
      totalEmployees: employeeReports.length,
      totalHours: employeeReports.reduce((sum, emp) => sum + emp.totalHours, 0),
      activeEmployees: employeeReports.filter(emp => emp.status === 'working').length,
      averageHoursPerEmployee: employeeReports.length > 0 ? 
        Math.round((employeeReports.reduce((sum, emp) => sum + emp.totalHours, 0) / employeeReports.length) * 100) / 100 : 0
    }

    console.log('Final result:', { employeeCount: employeeReports.length, summary })

    return NextResponse.json({
      success: true,
      data: {
        summary,
        employees: employeeReports,
        dateRange: { type: 'all' }
      }
    })
    
  } catch (error) {
    console.error('Fixed API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}