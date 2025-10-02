import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('Bypass RLS API called')
    
    // Create client with service role key and bypass RLS
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Test users query with explicit RLS bypass
    console.log('Testing users query with RLS bypass...')
    const { data: users, error: usersError } = await adminClient
      .from('users')
      .select('id, full_name, employee_id, role')
    
    console.log('Users result:', { count: users?.length || 0, error: usersError })
    
    // Test time entries
    const { data: timeEntries, error: timeError } = await adminClient
      .from('time_entries')
      .select('id, user_id, total_hours, check_in_time, check_out_time')
      .limit(10)
    
    console.log('Time entries result:', { count: timeEntries?.length || 0, error: timeError })
    
    // Manual join
    if (users && timeEntries) {
      const usersMap = new Map(users.map(user => [user.id, user]))
      
      const joined = timeEntries.map(entry => ({
        ...entry,
        user: usersMap.get(entry.user_id)
      }))
      
      const validEntries = joined.filter(entry => entry.user)
      
      console.log('Join result:', {
        totalEntries: joined.length,
        validEntries: validEntries.length
      })
      
      // Process employee reports
      const employeeMap = new Map()
      
      validEntries.forEach((entry) => {
        const userId = entry.user_id
        const userData = entry.user
        
        if (!employeeMap.has(userId)) {
          employeeMap.set(userId, {
            userId,
            fullName: userData.full_name,
            employeeId: userData.employee_id,
            totalHours: 0,
            totalSessions: 0,
            status: 'offline'
          })
        }
        
        const employee = employeeMap.get(userId)
        employee.totalHours += entry.total_hours || 0
        employee.totalSessions += 1
        
        if (!entry.check_out_time) {
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
        status: employee.status
      }))

      const summary = {
        totalEmployees: employeeReports.length,
        totalHours: employeeReports.reduce((sum, emp) => sum + emp.totalHours, 0),
        activeEmployees: employeeReports.filter(emp => emp.status === 'working').length,
        averageHoursPerEmployee: employeeReports.length > 0 ? 
          Math.round((employeeReports.reduce((sum, emp) => sum + emp.totalHours, 0) / employeeReports.length) * 100) / 100 : 0
      }
      
      return NextResponse.json({
        success: true,
        data: {
          debug: {
            users: { count: users.length },
            timeEntries: { count: timeEntries.length },
            validJoins: validEntries.length
          },
          summary,
          employees: employeeReports
        }
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'No data found',
      data: {
        users: { count: users?.length || 0, error: usersError },
        timeEntries: { count: timeEntries?.length || 0, error: timeError }
      }
    })
    
  } catch (error) {
    console.error('Bypass RLS API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}