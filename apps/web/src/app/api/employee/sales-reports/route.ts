import { NextRequest, NextResponse } from 'next/server'
import { createClient, createSupabaseServerClient } from '@/lib/supabase-server'
import { generalRateLimiter } from '@/lib/rate-limit'

// GET /api/employee/sales-reports - Get employee's sales reports
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Sales Reports GET: Starting request')
    
    // Rate limiting
    const rateLimitResult = generalRateLimiter.checkLimit(request)
    if (!rateLimitResult.allowed) {
      console.log('❌ Sales Reports GET: Rate limit exceeded')
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Authentication check
    const supabase = await createClient()
    console.log('🔑 Sales Reports GET: Checking authentication')
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('❌ Sales Reports GET: Auth error:', authError)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    if (!user) {
      console.log('❌ Sales Reports GET: No user found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ Sales Reports GET: User authenticated:', user.id)

    // Get user profile and check employee role
    console.log('👤 Sales Reports GET: Fetching user profile for user ID:', user.id)
    console.log('🔗 Sales Reports GET: Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    
    // Use service role client to bypass RLS for user profile lookup
    const adminSupabase = await createSupabaseServerClient()
    const { data: userProfile, error: profileError } = await adminSupabase
      .from('users')
      .select('id, role, branch_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('❌ Sales Reports GET: Profile error details:', {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code,
        userId: user.id
      })
      
      // Check if it's a "not found" error or RLS policy issue
      if (profileError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User profile not found. Please contact administrator to set up your employee profile.' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { error: `Failed to fetch user profile: ${profileError.message}` },
        { status: 500 }
      )
    }

    if (!userProfile) {
      console.log('❌ Sales Reports GET: No user profile found')
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    if (userProfile.role !== 'employee') {
      console.log('❌ Sales Reports GET: Invalid role:', userProfile.role)
      return NextResponse.json(
        { error: 'Employee access required' },
        { status: 403 }
      )
    }

    console.log('✅ Sales Reports GET: Employee access verified')

    // Get URL search params for filtering
    const url = new URL(request.url)
    const reportDate = url.searchParams.get('report_date')
    console.log('📅 Sales Reports GET: Report date filter:', reportDate)
    
    // Build query
    console.log('🔍 Sales Reports GET: Building database query')
    let query = supabase
      .from('sales_reports')
      .select(`
        id,
        branch_id,
        user_id,
        report_date,
        total_sales,
        slip_image_url,
        total_transactions,
        cash_sales,
        card_sales,
        other_sales,
        notes,
        created_at,
        branches (
          id,
          name,
          latitude,
          longitude
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Add date filter if provided
    if (reportDate) {
      console.log('📅 Sales Reports GET: Adding date filter:', reportDate)
      query = query.eq('report_date', reportDate)
    }

    console.log('💾 Sales Reports GET: Executing database query')
    const { data: salesReports, error } = await query

    if (error) {
      console.error('❌ Sales Reports GET: Database error:', error)
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      )
    }

    console.log('✅ Sales Reports GET: Query successful, found', salesReports?.length || 0, 'reports')

    return NextResponse.json({
      success: true,
      data: salesReports || []
    })

  } catch (error) {
    console.error('GET /api/employee/sales-reports error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}

// POST /api/employee/sales-reports - Create new sales report
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = generalRateLimiter.checkLimit(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Authentication check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile and check employee role
    console.log('👤 Sales Reports POST: Fetching user profile for user ID:', user.id)
    
    // Use service role client to bypass RLS for user profile lookup
    const adminSupabase = await createSupabaseServerClient()
    const { data: userProfile, error: profileError } = await adminSupabase
      .from('users')
      .select('id, role, branch_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('❌ Sales Reports POST: Profile error details:', {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code,
        userId: user.id
      })
      
      if (profileError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User profile not found. Please contact administrator to set up your employee profile.' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { error: `Failed to fetch user profile: ${profileError.message}` },
        { status: 500 }
      )
    }

    if (!userProfile || userProfile.role !== 'employee') {
      console.log('❌ Sales Reports POST: Invalid role or no profile:', { userProfile })
      return NextResponse.json(
        { error: 'Employee access required' },
        { status: 403 }
      )
    }

    // Get current date for check-in validation
    const todayDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

    // Find latest check-in branch for today
    const { data: latestCheckIn, error: checkInError } = await supabase
      .from('time_entries')
      .select('branch_id')
      .eq('user_id', user.id)
      .gte('check_in_time', `${todayDate}T00:00:00.000Z`)
      .lt('check_in_time', `${new Date(new Date(todayDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}T00:00:00.000Z`)
      .order('check_in_time', { ascending: false })
      .limit(1)
      .single()

    if (checkInError || !latestCheckIn) {
      return NextResponse.json(
        { error: 'กรุณาเช็คอินที่สาขาก่อนทำการรายงานยอดขาย' },
        { status: 400 }
      )
    }

    const currentBranchId = latestCheckIn.branch_id

    // Parse form data for file upload
    let formData
    try {
      formData = await request.formData()
    } catch (error) {
      return NextResponse.json(
        { error: 'รูปแบบข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // Extract fields from form data
    const totalSalesStr = formData.get('total_sales') as string
    const slipImageFile = formData.get('slip_image') as File

    // Validate required fields
    if (!totalSalesStr || !slipImageFile) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน: กรุณากรอกยอดขายและแนบรูปภาพสลิป' },
        { status: 400 }
      )
    }

    // Validate total_sales
    const totalSales = parseFloat(totalSalesStr)
    if (isNaN(totalSales) || totalSales <= 0 || totalSales > 9999999999.99) {
      return NextResponse.json(
        { error: 'ยอดขายต้องเป็นตัวเลขบวกเท่านั้น และไม่เกิน 12 หลัก' },
        { status: 400 }
      )
    }

    // Validate slip image file
    if (!(slipImageFile instanceof File)) {
      return NextResponse.json(
        { error: 'กรุณาแนบรูปภาพสลิปยืนยันยอดขาย' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(slipImageFile.type)) {
      return NextResponse.json(
        { error: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น (.jpg, .png, .webp)' },
        { status: 400 }
      )
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (slipImageFile.size > maxSize) {
      return NextResponse.json(
        { error: 'ขนาดไฟล์เกิน 5MB กรุณาเลือกไฟล์ที่มีขนาดเล็กกว่า' },
        { status: 400 }
      )
    }

    // Use today's date for report_date (already defined as todayDate)
    const reportDate = todayDate

    // Check for duplicate report (employee + branch + date)
    const { data: existingReport, error: duplicateCheckError } = await supabase
      .from('sales_reports')
      .select('id')
      .eq('user_id', user.id)
      .eq('branch_id', currentBranchId)
      .eq('report_date', reportDate)
      .single()

    if (existingReport && !duplicateCheckError) {
      return NextResponse.json(
        { error: 'คุณได้ทำการรายงานยอดขายของวันนี้แล้ว กรุณาตรวจสอบในประวัติการรายงาน' },
        { status: 400 }
      )
    }

    // Upload slip image to Supabase Storage
    const fileExt = slipImageFile.name.split('.').pop()
    const timestamp = Date.now()
    const fileName = `${user.id}/${reportDate}/${timestamp}.${fileExt}`
    
    // Use service role client for storage upload to avoid client-side RLS issues
    const { data: uploadData, error: uploadError } = await adminSupabase.storage
      .from('sales-slips')
      .upload(fileName, slipImageFile, {
        contentType: slipImageFile.type,
        upsert: false
      })

    if (uploadError) {
      console.error('File upload error:', uploadError)
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ' },
        { status: 500 }
      )
    }

    // Get public URL for the uploaded image
    const { data: { publicUrl } } = adminSupabase.storage
      .from('sales-slips')
      .getPublicUrl(fileName)

    // Insert sales report record
    // Use service role client for inserting the sales report to avoid table RLS issues
    const { data: salesReport, error: insertError } = await adminSupabase
      .from('sales_reports')
      .insert({
        branch_id: currentBranchId,
        user_id: user.id,
        report_date: reportDate,
        total_sales: totalSales,
        slip_image_url: publicUrl
      })
      .select(`
        id,
        branch_id,
        user_id,
        report_date,
        total_sales,
        slip_image_url,
        total_transactions,
        cash_sales,
        card_sales,
        other_sales,
        notes,
        created_at,
        branches (
          id,
          name
        )
      `)
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      
      // Cleanup uploaded file if database insert fails
      await adminSupabase.storage
        .from('sales-slips')
        .remove([fileName])

      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการบันทึกรายงานยอดขาย' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `บันทึกรายงานยอดขายสำเร็จ ยอดขายรวม: ฿${totalSales.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
      data: salesReport
    }, { status: 201 })

  } catch (error) {
    console.error('POST /api/employee/sales-reports error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    )
  }
}
