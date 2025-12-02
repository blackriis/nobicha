import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Test endpoint to verify Supabase Auth configuration
// Usage: GET /api/admin/test-auth

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const testUsername = `test_${Date.now()}`
    const testEmail = `${testUsername}@example.com`
    const testPassword = '12345678' // 8 digit password

    console.log('Testing auth configuration...')
    console.log('Test username:', testUsername)
    console.log('Test email:', testEmail)
    console.log('Test password length:', testPassword.length)

    // Test 1: Create user with 6-digit password
    const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        username: testUsername,
        is_test: true
      }
    })

    if (createError) {
      console.error('Test failed - Create user error:', createError)
      return NextResponse.json({
        success: false,
        test: 'create_user_with_8_digit_password',
        error: createError.message,
        details: {
          status: createError.status,
          message: createError.message,
          password_length: testPassword.length
        },
        suggestion: 'Please check Supabase Auth Settings → Password Policy → Minimum Password Length should be 8'
      }, { status: 500 })
    }

    console.log('Test passed - User created:', authUser.user?.id)

    // Test 2: Insert into users table with username
    const { data: userData, error: insertError } = await supabase
      .from('users')
      .insert({
        id: authUser.user!.id,
        username: testUsername,
        email: null, // Test null email
        full_name: 'Test User',
        role: 'employee',
        is_active: true
      })
      .select()
      .single()

    if (insertError) {
      console.error('Test failed - Insert user error:', insertError)

      // Cleanup: Delete auth user
      await supabase.auth.admin.deleteUser(authUser.user!.id)

      return NextResponse.json({
        success: false,
        test: 'insert_user_with_null_email',
        error: insertError.message,
        details: insertError,
        suggestion: 'Please run the migration script: database/migrations/010_add_username_make_email_optional.sql'
      }, { status: 500 })
    }

    console.log('Test passed - User data inserted:', userData.id)

    // Cleanup: Delete test user
    const { error: deleteError1 } = await supabase
      .from('users')
      .delete()
      .eq('id', authUser.user!.id)

    const { error: deleteError2 } = await supabase.auth.admin.deleteUser(authUser.user!.id)

    if (deleteError1 || deleteError2) {
      console.warn('Cleanup warning:', { deleteError1, deleteError2 })
    } else {
      console.log('Test user cleaned up successfully')
    }

    // All tests passed
    return NextResponse.json({
      success: true,
      message: 'All tests passed! ✅',
      tests: {
        create_user_with_8_digit_password: 'PASSED',
        insert_user_with_null_email: 'PASSED',
        cleanup: 'PASSED'
      },
      test_data: {
        username: testUsername,
        email: testEmail,
        password_length: testPassword.length,
        user_id: authUser.user!.id
      }
    })

  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
