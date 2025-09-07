# BYTEROVER Employee Management System Handbook

**Intelligent Agent Navigation Guide**

---

## Layer 1: System Overview

### 🎯 Purpose
**Employee Management System** (ระบบบริหารจัดการพนักงาน) - A comprehensive fullstack application for managing employee operations including time tracking, material usage, sales reporting, and branch management with GPS-based location verification.

### 🏗️ Architecture Pattern
**Serverless Next.js Monorepo Architecture**
- **Application Type**: Full-stack serverless web application
- **Deployment**: Vercel platform with edge functions
- **Structure**: npm workspaces monorepo with clear separation of concerns
- **Data Flow**: Client → Next.js API Routes → Supabase (PostgreSQL + Storage + Auth)

### 🔧 Tech Stack
**Frontend Stack:**
- Next.js 15.5 with App Router (React 19.1)
- TypeScript 5.x for type safety
- Tailwind CSS 4.0 + Shadcn UI components
- Zustand 5.0 for state management
- React Hook Form + Zod for form validation

**Backend Stack:**
- Next.js API Routes (serverless functions)
- Supabase PostgreSQL database with RLS
- Supabase Auth for authentication
- Supabase Storage for file uploads

**Testing & Quality:**
- Vitest + React Testing Library (unit/integration)
- Playwright (E2E testing)
- ESLint + TypeScript strict mode

**Key Dependencies:**
- `@supabase/supabase-js` - Database client
- `lucide-react` - Icon system
- `sonner` - Toast notifications
- `class-variance-authority` - Component variants

---

## Layer 2: Module Map

### 📱 Core Application Modules

**🏠 App Router Structure** (`src/app/`)
- **API Routes** (`api/`): Employee & Admin endpoints
  - Employee APIs: time-entries, material-usage, sales-reports
  - Admin APIs: raw-materials, branches, shifts
- **Pages**: dashboard, admin, login, unauthorized
- **Layouts**: Root layout with Thai localization

**🧩 Component Architecture** (`src/components/`)
- **Admin Components**: Branch/Material/Shift management
- **Employee Components**: Check-in/out, Material usage, Sales reporting
- **Auth Components**: Login, Logout, ProtectedRoute, AuthProvider
- **UI Components**: Shadcn-based design system

**📦 Service Layer** (`src/lib/services/`)
- **API Communication**: All external API calls centralized
- **Business Logic**: Validation, data transformation
- **File Upload**: Camera capture, storage upload
- **Location Services**: GPS verification

**⚙️ Utilities** (`src/lib/utils/`)
- **Validation**: Zod schemas, business rules
- **File Handling**: Upload, filename generation
- **GPS Utils**: Location verification, distance calculation

### 🗄️ Data Layer
**Database Entities:**
- **branches**: Store locations with GPS coordinates
- **users**: Employee/admin profiles linked to Supabase auth
- **time_entries**: Check-in/out records with selfie verification
- **work_shifts**: Shift definitions per branch
- **raw_materials**: Master materials with cost pricing
- **material_usage**: Consumption tracking
- **sales_reports**: Daily sales with slip verification
- **payroll_cycles/payroll_details**: Payroll management

---

## Layer 3: Integration Guide

### 🔌 API Endpoints

**Employee APIs** (`/api/employee/*`)
```typescript
// Time Management
POST /api/employee/time-entries/check-in    // GPS + selfie verification
POST /api/employee/time-entries/check-out   // Location-based check-out
GET  /api/employee/time-entries/status      // Current shift status

// Material & Sales
POST /api/employee/material-usage           // Record material consumption
GET  /api/employee/raw-materials           // Available materials
POST /api/employee/sales-reports           // Daily sales with slip upload
GET  /api/employee/sales-reports           // Historical reports

// Location
GET  /api/employee/available-branches      // Nearby branches
```

**Admin APIs** (`/api/admin/*`)
```typescript
// Branch Management
GET    /api/admin/branches                 // Branch listing
POST   /api/admin/branches                 // Create branch
PUT    /api/admin/branches/[id]           // Update branch
DELETE /api/admin/branches/[id]           // Delete branch

// Material Management
GET    /api/admin/raw-materials           // Material catalog
POST   /api/admin/raw-materials           // Create material
PUT    /api/admin/raw-materials/[id]      // Update material
DELETE /api/admin/raw-materials/[id]      // Delete material
```

### 🔐 Authentication Flow
- **Supabase Auth** with role-based access control
- **Middleware**: Route protection and role validation
- **Protected Routes**: Different access levels for employee/admin
- **Session Management**: Server-side session validation

### 📁 File Upload Architecture
- **Supabase Storage** for images (selfies, sales slips)
- **Client-side Validation**: File type, size limits
- **Server-side Processing**: Image optimization, secure storage
- **Public URLs**: Accessible image references

### 🌍 External Integrations
- **GPS Services**: Browser geolocation API
- **Camera API**: MediaDevices for selfie capture
- **Vercel Deployment**: Serverless functions and static hosting

---

## Layer 4: Extension Points

### 🔧 Customization Patterns

**Service Layer Pattern**
```typescript
// Extend services in src/lib/services/
class CustomService extends BaseService {
  // Add new business logic
}
```

**Component Extension**
```typescript
// Shadcn UI component customization
const CustomButton = variant(Button, {
  variants: { theme: { thai: "bg-thai-primary" } }
})
```

### 🎛️ Configuration Points
- **Environment Variables**: Database URLs, API keys via `packages/config`
- **Thai Localization**: All UI text configurable
- **Business Rules**: Validation schemas in `src/lib/validation.ts`
- **Rate Limiting**: Configurable in `src/lib/rate-limit.ts`

### 📈 Extensibility Areas

**New Employee Features**
- Add modules to `src/components/employee/`
- Create corresponding API routes in `src/app/api/employee/`
- Update service layer in `src/lib/services/`

**Admin Capabilities**
- Extend admin components in `src/components/admin/`
- Add API endpoints in `src/app/api/admin/`
- Update database schema via migrations

**Testing Extensions**
- Unit tests: `src/__tests__/components/`
- Integration tests: `src/__tests__/integration/`
- E2E tests: `e2e/`

### 🔍 Development Patterns
- **Error Handling**: Centralized error boundaries
- **Loading States**: Consistent loading UI patterns
- **Form Validation**: React Hook Form + Zod schemas
- **Data Fetching**: Service layer with error handling

### 📊 Monitoring & Analytics
- **Error Tracking**: Built-in error boundaries
- **Performance**: Next.js built-in analytics
- **Business Metrics**: Custom event tracking capabilities

---

**Last Updated**: Auto-generated byterover handbook
**Agent Support**: Full navigation and extension support enabled