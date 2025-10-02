import { NextRequest, NextResponse } from 'next/server'

// Simple test endpoint without authentication
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Simple test endpoint working',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Simple test error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}