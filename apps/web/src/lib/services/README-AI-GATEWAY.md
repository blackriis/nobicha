# AI Gateway Service

Service สำหรับเรียกใช้ AI Gateway API เพื่อทำ chat completions และ AI operations อื่นๆ

## การตั้งค่า

### 1. เพิ่ม Environment Variable

เพิ่ม `AI_GATEWAY_API_KEY` ใน `.env.local`:

```bash
AI_GATEWAY_API_KEY=your-api-key-here
```

### 2. Import Service

```typescript
import { aiGatewayService } from '@/lib/services'
// หรือ
import { aiGatewayService } from '@/lib/services/ai-gateway.service'
```

## วิธีใช้งาน

### วิธีที่ 1: ใช้ chat() helper (แนะนำสำหรับการใช้งานง่าย)

```typescript
import { aiGatewayService } from '@/lib/services'

// เรียกใช้แบบง่าย
const result = await aiGatewayService.chat('Why is the sky blue?')

if (result.success) {
  console.log('AI Response:', result.data)
} else {
  console.error('Error:', result.error)
}

// ใช้กับ system prompt
const result2 = await aiGatewayService.chat(
  'สรุปข้อมูลพนักงานให้ฉัน',
  'zai/glm-4.6',
  'You are a helpful assistant that summarizes employee data in Thai.'
)
```

### วิธีที่ 2: ใช้ chatCompletion() สำหรับการควบคุมเต็มรูปแบบ

```typescript
import { aiGatewayService } from '@/lib/services'
import type { ChatMessage } from '@/lib/services'

const messages: ChatMessage[] = [
  {
    role: 'system',
    content: 'You are a helpful assistant.'
  },
  {
    role: 'user',
    content: 'Why is the sky blue?'
  }
]

const result = await aiGatewayService.chatCompletion({
  model: 'zai/glm-4.6',
  messages,
  stream: false,
  temperature: 0.7,
  max_tokens: 500
})

if (result.success && result.data) {
  const response = result.data.choices[0]?.message?.content
  console.log('AI Response:', response)
  
  // ดู token usage
  console.log('Tokens used:', result.data.usage)
} else {
  console.error('Error:', result.error)
}
```

## ตัวอย่างการใช้งานใน API Route

```typescript
// apps/web/src/app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { aiGatewayService } from '@/lib/services'

export async function POST(request: NextRequest) {
  try {
    const { message, model } = await request.json()

    const result = await aiGatewayService.chat(
      message,
      model || 'zai/glm-4.6'
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      response: result.data
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## ตัวอย่างการใช้งานใน Server Component

```typescript
// apps/web/src/app/ai-chat/page.tsx
import { aiGatewayService } from '@/lib/services'

export default async function AIChatPage() {
  const result = await aiGatewayService.chat('Hello!')

  if (!result.success) {
    return <div>Error: {result.error}</div>
  }

  return (
    <div>
      <h1>AI Response</h1>
      <p>{result.data}</p>
    </div>
  )
}
```

## Models ที่รองรับ

- `zai/glm-4.6` (default)
- และ models อื่นๆ ที่ AI Gateway รองรับ

## Error Handling

Service จะ return `AIGatewayServiceResult` ที่มี structure:

```typescript
{
  success: boolean
  data: T | null
  error: string | null
}
```

**ตรวจสอบผลลัพธ์:**

```typescript
const result = await aiGatewayService.chat('Hello')

if (result.success) {
  // ใช้ result.data ได้เลย
  console.log(result.data)
} else {
  // จัดการ error
  console.error(result.error)
}
```

## Security Notes

- ⚠️ **API Key ต้องเก็บใน server-side เท่านั้น** (ไม่ควร expose ใน client-side)
- ✅ ใช้ service นี้ใน API routes หรือ Server Components เท่านั้น
- ✅ Environment variable `AI_GATEWAY_API_KEY` จะไม่ถูก expose ไปยัง client

## Testing

```typescript
import { AIGatewayService } from '@/lib/services/ai-gateway.service'

// Mock API key สำหรับ testing
process.env.AI_GATEWAY_API_KEY = 'test-key'

const service = new AIGatewayService()
const result = await service.chat('test message')
```

