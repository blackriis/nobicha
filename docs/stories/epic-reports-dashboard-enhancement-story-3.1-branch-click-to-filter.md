# Story 3.1: Branch Click-to-Filter in Material Reports

**Epic:** Enhanced Reports Dashboard
**Parent Story:** Story 3 (Performance Optimization and Advanced Filtering)
**Story ID:** 3.1
**Priority:** Medium
**Estimated:** 0.5-1 day
**Status:** approve
**Dependencies:** Story 1 (UI/UX Modernization)

---

## User Story

As a **System Administrator**, I want **to click on a branch card in the Material Branch Breakdown section to filter the Material Usage Table by that specific branch**, So that **I can quickly see detailed material usage for a specific branch without manually changing filter dropdowns**.

---

## Story Context

### Existing System Integration
- **Integrates with:**
  - `MaterialDetailPage.tsx` - Main container with existing state management
  - `MaterialBranchBreakdown.tsx` - Grid of branch cards (currently read-only)
  - `MaterialUsageTable.tsx` - Table showing material details (currently unfiltered)
  - `admin-reports.service.ts` - API service (already supports `branchId` parameter)

- **Current Implementation Status:**
  - ✅ `selectedBranchId` state already exists in `MaterialDetailPage`
  - ✅ `BranchFilter` dropdown component already filters data
  - ✅ API supports branch filtering via `branchId` parameter
  - ❌ Branch cards are not clickable
  - ❌ No visual feedback for selected branch in cards
  - ❌ Material table doesn't filter client-side based on branch selection

### What's Being Added
- Click handler on `MaterialBranchBreakdown` cards
- Visual feedback (highlight/border) for selected branch card
- Client-side filtering of `MaterialUsageTable` based on selected branch
- Synchronization between card click and `BranchFilter` dropdown
- Clear/reset filter option to show all branches again

---

## Acceptance Criteria

### Functional Requirements

**FR1: Clickable Branch Cards**
- Branch cards in `MaterialBranchBreakdown` must be clickable
- Clicking a card sets `selectedBranchId` to that branch's ID
- Clicking the same card again clears the filter (toggles selection)
- Click interaction should feel responsive (< 100ms visual feedback)

**FR2: Visual Feedback for Selected Branch**
- Selected branch card shows visual distinction:
  - Highlighted border (e.g., blue 2px solid border)
  - Slightly elevated shadow effect
  - Optional: different background color or accent color
- Non-selected cards remain in normal state
- Only one branch can be selected at a time

**FR3: Material Usage Table Filtering**
- When a branch is selected via card click:
  - `MaterialUsageTable` shows only materials used in that specific branch
  - Table updates immediately (no loading state needed - client-side filter)
  - Empty state shown if no materials used in selected branch
- When no branch is selected (filter cleared):
  - Table shows all materials from all branches

**FR4: Filter Synchronization**
- Card selection syncs with existing `BranchFilter` dropdown:
  - Clicking card updates dropdown selection
  - Changing dropdown updates card highlight
  - Both controls maintain same `selectedBranchId` state
- URL parameters update with selected branch for shareable links

**FR5: Clear Filter Action**
- Provide clear way to reset filter:
  - Click selected card again to deselect (toggle behavior)
  - OR: "Show All Branches" button/badge appears when branch selected
  - Dropdown can select "ทุกสาขา" (All Branches) option to clear

### Integration Requirements

**IR1: State Management Consistency**
- Use existing `selectedBranchId` state in `MaterialDetailPage`
- Use existing `handleBranchChange` function for state updates
- Maintain URL parameter sync (`branchId` in query string)

**IR2: Component Props Extension**
- `MaterialBranchBreakdown` receives new props:
  - `selectedBranchId: string | null`
  - `onBranchClick: (branchId: string) => void`
- `MaterialUsageTable` receives new prop:
  - `selectedBranchId: string | null` (for client-side filtering)

**IR3: Data Flow Integrity**
- Backend API continues to filter full dataset by branch
- Frontend performs additional client-side filtering for immediate UX
- No changes required to `admin-reports.service.ts` (already supports branch filtering)

### Quality Requirements

**QR1: Performance Standards**
- Card click response time: < 100ms visual feedback
- Table filter update: < 200ms (client-side only)
- No unnecessary re-renders or API calls on card click
- Smooth transitions for visual state changes

**QR2: User Experience Standards**
- Clear visual affordance that cards are clickable (hover cursor: pointer)
- Hover state on cards to indicate interactivity
- Intuitive toggle behavior (click to select, click again to deselect)
- Accessible keyboard navigation (Enter/Space to select card)

**QR3: Accessibility Standards**
- Cards have proper ARIA labels and roles
- Keyboard navigation works for card selection
- Screen reader announces selected branch state
- Focus indicators visible for keyboard users

**QR4: Responsive Design**
- Card click interaction works on mobile/tablet touch events
- Selected state visible on all screen sizes
- No layout issues with highlighted/selected cards

---

## Technical Implementation Details

### Files to Modify

**1. MaterialBranchBreakdown.tsx** (Primary changes)
- Add `selectedBranchId` and `onBranchClick` props
- Add click handler to Card component
- Add conditional styling for selected state
- Add hover cursor and transition styles

**2. MaterialUsageTable.tsx** (Client-side filtering)
- Add `selectedBranchId` prop
- Filter materials array before displaying
- Show "filtered by branch" indicator when active
- Handle empty state for no materials in branch

**3. MaterialDetailPage.tsx** (State orchestration)
- Pass `selectedBranchId` to `MaterialBranchBreakdown`
- Create `handleBranchCardClick` function
- Pass click handler to breakdown component
- Ensure sync between card click and dropdown

### Implementation Code Examples

#### 1. MaterialBranchBreakdown.tsx Changes

```typescript
interface MaterialBranchBreakdownProps {
  branches: Array<{
    branchId: string
    branchName: string
    totalCost: number
    usageCount: number
    materials: string[]
    employees: string[]
    averageCostPerUsage: number
  }>
  isLoading: boolean
  selectedBranchId: string | null  // NEW
  onBranchClick: (branchId: string) => void  // NEW
}

export function MaterialBranchBreakdown({
  branches,
  isLoading,
  selectedBranchId,
  onBranchClick
}: MaterialBranchBreakdownProps) {
  // ... existing loading/empty states ...

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
      {branches.map((branch) => {
        const isSelected = selectedBranchId === branch.branchId

        return (
          <Card
            key={branch.branchId}
            onClick={() => onBranchClick(branch.branchId)}
            className={cn(
              "border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer",
              "bg-gradient-to-br from-white to-blue-50/30",
              isSelected && "ring-2 ring-blue-500 ring-offset-2 shadow-xl scale-[1.02]"
            )}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={`เลือกสาขา ${branch.branchName}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onBranchClick(branch.branchId)
              }
            }}
          >
            {/* Existing card content */}
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-3 rounded-xl shadow-md transition-colors",
                  isSelected
                    ? "bg-gradient-to-br from-blue-600 to-blue-700"
                    : "bg-gradient-to-br from-blue-500 to-blue-600"
                )}>
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-bold">
                      {branch.branchName}
                    </CardTitle>
                    {isSelected && (
                      <Badge className="bg-blue-500 text-white text-xs">
                        เลือกอยู่
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    รหัสสาขา: {branch.branchId}
                  </p>
                </div>
              </div>
            </CardHeader>

            {/* Rest of existing card content */}
          </Card>
        )
      })}
    </div>
  )
}
```

#### 2. MaterialUsageTable.tsx Changes

```typescript
interface MaterialUsageTableProps {
  materials: Array<{
    materialId: string
    materialName: string
    // ... other fields
    branches: string[]  // Array of branch IDs that use this material
  }>
  isLoading: boolean
  selectedBranchId: string | null  // NEW
}

export function MaterialUsageTable({
  materials,
  isLoading,
  selectedBranchId
}: MaterialUsageTableProps) {
  // ... existing search/sort state ...

  // NEW: Client-side branch filtering
  const branchFilteredMaterials = selectedBranchId
    ? materials.filter(material =>
        material.branches.includes(selectedBranchId)
      )
    : materials

  // Apply search filter on top of branch filter
  const filteredMaterials = branchFilteredMaterials.filter(material =>
    material.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // ... existing sort/pagination logic ...

  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              ตารางการใช้วัตถุดิบ
              {selectedBranchId && (
                <Badge variant="secondary" className="ml-2">
                  กรองตามสาขา
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedBranchId
                ? `แสดงเฉพาะวัตถุดิบที่ใช้ในสาขาที่เลือก (${filteredMaterials.length} รายการ)`
                : `ข้อมูลการใช้งานและต้นทุนวัตถุดิบแต่ละรายการ`
              }
            </p>
          </div>

          {/* Existing search input */}
        </div>
      </CardHeader>

      {/* Empty state for filtered results */}
      {selectedBranchId && filteredMaterials.length === 0 && (
        <CardContent className="p-8 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">ไม่พบวัตถุดิบที่ใช้ในสาขานี้</p>
        </CardContent>
      )}

      {/* Existing table rendering */}
    </Card>
  )
}
```

#### 3. MaterialDetailPage.tsx Changes

```typescript
export function MaterialDetailPage() {
  // ... existing state ...

  // NEW: Handle branch card click
  const handleBranchCardClick = (branchId: string) => {
    // Toggle behavior: if clicking same branch, clear filter
    const newBranchId = selectedBranchId === branchId ? null : branchId
    handleBranchChange(newBranchId)
  }

  return (
    <div className="space-y-8">
      {/* ... existing header/filters ... */}

      {/* Branch Breakdown - UPDATED with new props */}
      <section className="bg-background text-foreground transition-colors duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-accent text-accent-foreground rounded-lg">
            <Building2 className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">
            การใช้วัตถุดิบแยกตามสาขา
          </h2>
          {selectedBranchId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBranchChange(null)}
              className="gap-2 text-blue-600 hover:text-blue-700"
            >
              <X className="h-4 w-4" />
              แสดงทุกสาขา
            </Button>
          )}
        </div>
        <MaterialBranchBreakdown
          branches={materialData?.branchBreakdown || []}
          isLoading={isLoading}
          selectedBranchId={selectedBranchId}  // NEW
          onBranchClick={handleBranchCardClick}  // NEW
        />
      </section>

      {/* Material Usage Table - UPDATED with new prop */}
      <section className="bg-background text-foreground transition-colors duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-accent text-accent-foreground rounded-lg">
            <DollarSign className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">
            รายละเอียดการใช้วัตถุดิบ
          </h2>
        </div>
        <MaterialUsageTable
          materials={materialData?.materialBreakdown || []}
          isLoading={isLoading}
          selectedBranchId={selectedBranchId}  // NEW
        />
      </section>

      {/* ... existing footer ... */}
    </div>
  )
}
```

---

## Definition of Done

- [ ] **FR1** Branch cards are clickable with toggle behavior (click to select, click again to deselect)
- [ ] **FR2** Selected branch card shows visual feedback (border, shadow, badge)
- [ ] **FR3** Material Usage Table filters by selected branch (client-side)
- [ ] **FR4** Card selection syncs with BranchFilter dropdown bidirectionally
- [ ] **FR5** Clear filter action available (toggle or explicit button)
- [ ] **IR1** Uses existing state management without breaking current functionality
- [ ] **IR2** Components receive and handle new props correctly
- [ ] **IR3** Data flow maintains integrity (no duplicate API calls)
- [ ] **QR1** Performance targets met (< 100ms click feedback, < 200ms filter)
- [ ] **QR2** UX standards met (hover states, cursor pointer, intuitive interaction)
- [ ] **QR3** Accessibility standards met (keyboard nav, ARIA labels, screen reader support)
- [ ] **QR4** Responsive design maintained on all screen sizes
- [ ] Code follows existing TypeScript and React patterns
- [ ] No TypeScript errors or warnings
- [ ] Existing functionality regression tested (dropdown filter still works)
- [ ] Manual testing on desktop, tablet, and mobile viewports

---

## Testing Strategy

### Manual Testing Checklist

**Interaction Testing:**
- [ ] Click branch card → table filters to that branch's materials
- [ ] Click same card again → filter clears, shows all materials
- [ ] Click different card → table switches to new branch's materials
- [ ] Use dropdown filter → card highlight updates to match
- [ ] Use keyboard (Tab + Enter) → card selection works
- [ ] Touch on mobile → card selection works

**Visual Feedback Testing:**
- [ ] Selected card shows distinct visual state
- [ ] Hover state shows on non-selected cards
- [ ] Transitions are smooth (no jarring changes)
- [ ] Selected state visible in dark mode (if applicable)

**Edge Case Testing:**
- [ ] Select branch with no materials → shows empty state in table
- [ ] Search while branch selected → filters work together
- [ ] Sort while branch selected → sorted filtered results
- [ ] Pagination while branch selected → works correctly
- [ ] Refresh page with branch in URL → card highlight restores

### Regression Testing

- [ ] Existing BranchFilter dropdown continues to work
- [ ] Date range filtering still works correctly
- [ ] Material search still works
- [ ] Sorting and pagination still work
- [ ] API calls not duplicated (only when dropdown changes)
- [ ] URL parameters still sync correctly

---

## Risk Assessment and Mitigation

### Low Risk Areas
1. **State Management** - Using existing `selectedBranchId` state (low complexity)
   - **Mitigation:** Minimal changes to state logic

2. **Client-side Filtering** - Simple array filter operation
   - **Mitigation:** No backend changes, easy to test

### Medium Risk Areas
1. **Component Re-renders** - Adding click handlers may cause unnecessary re-renders
   - **Mitigation:** Use `useCallback` for handlers, `React.memo` if needed
   - **Rollback:** Remove memoization if it causes issues

2. **Visual Consistency** - Selected state styling must match design system
   - **Mitigation:** Use existing Tailwind classes and color palette
   - **Rollback:** Simplify to basic border highlight

---

## Success Metrics

- **User Efficiency:** Reduce clicks to filter by branch from 3 (dropdown) to 1 (card click)
- **Perceived Performance:** Filter update feels instant (< 200ms)
- **User Satisfaction:** Intuitive interaction pattern, no confusion about selected state
- **Accessibility:** Keyboard users can navigate and select branches efficiently

---

## Post-Implementation Considerations

### Future Enhancements
- Multi-branch selection (hold Cmd/Ctrl to select multiple)
- Comparison mode (select 2 branches to compare side-by-side)
- Quick action menu on card (filter, view details, export)
- Animation when table updates (smooth transition)

### Documentation Updates
- Update component README with new props
- Add interaction pattern to design system docs
- Include in user training materials

---

## Notes for Developers

### Implementation Priority
1. **Phase 1 (Core):** Add click handlers and basic visual feedback
2. **Phase 2 (Polish):** Add smooth transitions and accessibility
3. **Phase 3 (Edge Cases):** Handle empty states and edge cases

### Gotchas to Watch For
- Ensure `branches` array in material data includes branch IDs (not just names)
- Card click should not trigger when clicking internal buttons/badges
- Keyboard events need `preventDefault()` to avoid page scroll on Space key
- Mobile touch requires proper touch event handling (not just click)

### Dependencies
- `cn()` utility function from `@/lib/utils` (for className merging)
- Existing `Badge`, `Card`, `Button` components from Shadcn UI
- `X` icon from lucide-react (for clear filter button)
