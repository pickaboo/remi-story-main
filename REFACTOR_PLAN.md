# 🛠️ REMI Story Refactor & Restructure Plan

## 📋 **Detailed Step-by-Step Breakdown**

### **Phase 1: Foundation Setup (Steps 1-3)** ✅ **COMPLETED**

#### **Step 1: Create Context Structure** ✅
- **1.1** ✅ Create `context/` folder
- **1.2** ✅ Create `context/UserContext.tsx` with:
  - `currentUser` state
  - `setCurrentUser` function
  - `loading` state for auth
  - `UserProvider` component
- **1.3** ✅ Create `context/SphereContext.tsx` with:
  - `activeSphere` state
  - `setActiveSphere` function
  - `SphereProvider` component
- **1.4** ✅ Create `context/index.ts` to export all contexts

#### **Step 2: Create Custom Hooks Structure** ✅
- **2.1** ✅ Create `hooks/useAuth.ts` for authentication logic
- **2.2** ✅ Create `hooks/usePendingInvites.ts` for invite notifications
- **2.3** ✅ Create `hooks/useSphereData.ts` for sphere-related data
- **2.4** ✅ Create `hooks/useRealTimeListeners.ts` for Firebase listeners

#### **Step 3: Update App.tsx Foundation** ✅
- **3.1** ✅ Import and wrap app with context providers
- **3.2** Remove global state that will move to contexts
- **3.3** Keep only essential routing and global modal state

---

### **Phase 2: Header Component Refactor (Steps 4-6)** ✅ **COMPLETED**

#### **Step 4: Analyze Current Header Logic** ✅
- **4.1** ✅ Identify all state/logic in App.tsx related to header
- **4.2** ✅ List all props passed to Header component
- **4.3** ✅ Document current header functionality

#### **Step 5: Move Header Logic** ✅
- **5.1** ✅ Move user menu state to Header component
- **5.2** ✅ Move notification state to Header component
- **5.3** ✅ Integrate `usePendingInvites` hook in Header
- **5.4** ✅ Update Header to use UserContext instead of props

#### **Step 6: Test Header Functionality** ✅
- **6.1** ✅ Test user menu dropdown
- **6.2** ✅ Test notification badges
- **6.3** ✅ Test invite notifications
- **6.4** ✅ Verify no prop drilling needed

---

### **Phase 3: Sidebar Component Refactor (Steps 7-9)** ✅ **COMPLETED**

#### **Step 7: Analyze Current Sidebar Logic** ✅
- **7.1** ✅ Identify all state/logic in App.tsx related to sidebar
- **7.2** ✅ List all props passed to Sidebar component
- **7.3** ✅ Document current sidebar functionality

#### **Step 8: Move Sidebar Logic** ✅
- **8.1** ✅ Move sphere selection state to Sidebar component
- **8.2** ✅ Move sphere list fetching logic to `useSphereData` hook
- **8.3** ✅ Update Sidebar to use SphereContext
- **8.4** ✅ Integrate real-time sphere updates

#### **Step 9: Test Sidebar Functionality** ✅
- **9.1** ✅ Test sphere switching
- **9.2** ✅ Test sphere list updates
- **9.3** ✅ Test real-time updates
- **9.4** ✅ Verify context integration

---

### **Phase 4: Modal Components Refactor (Steps 10-12)** 🚧 **IN PROGRESS**

#### **Step 10: Analyze Current Modal Logic**
- **10.1** List all modals currently in App.tsx
- **10.2** Identify modal state management
- **10.3** Document modal dependencies

#### **Step 11: Move Modal Logic**
- **11.1** Move CreateSphereModal logic to its component
- **11.2** Move InviteToSphereModal logic to its component
- **11.3** Move ManageSphereModal logic to its component
- **11.4** Move ImageBankSettingsModal logic to its component
- **11.5** Move LookAndFeelModal logic to its component

#### **Step 12: Test Modal Functionality**
- **12.1** Test each modal opens/closes correctly
- **12.2** Test modal form submissions
- **12.3** Test modal state persistence
- **12.4** Verify no global state dependencies

---

### **Phase 5: Page Components Refactor (Steps 13-15)**

#### **Step 13: Analyze Current Page Logic**
- **13.1** Review each page component
- **13.2** Identify props passed from App.tsx
- **13.3** Document page-specific state needs

#### **Step 14: Update Pages to Use Context**
- **14.1** Update HomePage to use UserContext and SphereContext
- **14.2** Update FeedPage to use contexts instead of props
- **14.3** Update DiaryPage to use contexts
- **14.4** Update ImageBankPage to use contexts
- **14.5** Update SlideshowProjectsPage to use contexts

#### **Step 15: Test Page Functionality**
- **15.1** Test each page loads correctly
- **15.2** Test page-specific features work
- **15.3** Test navigation between pages
- **15.4** Verify context data is available

---

### **Phase 6: Cleanup and Optimization (Steps 16-18)**

#### **Step 16: Remove Unused Code**
- **16.1** Remove unused state from App.tsx
- **16.2** Remove unused props from components
- **16.3** Remove unused imports
- **16.4** Clean up any duplicate logic

#### **Step 17: Performance Optimization**
- **17.1** Add React.memo to components where beneficial
- **17.2** Optimize context providers to prevent unnecessary re-renders
- **17.3** Review and optimize custom hooks
- **17.4** Add error boundaries where needed

#### **Step 18: Final Testing and Documentation**
- **18.1** Comprehensive testing of all features
- **18.2** Test edge cases and error scenarios
- **18.3** Update component documentation
- **18.4** Create README for new structure

---

## 🎯 **Current Status: Phase 3 Complete, Ready for Phase 4**

### **✅ Phase 3 Completed:**
- Sidebar component refactored to use SphereContext and UserContext
- Removed 10+ props from Sidebar component
- Self-contained sphere switching and modal state management
- Integrated with useSphereData hook for sphere operations
- Committed changes successfully

### **🚧 Next Steps - Phase 4:**
1. **Analyze current modal logic** in App.tsx
2. **Move modal state and functions** to their respective components
3. **Test modal functionality** thoroughly
4. **Verify no global state dependencies**

### **Success Criteria for Each Phase:**
- ✅ All tests pass
- ✅ No console errors
- ✅ Functionality preserved
- ✅ Code is cleaner and more maintainable
- ✅ Commit changes after each step

---

## 🚦 **Ready to Continue?**

**Phase 1 is complete!** The foundation is now in place with:
- ✅ UserContext and SphereContext created
- ✅ Custom hooks for auth, invites, sphere data, and real-time listeners
- ✅ App wrapped with context providers
- ✅ Dev server running successfully

**Would you like to:**
1. **Continue with Phase 2** - Start analyzing and refactoring the Header component?
2. **Test the current setup** - Verify everything is working correctly?
3. **Review any specific part** of what we've built so far?
4. **Take a different approach** to the refactor?

Let me know how you'd like to proceed! 