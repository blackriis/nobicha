import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Environment check API called')
    
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing',
      NODE_ENV: process.env.NODE_ENV,
      urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) || 'N/A',
      keyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 30) || 'N/A'
    }
    
    console.log('Environment check:', envCheck)
    
    return NextResponse.json({
      success: true,
      data: envCheck
    })
    
  } catch (error) {
    console.error('Environment check error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}