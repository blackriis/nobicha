# Epic 5: UI Design System Standardization - Brownfield Enhancement

## Epic Goal

ปรับปรุงและมาตรฐานการใช้ Shadcn UI ทั้งระบบเพื่อให้มีความสอดคล้องในการออกแบบ และปรับปรุงประสบการณ์ผู้ใช้ผ่านการเพิ่ม component ที่ขาดหายไป

## Epic Description

### Existing System Context:
- ใช้ Shadcn UI เป็น UI framework หลักแล้ว
- Technology stack: Next.js 15 + TypeScript + Tailwind CSS + Shadcn UI
- Integration points: ระบบมี component ใน src/components/ui/ ครบถ้วนหลักๆ แต่ยังมีการใช้ custom styling ผสมกัน

### Enhancement Details:
- **สิ่งที่จะเพิ่ม/เปลี่ยน**: มาตรฐานการใช้สี spacing และ component, เพิ่ม Shadcn component ที่ขาดหายไป
- **วิธีการ integrate**: แทนที่ custom styling ด้วย design tokens และเพิ่ม missing components แบบ incremental
- **Success criteria**: UI ที่สอดคล้องกัน, UX ที่ดีขึ้น, maintainable code

## Stories

### 5.1 Color System & Spacing Standardization
แทนที่ hardcoded colors และ manual spacing ด้วย Shadcn design tokens และปรับปรุง alert/status styling

**Key Components:**
- BranchSelector.tsx - Status styling standardization
- CheckInOutCard.tsx - Alert standardization
- EmployeeList.tsx - Color system migration
- AdminSidebar.tsx - Spacing consistency

### 5.2 Missing Core Components Integration
เพิ่ม Sheet, Tooltip, Textarea, Switch components และแทนที่ custom implementations

**Missing Components to Add:**
- Sheet component (for mobile navigation)
- Tooltip component (for enhanced UX)
- Textarea component (for multi-line input)
- Switch component (for boolean controls)

### 5.3 Enhanced UX Components & Design Consistency
เพิ่ม Breadcrumb, Accordion, standardize Tabs และ loading states

**Enhanced Components:**
- Breadcrumb navigation
- Accordion for collapsible content
- Standardized Tabs implementation
- Unified Skeleton loading states

## Compatibility Requirements

- [x] ระบบ API ทั้งหมดยังคงเดิม
- [x] Database schema ไม่เปลี่ยนแปลง
- [x] UI จะปรับปรุงแต่ยังคง functionality เดิม
- [x] Performance impact น้อยมาก (เฉพาะ CSS และ component updates)

## Risk Mitigation

- **Primary Risk:** การเปลี่ยน styling อาจกระทบต่อ responsive design หรือ accessibility
- **Mitigation:** ทำการทดสอบใน mobile และ desktop, ใช้ Shadcn component ที่มี accessibility built-in
- **Rollback Plan:** Git revert changes เฉพาะ component files, ไม่กระทบ logic หรือ API

## Definition of Done

- [x] ทุก component ใช้ Shadcn design tokens สำหรับสีและ spacing
- [x] Missing components (Sheet, Tooltip, Textarea, Switch, Breadcrumb, Accordion) ถูกเพิ่มแล้ว
- [x] Custom styling ที่ไม่สอดคล้องถูกแทนที่
- [x] UI responsive และ accessible ใน mobile/desktop
- [x] ไม่มี regression ในการทำงานของระบบเดิม

## Technical Notes

### Priority Files for Updates:
**High Priority:**
- `/apps/web/src/components/admin/AdminSidebar.tsx` - Mobile sheet conversion
- `/apps/web/src/components/employee/CheckInOutCard.tsx` - Alert standardization
- `/apps/web/src/components/admin/EmployeeList.tsx` - Color system migration
- `/apps/web/src/components/employee/BranchSelector.tsx` - Status styling

**CSS Files:**
- `/apps/web/src/styles/ui-simplified.css` - Custom classes alignment
- `/apps/web/src/app/globals.css` - Design tokens foundation

### Current Shadcn Components Available:
- Button, Card, Input, Table, Form, Dialog, Badge, Select, Alert
- Need to add: Sheet, Tooltip, Textarea, Switch, Breadcrumb, Accordion, Tabs

## Story Manager Handoff

กรุณาพัฒนา detailed user stories สำหรับ brownfield epic นี้ โดยคำนึงถึง:

- นี่คือการปรับปรุงระบบที่ใช้ **Next.js 15 + TypeScript + Shadcn UI + Tailwind CSS**
- Integration points: **src/components/ui/, src/components/admin/, src/components/employee/**
- รูปแบบที่มีอยู่ให้ตาม: **ใช้ Shadcn design tokens, proper component variants, semantic colors**
- ข้อกำหนดความเข้ากันได้สำคัญ: **responsive design, accessibility, ไม่เปลี่ยน business logic**
- แต่ละ story ต้องรวมการตรวจสอบว่า functionality ที่มีอยู่ยังคงทำงานได้

Epic นี้จะต้องรักษาความสมบูรณ์ของระบบในขณะที่ส่งมอบ **consistent และ improved design system**

---

**Created:** {{date}}
**Status:** Approved
**Epic Type:** Brownfield Enhancement
**Estimated Duration:** 3-4 weeks
**Risk Level:** Low-Medium