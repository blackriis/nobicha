import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('Hardcoded test API called')
    
    // Use hardcoded values (same as in .env.local)
    const supabaseUrl = 'https://nyhwnafkybuxneqiaffq.supabase.co'
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55aHduYWZreWJ1eG5lcWlhZmZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzIyMzU2OSwiZXhwIjoyMDcyNzk5NTY5fQ.f4Rs24aT60heWzW07FM5K3h2yrZQhrm4fDih7M-rajM'
    
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    console.log('Testing with hardcoded credentials...')
    
    // Test users query
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
    
    if (users && timeEntries && users.length > 0 && timeEntries.length > 0) {
      // Manual join
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
      error: 'No data or join failed',
      data: {
        users: { count: users?.length || 0, error: usersError },
        timeEntries: { count: timeEntries?.length || 0, error: timeError }
      }
    })
    
  } catch (error) {
    console.error('Hardcoded test API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}