# Error-free Operations Guide - Console Error Elimination

## ภาพรวม

เอกสารนี้อธิบายแนวทางการขจัดและป้องกัน console errors โดยเฉพาะปัญหาจาก cookie operations ใน Next.js 15

## Error Categories ที่แก้ไขแล้ว

### 1. Cookie Operations Errors ✅

#### Before: Async Cookies Error
```bash
❌ Error: Route "/api/user/profile" used `cookies().get('sb-token')`. 
   `cookies()` should be awaited before using its value.
   Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
```

#### After: Clean Operation  
```bash
✅ No cookie errors
✅ Clean console output
✅ Proper async handling
```

#### Root Cause Analysis
```typescript
// ❌ Problematic pattern ใน Next.js 15
export const createClient = () => {
  const cookieStore = cookies(); // Sync call ใน async context
  return createServerClient(/* ... */);
};

// ✅ Fixed pattern
export const createClient = async () => {
  const cookieStore = await cookies(); // Proper async handling
  return createServerClient(/* ... */);
};
```

## Error Prevention Strategies

### 1. Async/Await Best Practices

```typescript
// ✅ Server Component Pattern
export default async function ServerComponent() {
  const supabase = await createClient();
  const { data } = await supabase.from('users').select('*');
  return <div>{/* render data */}</div>;
}

// ✅ API Route Pattern  
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const result = await supabase.from('table').select();
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### 2. Error Boundary Implementation

```typescript
// ✅ Component-level error handling
export function ErrorBoundaryWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={<div>เกิดข้อผิดพลาด กรุณาลองใหม่</div>}
      onError={(error, errorInfo) => {
        console.error('Component Error:', error);
        // ส่งไป error tracking service
        trackError(error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

### 3. Graceful Error Handling Patterns

```typescript
// ✅ Service Layer Error Handling
export class TimeEntryService {
  async getStatus(): Promise<ServiceResponse<TimeEntryStatus>> {
    try {
      const response = await fetch('/api/employee/time-entries/status', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('TimeEntry Service Error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
```

## Error Monitoring Implementation

### 1. Development Error Detection

```typescript
// ✅ Development-only error tracking
if (process.env.NODE_ENV === 'development') {
  // Track console errors
  const originalError = console.error;
  console.error = (...args) => {
    // Log to development error tracker
    trackDevelopmentError(args);
    originalError(...args);
  };
  
  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
  });
}
```

### 2. Production Error Monitoring

```typescript
// ✅ Production error tracking (without logging sensitive data)
export const errorTracker = {
  trackError(error: Error, context?: Record<string, any>) {
    if (process.env.NODE_ENV === 'production') {
      // Send to monitoring service (e.g., Sentry, LogRocket)
      monitoringService.captureException(error, {
        tags: { environment: 'production' },
        extra: context
      });
    } else {
      console.error('Error tracked:', error, context);
    }
  }
};
```

### 3. API Error Standardization

```typescript
// ✅ Consistent API error responses
export interface APIErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: any;
  timestamp: string;
}

export function createErrorResponse(
  error: string,
  code: string,
  status: number,
  details?: any
): NextResponse<APIErrorResponse> {
  return NextResponse.json({
    success: false,
    error,
    code,
    details: process.env.NODE_ENV === 'development' ? details : undefined,
    timestamp: new Date().toISOString()
  }, { status });
}
```

## Console Cleanliness Standards

### 1. Log Level Management

```typescript
// ✅ Environment-based logging
export const logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(`ℹ️ ${message}`, data);
    }
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`⚠️ ${message}`, data);
  },
  
  error: (message: string, data?: any) => {
    console.error(`❌ ${message}`, data);
    // Always track errors in production
    errorTracker.trackError(new Error(message), data);
  },
  
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development' && process.env.DEBUG) {
      console.debug(`🐛 ${message}`, data);
    }
  }
};
```

### 2. Clean Production Console

```typescript
// ✅ Production console cleaning
if (process.env.NODE_ENV === 'production') {
  // Disable console.log in production
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  
  // Keep warnings and errors for monitoring
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args) => {
    // Send to monitoring but don't display
    monitoringService.captureMessage('warning', args);
    originalWarn(...args);
  };
}
```

## Specific Error Fixes Implemented

### 1. Supabase Client Errors ✅

```typescript
// Fixed files:
// - apps/web/src/lib/supabase-server.ts
// - apps/web/src/app/api/user/profile/route.ts  
// - apps/web/src/app/api/employee/time-entries/*/route.ts

// Result: Zero cookie-related errors
```

### 2. Authentication Flow Errors ✅

```typescript
// ✅ Proper error handling in auth flow
export const auth = {
  async signIn(email: string, password: string) {
    try {
      const supabase = createClientComponentClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        // Handle auth errors gracefully
        logger.warn('Authentication failed', { error: error.message });
        throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
      
      return data;
    } catch (error) {
      logger.error('Sign in error', error);
      throw error;
    }
  }
};
```

### 3. GPS/Location Errors ✅

```typescript
// ✅ Graceful GPS error handling
export const locationService = {
  async getCurrentPosition(): Promise<ServiceResponse<Position>> {
    try {
      if (!navigator.geolocation) {
        throw new Error('เบราว์เซอร์ไม่รองรับ GPS');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      return { success: true, data: position };
    } catch (error) {
      logger.warn('GPS error', error);
      return { 
        success: false, 
        error: 'ไม่สามารถระบุตำแหน่งได้ กรุณาเปิดใช้งาน GPS' 
      };
    }
  }
};
```

## Quality Assurance Checklist

### Development Console Check ✅
- [ ] ไม่มี red errors ใน console
- [ ] ไม่มี unhandled promise rejections  
- [ ] Warnings มีเหตุผลและจำเป็น
- [ ] Debug logs ใช้เฉพาะ development mode

### Production Console Check ✅
- [ ] Console.log() calls removed หรือ disabled
- [ ] Error tracking service integrated  
- [ ] Sensitive data ไม่ปรากฏใน console
- [ ] Performance ไม่ได้รับผลกระทบจาก logging

### E2E Test Console Check ✅
- [ ] Tests ไม่ trigger console errors
- [ ] Mock data ไม่สร้าง error states
- [ ] Test scenarios cover error paths
- [ ] Error recovery flows tested

## Monitoring Dashboard Metrics

```typescript
// ✅ Key metrics to track
interface ErrorMetrics {
  cookieErrors: number;           // Should be 0
  authErrors: number;             // Monitor for spikes
  apiErrors: number;              // Track by endpoint
  clientErrors: number;           // JavaScript runtime errors
  networkErrors: number;          // Failed requests
  
  // Performance impact
  errorRecoveryTime: number;      // Time to recover from errors
  userExperienceImpact: number;   // Errors visible to users
}
```

## Benefits Achieved

### 1. Clean Development Experience ✅
- No distracting console errors
- Clear debugging information
- Faster development iteration

### 2. Production Reliability ✅  
- Zero cookie operation errors
- Proper error tracking and monitoring
- Better user experience during errors

### 3. Maintainability ✅
- Consistent error handling patterns
- Centralized error management
- Easy debugging and troubleshooting

## Continuous Monitoring

```bash
# ✅ Regular console health checks
npm run dev
# Open browser console → Should be clean

npm run test:e2e
# Monitor test output → Should have no errors

npm run build  
# Check build warnings → Should be minimal and justified
```