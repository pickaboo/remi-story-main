# ✅ REFACTORING CHECKLIST TEMPLATE
*Use this checklist for every refactoring session*

---

## 🎯 **PRE-REFACTORING CHECKLIST**

### **Analysis Phase:**
- [ ] **Read the target file** completely
- [ ] **Identify logical sections** that can be extracted
- [ ] **Count current lines** and set target
- [ ] **List all functions/components** to extract
- [ ] **Identify dependencies** between sections
- [ ] **Plan extraction order** (least dependent first)

### **Planning Phase:**
- [ ] **Create extraction plan** with file names
- [ ] **Decide on hook vs component** for each extraction
- [ ] **Plan feature structure** if needed
- [ ] **Identify TypeScript interfaces** to create
- [ ] **Plan dependency management**

---

## 🔧 **DURING REFACTORING CHECKLIST**

### **For Each Extraction:**
- [ ] **Create new file** with proper structure
- [ ] **Extract code** from original file
- [ ] **Add proper imports** and dependencies
- [ ] **Create TypeScript interfaces** if needed
- [ ] **Test functionality** is preserved
- [ ] **Update original file** to use new component/hook
- [ ] **Remove extracted code** from original
- [ ] **Update imports** in original file

### **Quality Checks:**
- [ ] **No TypeScript errors** after extraction
- [ ] **All functionality preserved**
- [ ] **Proper error handling** maintained
- [ ] **Clean imports/exports**
- [ ] **Component under 200 lines** (target)
- [ ] **Single responsibility** principle followed

---

## 📝 **POST-REFACTORING CHECKLIST**

### **Documentation:**
- [ ] **Update REFACTORING_DETAILED_LOG.md** with:
  - [ ] Files created
  - [ ] Files modified
  - [ ] What was moved (line numbers)
  - [ ] Dependencies created
  - [ ] Functions extracted
- [ ] **Update REFACTORING_SUMMARY.md** with:
  - [ ] New line counts
  - [ ] Progress metrics
  - [ ] New components/hooks created
- [ ] **Update REFACTOR_PROGRESS.md** with:
  - [ ] Phase completion status
  - [ ] Next targets
  - [ ] Architecture improvements

### **Testing:**
- [ ] **Run the application** to ensure it works
- [ ] **Test all extracted functionality**
- [ ] **Check for console errors**
- [ ] **Verify user interactions** still work
- [ ] **Test edge cases** if any

### **Code Quality:**
- [ ] **No unused imports**
- [ ] **Proper TypeScript types**
- [ ] **Clean component structure**
- [ ] **Reusable patterns** established
- [ ] **Maintainable code** structure

---

## 🎯 **SPECIFIC EXTRACTION PATTERNS**

### **For Event Handlers:**
- [ ] Extract to custom hook (use[Feature]Handlers)
- [ ] Include all related state management
- [ ] Add proper error handling
- [ ] Include TypeScript types

### **For UI Components:**
- [ ] Extract to component file
- [ ] Include proper props interface
- [ ] Add proper styling
- [ ] Include accessibility attributes

### **For State Management:**
- [ ] Extract to custom hook (use[Feature]State)
- [ ] Include all related state
- [ ] Add proper state updates
- [ ] Include error states

### **For API Calls:**
- [ ] Extract to custom hook (use[Feature]API)
- [ ] Include loading states
- [ ] Add error handling
- [ ] Include retry logic if needed

---

## 📊 **SUCCESS METRICS**

### **Line Count Reduction:**
- [ ] **Target achieved** (under 200 lines)
- [ ] **Significant reduction** (>50%)
- [ ] **No functionality lost**

### **Architecture Improvements:**
- [ ] **Single responsibility** achieved
- [ ] **Reusable components** created
- [ ] **Clean dependencies** established
- [ ] **TypeScript types** complete

### **Code Quality:**
- [ ] **Readable and maintainable**
- [ ] **No code duplication**
- [ ] **Proper error handling**
- [ ] **Performance maintained**

---

## 🚨 **COMMON PITFALLS TO AVOID**

- [ ] **Don't break existing functionality**
- [ ] **Don't create circular dependencies**
- [ ] **Don't forget to update imports**
- [ ] **Don't leave unused code**
- [ ] **Don't skip TypeScript types**
- [ ] **Don't forget error handling**
- [ ] **Don't create overly complex hooks**

---

## 📋 **NEXT SESSION PREPARATION**

- [ ] **Choose next target** from pending list
- [ ] **Read target file** completely
- [ ] **Create extraction plan**
- [ ] **Set up tracking** in detailed log
- [ ] **Prepare checklist** for next session

---

*Use this checklist for every refactoring session to ensure consistency and completeness.*

- [x] Extract SVG icons to PostCardIcons.tsx
- [x] Extract header to PostHeader.tsx
- [x] Extract tags to PostTags.tsx
- [x] Extract image display to PostImage.tsx
- [x] Extract comment input (with audio) to CommentInput.tsx
- [x] Extract comments list to PostComments.tsx
- [x] Refactor main PostCard orchestrator

**PostCard Refactor COMPLETED** ✅
- Reduced from 513 lines to 205 lines (60% reduction)
- All functionality preserved
- Audio logic deduplicated
- Ready for next component refactor 