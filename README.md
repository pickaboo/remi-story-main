# REMI Story - Collaborative Image Storytelling Platform

A modern React application for collaborative image storytelling using Firebase and Google Gemini AI. The platform allows users to create, share, and collaborate on visual stories in real-time.

## 🎉 Recent Major Refactoring Achievement

**App.tsx Successfully Refactored: 400+ lines → 146 lines (63% reduction)**

The codebase has undergone a major refactoring to improve maintainability and follow React best practices:

### ✅ **Completed Refactoring**
- **NavigationContext**: Handles routing and view state management
- **FeedbackContext**: Manages global feedback messages
- **AppStateContext**: Manages sidebar and feed state
- **Feature Hooks**: useAuth, useSphereManagement for business logic
- **Clean Architecture**: App.tsx now serves as a clean orchestrator

### 🚀 **Current Architecture**
- **Context-driven state management** with proper separation of concerns
- **Feature-based modularization** with dedicated folders for each feature
- **Custom hooks** for complex business logic
- **TypeScript** with strict mode for type safety
- **Modern React patterns** (v19.1.0)

## 🏗️ Project Structure

```
remi-story-main-master/
├── App.tsx (146 lines - ✅ Refactored)
├── AppRouter.tsx
├── ModalManager.tsx
├── components/
│   ├── common/
│   │   └── FeedbackDisplay.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── PageContainer.tsx
│       └── Sidebar.tsx
├── context/
│   ├── AppProviders.tsx
│   ├── NavigationContext.tsx
│   ├── FeedbackContext.tsx
│   ├── AppStateContext.tsx
│   └── ModalContext.tsx
├── hooks/
│   └── useAppLogic.ts
├── services/
└── src/
    └── features/
        ├── auth/
        │   ├── components/
        │   ├── hooks/
        │   │   └── useAuth.ts
        │   └── services/
        ├── feed/
        ├── imageBank/
        ├── spheres/
        │   └── hooks/
        │       └── useSphereManagement.ts
        ├── diary/
        └── slideshow/
```

## 🚀 Run Locally

**Prerequisites:** Node.js

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.local.example` to `.env.local`
   - Set your `GEMINI_API_KEY` in `.env.local`

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## 🛠️ Tech Stack

- **Frontend**: React 19.1.0, TypeScript, Vite
- **State Management**: React Context API
- **Styling**: Tailwind CSS
- **AI Integration**: Google Gemini API
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Real-time**: Firebase Realtime Database

## 📋 Current Status

### ✅ **Completed**
- App.tsx refactoring (400+ → 146 lines)
- Context-driven architecture implementation
- Feature-based modularization
- TypeScript strict mode configuration
- Basic authentication and user management

### 🔄 **In Progress**
- Breaking down large feature components
- Completing feature structure for all modules
- Performance optimizations

### 📋 **Planned**
- UserContext and SphereContext integration
- Component size reduction (target: <200 lines each)
- Testing framework setup
- Development tools (ESLint, Prettier)

## 📊 Code Quality Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| App.tsx lines | 146 | <150 | ✅ **ACHIEVED** |
| Largest component | 723 lines | <200 | 🔄 In Progress |
| Feature structure | 2/6 complete | 6/6 complete | 🔄 In Progress |
| Custom hooks | 4 | 10+ | 🔄 In Progress |
| Test coverage | 0% | >80% | 📋 Planned |

## 🤝 Contributing

This project follows a structured refactoring approach. See the following documents for details:

- [REFACTOR_PLAN.md](REFACTOR_PLAN.md) - Detailed refactoring strategy and progress
- [REACT_BEST_PRACTICES_ASSESSMENT.md](REACT_BEST_PRACTICES_ASSESSMENT.md) - Code quality assessment
- [SetupNotes.md](SetupNotes.md) - Development setup and notes

## 📝 License

This project is part of the REMI Story platform for collaborative image storytelling.
