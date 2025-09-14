# Rate Limiting Optimization Guide

## ภาพรวมการแก้ไข

ระบบ rate limiting ได้รับการปรับปรุงเพื่อแก้ปัญหา "Too Many Requests" และเพิ่มความสามารถในการรองรับการใช้งานมากขึ้น

## การเปลี่ยนแปลงหลัก

### 1. การปรับปรุง Rate Limiter Configuration

#### Rate Limiter หลายระดับ
- **Auth Rate Limiter**: 10 requests/15 minutes (เพิ่มจาก 5)
- **Critical APIs**: 20 requests/minute (payroll, time tracking)
- **Important APIs**: 50 requests/minute (admin operations)
- **General APIs**: 200 requests/minute (เพิ่มจาก 100)
- **Public APIs**: 500 requests/minute (location services)

#### การเลือก Rate Limiter อัตโนมัติ
```typescript
// ระบบจะเลือก rate limiter ที่เหมาะสมตาม endpoint
const rateLimiter = getRateLimiterForEndpoint(pathname)
```

### 2. การปรับปรุง Error Messages

#### ข้อความภาษาไทย
```json
{
  "error": "Too Many Requests",
  "message": "การร้องขอเกินขีดจำกัด กรุณาลองใหม่อีกครั้งใน 2 นาที (ขีดจำกัด: 200 requests/1 นาที)",
  "messageEn": "Rate limit exceeded. Please try again later.",
  "suggestion": "กรุณาลดความถี่ในการร้องขอ หรือรอสักครู่แล้วลองใหม่"
}
```

#### Headers ที่เป็นประโยชน์
- `X-RateLimit-Reset`: เวลาที่จะรีเซ็ต
- `X-RateLimit-Remaining`: จำนวนคำขอที่เหลือ
- `Retry-After`: จำนวนวินาทีที่ต้องรอ

### 3. Retry Mechanism

#### Exponential Backoff
```typescript
import { retryWithBackoff } from '@/lib/utils/retry.utils'

const result = await retryWithBackoff(async () => {
  return await apiCall()
}, {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000
})
```

#### การตรวจสอบ Retryable Errors
- Rate limiting (429)
- Network errors
- Timeout errors
- Server errors (5xx)
- Connection errors

### 4. Monitoring และ Analytics

#### API Endpoints
- `GET /api/rate-limit/status` - สถานะปัจจุบัน
- `GET /api/admin/rate-limit/analytics` - ข้อมูลสถิติ (Admin only)
- `POST /api/admin/rate-limit/analytics` - รีเซ็ตข้อมูล (Admin only)

#### Admin Dashboard Component
```typescript
import { RateLimitMonitor } from '@/components/admin/RateLimitMonitor'

// ใช้ใน admin dashboard
<RateLimitMonitor />
```

### 5. การปรับปรุง Middleware

#### การใช้ Rate Limiter อัตโนมัติ
```typescript
// middleware.ts
const rateLimiter = getRateLimiterForEndpoint(pathname)
const { limited, resetTime } = rateLimiter.isRateLimited(req)

if (limited && resetTime) {
  return createRateLimitResponse(resetTime, rateLimiter)
}
```

## การใช้งาน

### 1. สำหรับ Developers

#### การใช้ Retry Mechanism
```typescript
import { createRetryableApiCall } from '@/lib/utils/retry.utils'

const retryableApiCall = createRetryableApiCall(
  () => fetch('/api/some-endpoint'),
  { maxAttempts: 3, baseDelayMs: 1000 }
)

const result = await retryableApiCall()
if (result.success) {
  console.log('Success:', result.data)
} else {
  console.error('Failed after retries:', result.error)
}
```

#### การตรวจสอบ Rate Limit Status
```typescript
const response = await fetch('/api/rate-limit/status')
const status = await response.json()

console.log('Usage:', status.data.current.count, '/', status.data.current.limit)
console.log('Remaining:', status.data.current.remaining)
console.log('Reset in:', status.data.current.timeUntilReset, 'ms')
```

### 2. สำหรับ Admins

#### การตรวจสอบ Analytics
```typescript
const response = await fetch('/api/admin/rate-limit/analytics')
const analytics = await response.json()

console.log('Total requests:', analytics.data.analytics.totalRequests)
console.log('Blocked requests:', analytics.data.analytics.blockedRequests)
console.log('Recommendations:', analytics.data.recommendations)
```

#### การใช้ Admin Dashboard
1. เข้าสู่ระบบในฐานะ Admin
2. ไปที่ Admin Dashboard
3. ดูส่วน "Rate Limit Monitor"
4. ตรวจสอบสถานะการใช้งานและคำแนะนำ

## การทดสอบ

### Unit Tests
```bash
npm test -- rate-limit.test.ts
npm test -- retry.utils.test.ts
```

### Integration Tests
```bash
npm test -- api/rate-limit
```

### Load Testing
```bash
# ทดสอบ rate limiting ภายใต้ load สูง
npm run test:load
```

## การปรับแต่งเพิ่มเติม

### 1. การเพิ่ม Redis Support

สำหรับ production ที่ต้องการ scalability สูง สามารถเพิ่ม Redis support:

```typescript
// lib/rate-limit-redis.ts
import Redis from 'ioredis'

export class RedisRateLimiter {
  constructor(private redis: Redis) {}
  
  async isRateLimited(clientId: string): Promise<boolean> {
    // Implementation with Redis
  }
}
```

### 2. การปรับแต่ง Rate Limits

สามารถปรับแต่ง rate limits ได้ใน `lib/rate-limit.ts`:

```typescript
export const customRateLimiter = new RateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 1000, // Custom limit
  blockDurationMs: 5 * 60 * 1000 // 5 minutes
})
```

### 3. การเพิ่ม Circuit Breaker

สำหรับการป้องกันระบบจาก overload:

```typescript
import { CircuitBreaker } from '@/lib/circuit-breaker'

const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  timeout: 30000,
  resetTimeout: 60000
})
```

## การแก้ไขปัญหา

### 1. Rate Limit ยังเข้มงวดเกินไป

**สาเหตุ**: การตั้งค่า rate limit อาจไม่เหมาะสมกับ use case
**แก้ไข**: ปรับแต่ง `maxRequests` ใน rate limiter ที่เกี่ยวข้อง

### 2. Memory Usage สูง

**สาเหตุ**: In-memory storage ไม่เหมาะสำหรับ production
**แก้ไข**: ใช้ Redis หรือ persistent storage

### 3. False Positive Rate Limiting

**สาเหตุ**: Client identification ไม่แม่นยำ
**แก้ไข**: ปรับปรุง `getClientId` function

## การติดตามและ Monitoring

### 1. Logs
```typescript
// ตรวจสอบ logs สำหรับ rate limiting events
console.log('Rate limit exceeded for:', clientId, 'at:', new Date())
```

### 2. Metrics
- Total requests per minute
- Blocked requests percentage
- Average response time
- Error rate

### 3. Alerts
- Rate limit threshold exceeded
- High error rate
- Unusual traffic patterns

## สรุป

การปรับปรุง rate limiting นี้จะช่วย:
- เพิ่มความสามารถในการรองรับการใช้งานมากขึ้น
- ปรับปรุง user experience ด้วยข้อความที่เข้าใจง่าย
- เพิ่มการติดตามและ monitoring
- ลดปัญหา "Too Many Requests" error

สำหรับการใช้งานใน production ควรพิจารณาใช้ Redis สำหรับ rate limiting storage และเพิ่ม monitoring ที่ครอบคลุมมากขึ้น
