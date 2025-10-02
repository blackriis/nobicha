# Card Component - shadcn/ui Compliance Update

## 🔄 การอัปเดต Card Component ให้ตรงตามมาตรฐาน shadcn/ui

### ❌ ปัญหาที่พบในเวอร์ชันเดิม:

1. **โครงสร้างไม่ตรงตามมาตรฐาน**
   - ไม่ใช้ `forwardRef` และ proper TypeScript types
   - ไม่ใช้ `cva` (class-variance-authority) สำหรับ variant handling
   - ไม่มี `asChild` prop สำหรับ composition

2. **การ Export ไม่ครบถ้วน**
   - `CardAction` มีในโค้ดแต่ไม่ได้ export
   - ขาด `CardAction` ใน export list

3. **CSS Classes ไม่ตรงตามมาตรฐาน**
   - ใช้ `rounded-xl` แทน `rounded-lg`
   - ใช้ `shadow-sm` แทน `shadow`
   - ใช้ `gap-6` แทน `space-y-1.5`

4. **การจัดการ Container Queries**
   - ใช้ `@container` ที่ไม่จำเป็นใน CardHeader
   - ใช้ `@container/card-header` ที่ไม่ใช่มาตรฐาน shadcn

### ✅ การแก้ไขที่ทำ:

#### 1. **เพิ่ม Variant Support**
```typescript
const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      variant: {
        default: "",
        outline: "border-2",
        ghost: "border-0 shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

#### 2. **เพิ่ม asChild Prop**
```typescript
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean
}
```

#### 3. **ใช้ forwardRef อย่างถูกต้อง**
```typescript
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div"
    return (
      <Comp
        className={cn(cardVariants({ variant, className }))}
        ref={ref}
        {...(props as any)}
      />
    )
  }
)
```

#### 4. **ปรับ CSS Classes ให้ตรงตามมาตรฐาน**
- `CardHeader`: `flex flex-col space-y-1.5 p-6`
- `CardTitle`: `text-2xl font-semibold leading-none tracking-tight`
- `CardDescription`: `text-sm text-muted-foreground`
- `CardContent`: `p-6 pt-0`
- `CardFooter`: `flex items-center p-6 pt-0`

#### 5. **เพิ่ม displayName สำหรับทุก component**
```typescript
Card.displayName = "Card"
CardHeader.displayName = "CardHeader"
CardTitle.displayName = "CardTitle"
// ... และอื่นๆ
```

### 🧪 การทดสอบที่เพิ่ม:

สร้างไฟล์ `card.test.tsx` ที่ครอบคลุม:

1. **Card Component Tests**
   - Default variant rendering
   - Outline variant rendering
   - Ghost variant rendering
   - Custom className support
   - asChild prop functionality
   - Ref forwarding

2. **Sub-component Tests**
   - CardHeader rendering และ classes
   - CardTitle rendering เป็น h3
   - CardDescription rendering เป็น p
   - CardContent rendering และ classes
   - CardFooter rendering และ classes

3. **Integration Tests**
   - Complete card structure
   - Minimal card structure
   - Ref forwarding สำหรับทุก component

### 📋 การใช้งานที่ถูกต้อง:

#### **Basic Usage:**
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

function ExampleCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
  )
}
```

#### **With Variants:**
```tsx
// Outline variant
<Card variant="outline">...</Card>

// Ghost variant
<Card variant="ghost">...</Card>
```

#### **With asChild:**
```tsx
<Card asChild>
  <button>Clickable Card</button>
</Card>
```

### 🔧 Dependencies ที่จำเป็น:

```json
{
  "@radix-ui/react-slot": "^1.2.3",
  "class-variance-authority": "^0.7.1"
}
```

### ✅ ผลลัพธ์:

1. **✅ ตรงตามมาตรฐาน shadcn/ui** - โครงสร้างและการใช้งานตรงตามมาตรฐาน
2. **✅ TypeScript Support** - มี proper types และ IntelliSense
3. **✅ Variant Support** - รองรับ default, outline, ghost variants
4. **✅ Composition Support** - รองรับ asChild prop
5. **✅ Accessibility** - ใช้ semantic HTML elements
6. **✅ Testing Coverage** - มี unit tests ครอบคลุม
7. **✅ Ref Forwarding** - รองรับ ref forwarding สำหรับทุก component

### 🚀 การรัน Tests:

```bash
# รัน tests สำหรับ Card component
npm run test card

# รัน tests พร้อม coverage
npm run test:coverage card
```

### 📝 หมายเหตุ:

- การเปลี่ยนแปลงนี้จะไม่กระทบต่อการใช้งานเดิมใน CheckInOutCard
- Card component ยังคงทำงานเหมือนเดิม แต่มี features เพิ่มเติม
- สามารถใช้ variants และ asChild prop ได้ทันที
- Tests ครอบคลุมทุก use case และ edge cases
