# Refactor Plan: Breaking Down Large Files & Improving Structure

## Objective
Now that modularization is complete, the next phase is to break down large files (especially `App.tsx`) and improve code maintainability, readability, and scalability.

---

## 1. Break Down `App.tsx`
- **Goal:** Make `App.tsx` a clean shell that wires up providers and renders the main router/layout.
- **Steps:**
  1. **Extract Routing Logic:**
     - Move all route/page switching logic into a new `AppRouter.tsx` (or similar) in the root or a `src/app/` folder.
  2. **Extract Modal Logic:**
     - Move all modal rendering and state into a `ModalManager.tsx` component.
  3. **Extract Layout Logic:**
     - Ensure header/sidebar/page container logic is in dedicated layout components.
  4. **Extract Large Handlers/State:**
     - Move large handler functions or stateful logic into custom hooks or context as appropriate.

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