# Folder Structure Audit & Recommendations

*Last Updated: December 2025*

## Executive Summary

Your project is in an excellent state, but there are some duplicate or parallel folder structures due to the transition from a global/shared to a feature-based architecture. Below are recommendations to further clean up and future-proof your codebase.

---

## 1. **Current Structure Overview**

### Root-level (global/shared)
- `components/` (with subfolders: `common/`, `layout/`, `feed/`, `auth/`)
- `hooks/` (global, many reusable hooks)
- `services/` (global, e.g., `storageService.ts`, `userService.ts`)

### Feature-based (modular)
- `src/features/[feature]/components/`
- `src/features/[feature]/hooks/`
- `src/features/[feature]/services/`
- `src/features/[feature]/types/`
- `src/features/[feature]/utils/`

---

## 2. **Audit & Recommendations**

### A. **components/**
- **Keep:**
  - `components/common/` for truly global UI (Button, Input, Spinner, etc.)
  - `components/layout/` for app-wide layout (Header, Sidebar, MainLayout)
- **Move:**
  - `components/feed/` and `components/auth/` → Move to `src/features/feed/components/` and `src/features/auth/components/` if not already there.
- **Rename (optional):**
  - Consider renaming `components/common/` to `src/common/components/` for clarity.

### B. **hooks/**
- **Keep:**
  - `hooks/` for global, reusable hooks (e.g., `useDebounce`, `useLocalStorage`, `useErrorBoundary`)
- **Move:**
  - Feature-specific hooks (e.g., `useImageProcessing.ts`) should live in their respective `src/features/[feature]/hooks/` folder.
- **Rename (optional):**
  - Consider `src/common/hooks/` for global hooks.

### C. **services/**
- **Keep:**
  - `services/` for global services (e.g., `firebase.ts`, `geminiService.ts`)
- **Move:**
  - Feature-specific services (e.g., image, slideshow, diary) should be split and moved to `src/features/[feature]/services/`.
- **Refactor:**
  - Split large monolithic services (like `storageService.ts`) into domain-specific services and move to features.

### D. **types/**
- **Keep:**
  - `types.ts` for global types
- **Move:**
  - Feature-specific types should be in `src/features/[feature]/types/`

### E. **utils/**
- **Move:**
  - Feature-specific utilities (e.g., `imageBankUtils.ts`) should be in `src/features/[feature]/utils/`
  - Global utilities can go in `src/common/utils/`

---

## 3. **Duplicate/Parallel Folders**

- **If a file exists in both a root-level folder and a feature folder:**
  - **Keep only one:**
    - If used by multiple features, keep in global/common.
    - If used by one feature, move to that feature's folder.
  - **Update all imports** to use the new location.

---

## 4. **Suggested Final Structure**

```
remi-story-main-master/
  src/
    common/
      components/
      hooks/
      utils/
      services/
    features/
      feed/
        components/
        hooks/
        services/
        types/
        utils/
      imageBank/
        components/
        hooks/
        services/
        types/
        utils/
      slideshow/
        components/
        hooks/
        services/
        types/
        utils/
      diary/
        components/
        hooks/
        services/
        types/
        utils/
      spheres/
        components/
        hooks/
        services/
        types/
        utils/
      auth/
        components/
        hooks/
        services/
        types/
        utils/
    layout/
      Header.tsx
      Sidebar.tsx
      MainLayout.tsx
      PageContainer.tsx
  ...
```

---

## 5. **Actionable Steps**

1. **Move all feature-specific code** from root-level folders to their respective `src/features/[feature]/` subfolders.
2. **Keep only truly shared code** in `src/common/` (or `components/common/`, `hooks/`, etc. if you prefer).
3. **Update all import paths** after moving files.
4. **Remove any duplicate files** after confirming all references are updated.
5. **(Optional) Rename** `components/common/` and `hooks/` to `src/common/components/` and `src/common/hooks/` for clarity.
6. **Split large services** (like `storageService.ts`) into domain-specific services and move to features.

---

## 6. **Benefits of This Structure**
- ✅ Clear separation of global/shared vs. feature-specific code
- ✅ Easier onboarding for new developers
- ✅ Improved maintainability and scalability
- ✅ Follows React and Vite best practices
- ✅ Reduces risk of import path confusion and duplication

---

*This audit and recommendation is based on a full scan of your current folder structure and best practices for modern React TypeScript projects.* 