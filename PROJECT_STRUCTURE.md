# REMI Story - Project Structure

## 📁 Directory Structure

```
src/
├── components/           # React components
│   ├── common/          # Reusable UI components
│   ├── layout/          # Layout components (Header, Sidebar, etc.)
│   ├── feed/            # Feed-related components
│   └── auth/            # Authentication components
├── pages/               # Page components (routes)
│   └── auth/            # Authentication pages
├── hooks/               # Custom React hooks
├── context/             # React Context providers
├── services/            # Business logic and API calls
├── utils/               # Utility functions
├── types.ts             # TypeScript type definitions
├── constants.ts         # Application constants
├── App.tsx              # Main application component
└── index.tsx            # Application entry point
```

## 🧩 Component Organization

### **Common Components** (`src/components/common/`)
Reusable UI components used throughout the application:

- **Button.tsx** - Standardized button component with variants
- **Input.tsx** - Form input component with validation
- **TextArea.tsx** - Multi-line text input component
- **LoadingSpinner.tsx** - Loading indicator component
- **LazyLoadingSpinner.tsx** - Loading spinner for lazy-loaded components
- **ErrorBoundary.tsx** - Error boundary for catching React errors
- **SphereDisplay.tsx** - Sphere avatar/display component
- **AudioPlayerButton.tsx** - Audio playback component
- **FullscreenImageViewer.tsx** - Fullscreen image viewer modal

### **Modal Components**
- **CreateSphereModal.tsx** - Create new sphere modal
- **ImageBankPickerModal.tsx** - Image selection modal
- **UserMenuPopover.tsx** - User menu dropdown
- **DiaryPopover.tsx** - Quick diary entry modal
- **LookAndFeelModal.tsx** - Theme and appearance settings
- **ManageSphereModal.tsx** - Sphere management modal
- **InviteToSphereModal.tsx** - Invite users to sphere modal
- **ImageBankSettingsModal.tsx** - Image bank configuration modal

### **Layout Components** (`src/components/layout/`)
- **Header.tsx** - Application header with navigation
- **Sidebar.tsx** - Main navigation sidebar
- **AppLayout.tsx** - Main layout wrapper
- **PageContainer.tsx** - Page content container

### **Feed Components** (`src/components/feed/`)
- **PostCard.tsx** - Individual post display component
- **CreatePost.tsx** - Post creation component
- **Timeline.tsx** - Timeline navigation component

## 🎣 Custom Hooks (`src/hooks/`)

### **State Management**
- **useAppState.ts** - Main application state management
- **useAuth.ts** - Authentication state and logic
- **useModalState.ts** - Modal state management
- **useSphereManagement.ts** - Sphere-related operations

### **Performance Hooks**
- **useDebounce.ts** - Debounce values and callbacks
- **useThrottle.ts** - Throttle values and callbacks
- **useImageLoader.ts** - Image loading with lazy loading support

### **Accessibility Hooks**
- **useFocusTrap.ts** - Focus management for modals
- **useAudioRecorder.ts** - Audio recording functionality

## 🏗️ Architecture Patterns

### **Component Structure**
```typescript
// Standard component structure
interface ComponentProps {
  // Props with clear types
}

export const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // 1. State declarations
  // 2. Effects
  // 3. Event handlers
  // 4. Render logic
  return (
    // JSX with semantic HTML and accessibility attributes
  );
};
```

### **Hook Structure**
```typescript
// Standard hook structure
export function useCustomHook(param: ParamType): ReturnType {
  // 1. State declarations
  // 2. Effects
  // 3. Event handlers
  // 4. Return values
}
```

### **Service Structure**
```typescript
// Standard service structure
export class ServiceName {
  // Static methods for API calls
  static async methodName(params: ParamsType): Promise<ReturnType> {
    // Implementation
  }
}
```

## 📝 Naming Conventions

### **Files**
- **Components**: PascalCase (e.g., `PostCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`)
- **Services**: camelCase (e.g., `authService.ts`)
- **Utils**: camelCase (e.g., `themeUtils.ts`)
- **Types**: camelCase (e.g., `types.ts`)
- **Constants**: camelCase (e.g., `constants.ts`)

### **Components**
- **Function Components**: PascalCase
- **Props Interfaces**: `ComponentNameProps`
- **Event Handlers**: `handleEventName`

### **Variables and Functions**
- **Variables**: camelCase
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase

## 🔧 Development Guidelines

### **Component Guidelines**
1. **Single Responsibility**: Each component should have one clear purpose
2. **Props Interface**: Always define a clear props interface
3. **Accessibility**: Include proper ARIA attributes and semantic HTML
4. **Error Handling**: Handle errors gracefully with user-friendly messages
5. **Loading States**: Show appropriate loading indicators

### **Hook Guidelines**
1. **Naming**: Always start with `use`
2. **Return Values**: Return objects for multiple values, primitives for single values
3. **Dependencies**: Properly manage useEffect dependencies
4. **Cleanup**: Clean up subscriptions and event listeners

### **Service Guidelines**
1. **Error Handling**: Consistent error handling across all services
2. **Type Safety**: Full TypeScript support with proper types
3. **Async/Await**: Use async/await for all asynchronous operations
4. **Validation**: Validate inputs and outputs

### **Performance Guidelines**
1. **Lazy Loading**: Use React.lazy for code splitting
2. **Memoization**: Use React.memo for expensive components
3. **Debouncing/Throttling**: For user input and scroll events
4. **Image Optimization**: Lazy loading and proper sizing

## 🎨 Styling Guidelines

### **CSS Classes**
- **Utility-First**: Use Tailwind CSS utility classes
- **Consistent Spacing**: Use Tailwind's spacing scale
- **Dark Mode**: Support both light and dark themes
- **Responsive**: Mobile-first responsive design

### **Component Styling**
- **Inline Styles**: Only for dynamic values (colors, dimensions)
- **CSS Classes**: Use Tailwind classes for static styling
- **Conditional Classes**: Use template literals for conditional styling

## 🧪 Testing Guidelines

### **Component Testing**
- **Unit Tests**: Test individual component functionality
- **Integration Tests**: Test component interactions
- **Accessibility Tests**: Ensure proper ARIA attributes and keyboard navigation

### **Hook Testing**
- **Custom Hook Testing**: Test hook behavior and return values
- **Effect Testing**: Test side effects and cleanup

## 📚 Documentation

### **Code Comments**
- **Complex Logic**: Comment complex business logic
- **API Calls**: Document expected responses and error cases
- **Accessibility**: Document accessibility considerations

### **README Files**
- **Component README**: Document component usage and props
- **Service README**: Document API endpoints and usage
- **Hook README**: Document hook behavior and return values

## 🔄 State Management

### **Context Usage**
- **AppContext**: Global application state
- **AuthContext**: Authentication state
- **ModalContext**: Modal state management

### **Local State**
- **useState**: For component-specific state
- **useReducer**: For complex state logic
- **Custom Hooks**: For reusable state logic

## 🚀 Performance Optimization

### **Code Splitting**
- **Route-based**: Lazy load pages
- **Component-based**: Lazy load heavy components
- **Vendor Splitting**: Separate vendor libraries

### **Bundle Optimization**
- **Tree Shaking**: Remove unused code
- **Minification**: Compress production builds
- **Caching**: Optimize for browser caching

## 🔒 Security Guidelines

### **Input Validation**
- **Client-side**: Validate user inputs
- **Server-side**: Validate all data on server
- **Sanitization**: Sanitize user-generated content

### **Authentication**
- **Token Management**: Secure token storage and refresh
- **Route Protection**: Protect authenticated routes
- **Error Handling**: Don't expose sensitive information in errors 