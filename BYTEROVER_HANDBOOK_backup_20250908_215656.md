# Byterover Handbook - Employee Management System

## Layer 1: System Overview 🎯

### Purpose
Employee Management System (ระบบบริหารจัดการพนักงาน) - A comprehensive fullstack Thai employee management application with GPS-based check-in/out functionality, branch management, and payroll processing.

### Architecture Pattern
**Serverless Monorepo Architecture** with Next.js App Router
- **Primary Pattern**: Feature-based modular architecture with service layer abstraction
- **Secondary Pattern**: Component-driven UI with Supabase backend integration
- **Deployment**: Vercel serverless platform

### Tech Stack Core
```typescript
Frontend: Next.js 15.5 + TypeScript 5 + React 19
UI: Shadcn UI + Tailwind CSS 4 + Radix UI
State: Zustand 5.0 (for complex state management)
Backend: Next.js API Routes (serverless)
Database: Supabase PostgreSQL + Auth + Storage
Testing: Vitest + RTL + Playwright E2E
Validation: Zod 4.1 + React Hook Form 7.62
```

### Key Technical Decisions
- **Monorepo Structure**: npm workspaces for code sharing
- **Service Layer Pattern**: Abstract API calls from components
- **Feature-based Organization**: Modular component structure
- **Role-based Authentication**: Admin/Employee access control
- **GPS Integration**: HTML5 Geolocation + Haversine calculations

## Layer 2: Module Map 📁

### Core Business Modules
```
🏢 Branch Management
├── Location: apps/web/src/components/admin/
├── Purpose: GPS-based branch creation and management
└── Key Files: BranchList.tsx, BranchForm.tsx, WorkShiftForm.tsx

👤 User Authentication & Roles
├── Location: apps/web/src/components/auth/
├── Purpose: Supabase-based auth with admin/employee roles
└── Key Files: AuthProvider.tsx, LoginForm.tsx, ProtectedRoute.tsx

⏰ Time Tracking (Future)
├── Location: apps/web/src/features/ (to be created)
├── Purpose: GPS-validated check-in/out with selfie verification
└── Dependencies: Branch Management, Location Services

💰 Payroll Management ✅ COMPLETED
├── Location: apps/web/src/features/payroll/
├── Purpose: Automated payroll calculation and reporting
├── Key Files: CreatePayrollCycle.tsx, PayrollCalculationPreview.tsx, PayrollCycleList.tsx, PayrollSummary.tsx
├── Services: payroll.service.ts, payroll-calculation.utils.ts
└── Dependencies: Time Tracking, User Management
```

### Technical Infrastructure
```
🔧 Services Layer
├── Location: apps/web/src/lib/services/
├── Purpose: API abstraction and business logic
└── Current: user.service.ts, index.ts

🛠 Utilities & Config
├── Location: apps/web/src/lib/
├── Purpose: Shared utilities, validation, auth helpers
└── Key Files: supabase.ts, auth.ts, validation.ts, utils.ts

📦 Shared Packages
├── Location: packages/
├── Purpose: Cross-app shared code (types, UI, config)
└── Packages: @employee-management/{database,ui,config}
```

### Data Layer
```
🗄 Database Schema (Supabase)
├── Core Tables: branches, users, work_shifts
├── Payroll Tables: payroll_cycles, payroll_details, time_entries, audit_logs
├── Payroll Details Fields: base_pay, bonus, bonus_reason, deduction, deduction_reason, net_pay
├── Material/Sales Tables: raw_materials, material_usage, sales_reports
├── Latest Migration: 005_payroll_details_bonus_deduction_fields.sql (bonus/deduction enhancements)
├── Migrations: database/migrations/*.sql
└── Connection: Supabase PostgreSQL with RLS (Row Level Security)
```

## Layer 3: Integration Guide 🔗

### API Architecture
**Base Path**: `/api/`
**Pattern**: RESTful endpoints with role-based access

```typescript
// Admin Endpoints (Protected)
GET    /api/admin/branches          // List all branches
POST   /api/admin/branches          // Create branch
PUT    /api/admin/branches/[id]     // Update branch
DELETE /api/admin/branches/[id]     // Delete branch

GET    /api/admin/branches/[id]/shifts // List shifts for branch
POST   /api/admin/branches/[id]/shifts // Create shift
PUT    /api/admin/shifts/[id]          // Update shift
DELETE /api/admin/shifts/[id]          // Delete shift

// Employee Endpoints
GET    /api/employee/available-branches // GPS-filtered branches

// Location Services
POST   /api/location/nearby-branches    // Find branches within 100m radius

// Payroll Endpoints (Admin Only)
GET    /api/admin/payroll/cycles        // List payroll cycles
POST   /api/admin/payroll/cycles        // Create payroll cycle
GET    /api/admin/payroll/cycles/[id]   // Get payroll cycle details
PUT    /api/admin/payroll/cycles/[id]   // Update payroll cycle
DELETE /api/admin/payroll/cycles/[id]   // Delete payroll cycle
POST   /api/admin/payroll/calculate     // Calculate payroll for cycle

// Payroll Detail Management Endpoints (Admin Only)
PUT    /api/admin/payroll-details/[id]/bonus      // Add/update bonus
PUT    /api/admin/payroll-details/[id]/deduction  // Add/update deduction
DELETE /api/admin/payroll-details/[id]/bonus      // Remove bonus
DELETE /api/admin/payroll-details/[id]/deduction  // Remove deduction
```

### Authentication Flow
```typescript
// Middleware: apps/web/src/middleware.ts
// Auth Provider: apps/web/src/components/auth/AuthProvider.tsx
// Routes:
//   - /login/admin     -> Admin login
//   - /login/employee  -> Employee login
//   - /admin/*         -> Admin dashboard (protected)
//   - /dashboard/*     -> Employee dashboard (protected)
```

### Configuration Management
```typescript
// Environment Variables (via packages/config)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Database Types (via packages/database)
import { User, Branch, WorkShift } from '@employee-management/database'

// Shared UI Components (via packages/ui)
import { Button, Form, Input } from '@employee-management/ui'

// Supabase Client Configuration
// Client-side: apps/web/src/lib/supabase.ts
// Server-side: apps/web/src/lib/supabase-server.ts
```

### GPS Integration Specifications
```typescript
// Location Services: apps/web/src/lib/utils/gps.utils.ts
- HTML5 Geolocation API for user location
- Haversine formula for distance calculations
- 100-meter radius validation for check-ins
- Error handling for GPS disabled/unavailable
- Permission request management
```

## Layer 4: Extension Points 🔧

### Design Patterns in Use
```typescript
🎯 Service Layer Pattern
├── Abstract API calls from components
├── Centralize business logic
└── Example: apps/web/src/lib/services/user.service.ts

🛡 Protected Route Pattern
├── Role-based access control
├── Authentication middleware
└── Example: apps/web/src/components/auth/ProtectedRoute.tsx

📱 Feature-based Architecture
├── Organize code by business features
├── Encapsulate related functionality
└── Structure: apps/web/src/features/[feature]/
```

### Customization Areas
```typescript
🎨 UI Theme & Localization
├── Modify: apps/web/src/app/globals.css
├── Extend: Tailwind config for Thai-specific styling
└── Localize: All text content in Thai language

🗄 Database Schema Extensions
├── Add tables: database/migrations/
├── Extend types: packages/database/types.ts
└── Update services: apps/web/src/lib/services/

📍 GPS & Location Features
├── Customize radius: 100m default (configurable)
├── Add map integration: Optional GPS picker component
└── Extend location validation: Custom business rules
```

### Development Workflow Extensions
```typescript
🧪 Testing Patterns
├── Unit Tests: apps/web/src/__tests__/
├── API Tests: Integration testing for endpoints
├── E2E Tests: Playwright for user workflows
└── GPS Mocking: Test location-based features

🚀 Deployment Extensions
├── Vercel Platform: Serverless deployment
├── Environment Management: Development/Production configs
└── Database Migrations: Automated via Supabase CLI
```

### Future Story Integration Points
```typescript
📸 Selfie Verification (Story 1.5) ✅ COMPLETED
├── ✅ Extended: time_entries table with selfie_url column
├── ✅ Added: SelfieCapture, CameraPermissionRequest components
├── ✅ Integrated: Supabase Storage for photo uploads
└── ✅ Implemented: Camera permission workflow and error handling

💰 Payroll Calculation Engine (Story 3.1) ✅ COMPLETED
├── ✅ Added: payroll_cycles table with comprehensive payroll management
├── ✅ Created: PayrollCycleList, CreatePayrollCycle, PayrollCalculationPreview components
├── ✅ Implemented: Automated payroll calculation with overtime, deductions, bonuses
├── ✅ Added: Audit trail system for compliance and security monitoring
└── ✅ Features: Cycle management, calculation preview, summary reports, Thai localization

🎯 Admin Bonus & Deduction Management (Story 3.2) 🚀 IMPLEMENTATION READY
├── 🚀 Status: Database schema updated, ready for UI implementation
├── 🎯 Purpose: Admin interface for managing employee bonuses and deductions
├── 🔧 New APIs: payroll-details bonus/deduction management endpoints (POST/PUT/DELETE)
├── 🧩 Components: PayrollEmployeeList, BonusDeductionForm, PayrollAdjustmentPreview
├── ✨ Features: Net pay calculation, cycle protection, Thai validation, audit trail
└── 📋 QA Gate: docs/qa/gates/3.2-admin-bonus-deduction-management.yml (validation ready)

📊 Raw Materials Management (Story 2.1) 🔄 IN PROGRESS
├── Add: raw_materials table with CRUD operations
├── Create: Admin-only material management interface
├── Implement: Cost tracking and audit trail
└── Features: Search, filter, validation, Thai localization

💸 Sales Reporting (Future Story 2.x)
├── Add: sales_reports, material_usage tables
├── Create: Daily sales entry forms  
└── Generate: Branch/employee sales analytics
```

---

**Generated**: 2025-09-08 | **Project**: Employee Management System | **Version**: 1.3  
**Context**: Supabase Connection Setup Complete - Ready for Production Deployment

## Supabase Connection Status ✅

### Environment Setup
- **Configuration**: Complete with packages/config integration
- **Client Setup**: Both client-side and server-side clients configured
- **Database Schema**: 5 migrations applied with RLS policies
- **Test Scripts**: Available for connection validation

### Connection Files
- **Client Config**: `apps/web/src/lib/supabase.ts`
- **Server Config**: `apps/web/src/lib/supabase-server.ts`
- **Environment**: `apps/web/.env.local` (create from SUPABASE_SETUP_GUIDE.md)
- **Test Script**: `test-supabase-connection.js`

### Quick Start
1. Copy environment variables to `apps/web/.env.local`
2. Run `node test-supabase-connection.js` to verify connection
3. Start development with `npm run dev`

*This handbook serves as the primary navigation guide for AI agents and human developers working on the Employee Management System codebase.*