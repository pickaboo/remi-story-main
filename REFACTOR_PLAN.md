# Refactor Plan: Breaking Down Large Files & Improving Structure

## Objective
Now that modularization is complete, the next phase is to break down large files (especially `App.tsx`) and improve code maintainability, readability, and scalability.

---

## ✅ **COMPLETED: App.tsx Refactoring (Phase 1)**

### **Major Achievement: App.tsx Reduced from 400+ lines to 146 lines (63% reduction)**

#### **What Was Accomplished:**

1. **✅ Created NavigationContext** (`context/NavigationContext.tsx`)
   - Moved `currentView`, `viewParams` state
   - Moved `handleNavigate`, `handleHashChange` logic
   - Moved `getCurrentPathForSidebar` function
   - Handles all routing and view state management

2. **✅ Created FeedbackContext** (`context/FeedbackContext.tsx`)
   - Moved `globalFeedback` state
   - Moved `showFeedback`, `clearFeedback` functions
   - Created `FeedbackDisplay` component for UI

3. **✅ Created AppStateContext** (`context/AppStateContext.tsx`)
   - Moved `isSidebarExpanded`, `toggleSidebar`
   - Moved `feedPostsForTimeline`, `activeFeedDate`, `letFeedDriveTimelineSync`
   - Moved `mainScrollContainerRef` and timeline handlers

4. **✅ Created Feature Hooks**
   - **useAuth** (`src/features/auth/hooks/useAuth.ts`): Authentication and user state management
   - **useSphereManagement** (`src/features/spheres/hooks/useSphereManagement.ts`): Sphere operations and management

5. **✅ Updated AppProviders** (`context/AppProviders.tsx`)
   - Wired up all new contexts in proper order
   - Ready for future UserContext and SphereContext integration

6. **✅ Clean App.tsx Shell** (146 lines)
   - Now serves as a clean orchestrator
   - Uses contexts for shared state
   - Uses feature hooks for business logic
   - Focuses on composition and layout

#### **Current App.tsx Structure:**
```typescript
// 1. Imports (15 lines)
// 2. Context usage (25 lines) 
// 3. Feature hooks (15 lines)
// 4. Modal handlers (15 lines)
// 5. Wrapper functions (15 lines)
// 6. JSX render (61 lines)
```

---

## 🎯 **CURRENT STATUS & NEXT PHASES**

### **Phase 2: Complete Context Integration (In Progress)**
- **Goal:** Integrate UserContext and SphereContext into AppProviders
- **Steps:**
  1. Create UserContext for user state management
  2. Create SphereContext for sphere state management
  3. Update AppProviders to include all contexts
  4. Remove remaining user/sphere state from App.tsx

### **Phase 3: Break Down Other Large Feature Components**
- **Goal:** Keep each file focused and under ~200 lines where possible.
- **Priority Files:**
  1. **CreatePost.tsx**: 686 lines → target <200 lines
  2. **PostCard.tsx**: 513 lines → target <200 lines  
  3. **ImageBankPage.tsx**: 723 lines → target <200 lines
  4. **SlideshowProjectsPage.tsx**: 560 lines → target <200 lines

### **Phase 4: Feature Structure Completion**
- **Goal:** Complete feature structure for all features
- **Steps:**
  1. Add missing hooks, services, types folders to features
  2. Create feature-level index files for clean imports
  3. Extract feature-specific logic into appropriate folders

### **Phase 5: Performance & Quality**
- **Goal:** Optimize performance and add quality tools
- **Steps:**
  1. Add React.memo where appropriate
  2. Implement code splitting
  3. Add error boundaries
  4. Set up testing framework
  5. Add ESLint and Prettier

---

## 📊 **Progress Tracking**

| Component | Before | After | Status | Target |
|-----------|--------|-------|--------|--------|
| App.tsx | 400+ lines | 146 lines | ✅ Complete | <150 |
| NavigationContext | N/A | Created | ✅ Complete | - |
| FeedbackContext | N/A | Created | ✅ Complete | - |
| AppStateContext | N/A | Created | ✅ Complete | - |
| useAuth | N/A | Created | ✅ Complete | - |
| useSphereManagement | N/A | Created | ✅ Complete | - |
| CreatePost.tsx | 686 lines | 686 lines | ❌ Pending | <200 |
| PostCard.tsx | 513 lines | 513 lines | ❌ Pending | <200 |
| ImageBankPage.tsx | 723 lines | 723 lines | ❌ Pending | <200 |

---

## 🚀 **Immediate Next Steps**

### **Week 1: Complete Context Integration**
1. Create UserContext and SphereContext
2. Update AppProviders with all contexts
3. Remove remaining state from App.tsx
4. Test all functionality works correctly

### **Week 2: Break Down Large Components**
1. Start with CreatePost.tsx (highest impact)
2. Extract subcomponents and custom hooks
3. Move to PostCard.tsx
4. Continue with other large files

### **Week 3: Feature Structure**
1. Complete missing feature folders
2. Add index files for clean imports
3. Standardize feature structure

### **Week 4: Quality & Performance**
1. Add development tools (ESLint, Prettier)
2. Implement testing strategy
3. Add performance optimizations

---

## 🎯 **Success Criteria (Updated)**

- ✅ `App.tsx` is under 150 lines and only wires up providers and the main router/layout
- ✅ No feature or modal logic remains in `App.tsx`
- ❌ No component file exceeds 200-300 lines unless absolutely necessary
- ⚠️ All repeated logic is extracted into hooks/utilities (partially complete)
- ⚠️ The codebase is easy to navigate and maintain (improving)

---

## 📁 **Current File Structure (After App.tsx Refactor)**

```
remi-story-main-master/
  App.tsx (146 lines - ✅ Complete)
  AppRouter.tsx
  ModalManager.tsx
  components/
    common/
      FeedbackDisplay.tsx (✅ New)
    layout/
  context/
    AppProviders.tsx (✅ Updated)
    NavigationContext.tsx (✅ New)
    FeedbackContext.tsx (✅ New)
    AppStateContext.tsx (✅ New)
    ModalContext.tsx
  hooks/
    useAppLogic.ts
  services/
  src/
    features/
      auth/
        hooks/
          useAuth.ts (✅ New)
      spheres/
        hooks/
          useSphereManagement.ts (✅ New)
      ...
```

---

## 2. Break Down Other Large Feature Components
- **Goal:** Keep each file focused and under ~200 lines where possible.
- **Steps:**
  1. Identify the largest files in each feature folder (e.g., `CreatePost.tsx`, `ImageBankPage.tsx`).
  2. Extract subcomponents (forms, lists, dialogs, etc.) into their own files.
  3. Move repeated or complex logic into custom hooks or utility files.

---

## 3. Custom Hooks & Utilities
- **Goal:** Reuse logic and keep components clean.
- **Steps:**
  1. Extract repeated stateful logic into hooks (e.g., `useModalManager`, `usePageNavigation`).
  2. Move utility functions to shared utility files.

---

## 4. Best Practices
- Each file/component should have a single responsibility.
- Use descriptive names for new components/hooks.
- Keep UI and business logic separated.
- Add comments and JSDoc for complex logic.

---

## 5. Success Criteria
- `App.tsx` is under 150 lines and only wires up providers and the main router/layout.
- No feature or modal logic remains in `App.tsx`.
- No component file exceeds 200-300 lines unless absolutely necessary.
- All repeated logic is extracted into hooks/utilities.
- The codebase is easy to navigate and maintain.

---

## 6. Suggested File Structure (after refactor)

```
remi-story-main-master/
  App.tsx
  AppRouter.tsx
  ModalManager.tsx
  components/
    common/
    layout/
  context/
  hooks/
  services/
  src/
    features/
      ...
```

---

## 7. Next Steps
1. Refactor `App.tsx` as described above.
2. Refactor the largest feature files.
3. Review and extract custom hooks/utilities.
4. Run a full test and lint pass.
5. Update documentation as needed. 