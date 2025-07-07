# REMI Story - Coding Standards

## 📋 Table of Contents
1. [General Principles](#general-principles)
2. [TypeScript Standards](#typescript-standards)
3. [React Standards](#react-standards)
4. [Component Standards](#component-standards)
5. [Naming Conventions](#naming-conventions)
6. [File Organization](#file-organization)
7. [Code Comments](#code-comments)
8. [Error Handling](#error-handling)
9. [Performance Guidelines](#performance-guidelines)
10. [Testing Standards](#testing-standards)

---

## 🎯 General Principles

### **Code Quality**
- **Readability**: Code should be self-documenting and easy to understand
- **Maintainability**: Code should be easy to modify and extend
- **Consistency**: Follow established patterns throughout the codebase
- **Simplicity**: Prefer simple solutions over complex ones
- **DRY**: Don't Repeat Yourself - extract common patterns

### **Best Practices**
- **Type Safety**: Use TypeScript strictly - avoid `any` types
- **Error Handling**: Handle errors gracefully with user-friendly messages
- **Accessibility**: Ensure all components are accessible
- **Performance**: Optimize for performance without sacrificing readability
- **Security**: Follow security best practices for user data

---

## 🔷 TypeScript Standards

### **Type Definitions**
```typescript
// ✅ Good: Clear, documented interfaces
/**
 * User entity representing an application user
 */
export interface User {
  /** Unique user identifier */
  id: string;
  /** User's display name */
  name: string;
  /** User's email address */
  email: string;
  /** Whether email has been verified */
  emailVerified: boolean;
}

// ❌ Bad: Unclear, undocumented types
export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
}
```

### **Type Safety**
```typescript
// ✅ Good: Strict typing
const handleUserUpdate = (user: User, updates: Partial<User>): Promise<User> => {
  // Implementation
};

// ❌ Bad: Loose typing
const handleUserUpdate = (user: any, updates: any): Promise<any> => {
  // Implementation
};
```

### **Enum Usage**
```typescript
// ✅ Good: Use enums for fixed sets of values
export enum View {
  Home = 'home',
  Diary = 'diary',
  ImageBank = 'image-bank',
}

// ❌ Bad: String literals for fixed sets
export type View = 'home' | 'diary' | 'image-bank';
```

### **Utility Types**
```typescript
// ✅ Good: Use utility types for flexibility
type UserUpdate = Partial<User>;
type RequiredUserFields = RequiredFields<User, 'id' | 'email'>;
type OptionalUserFields = Optional<User, 'avatarColor'>;

// ❌ Bad: Manual type definitions
interface UserUpdate {
  id?: string;
  name?: string;
  email?: string;
  // ... repeat all fields
}
```

---

## ⚛️ React Standards

### **Component Structure**
```typescript
// ✅ Good: Standard component structure
interface ComponentProps {
  /** Component description */
  prop1: string;
  /** Optional prop description */
  prop2?: number;
  /** Event handler description */
  onEvent: (data: EventData) => void;
}

/**
 * Component description with usage examples
 * 
 * @example
 * ```tsx
 * <Component prop1="value" onEvent={handleEvent} />
 * ```
 */
export const Component: React.FC<ComponentProps> = ({
  prop1,
  prop2,
  onEvent,
}) => {
  // 1. State declarations
  const [state, setState] = useState<StateType>(initialValue);
  
  // 2. Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // 3. Event handlers
  const handleClick = useCallback(() => {
    // Handler logic
  }, [dependencies]);
  
  // 4. Render logic
  return (
    <div className="component-class">
      {/* JSX content */}
    </div>
  );
};
```

### **Hooks Usage**
```typescript
// ✅ Good: Custom hooks with clear return types
export function useCustomHook(param: ParamType): ReturnType {
  const [state, setState] = useState<StateType>(initialValue);
  
  useEffect(() => {
    // Effect logic
  }, [param]);
  
  const handler = useCallback(() => {
    // Handler logic
  }, [dependencies]);
  
  return {
    state,
    handler,
  };
}

// ❌ Bad: Unclear hook structure
export function useCustomHook(param: any) {
  const [state, setState] = useState();
  // Mixed logic without clear structure
  return { state };
}
```

### **State Management**
```typescript
// ✅ Good: Use context for global state
const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(initialState);
  
  const value = useMemo(() => ({
    state,
    setState,
  }), [state]);
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// ❌ Bad: Prop drilling
const Component = ({ state, setState, ...props }) => {
  // Passing state through multiple levels
};
```

---

## 🧩 Component Standards

### **Component Types**
```typescript
// ✅ Good: Use React.FC for function components
export const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
  return <button {...props}>{children}</button>;
};

// ✅ Good: Use memo for performance optimization
export const ExpensiveComponent = memo<ComponentProps>(({ data }) => {
  return <div>{/* Expensive rendering */}</div>;
});

// ❌ Bad: Avoid class components unless necessary
class OldComponent extends React.Component {
  // Use function components with hooks instead
}
```

### **Props Interface**
```typescript
// ✅ Good: Clear, documented props interface
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Loading state */
  isLoading?: boolean;
  /** Button content */
  children: React.ReactNode;
}

// ❌ Bad: Inline props or unclear interface
const Button = ({ variant, size, isLoading, children, ...props }: any) => {
  // Implementation
};
```

### **Event Handlers**
```typescript
// ✅ Good: Typed event handlers
const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  event.preventDefault();
  // Handler logic
};

const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const { value } = event.target;
  // Handler logic
};

// ❌ Bad: Untyped event handlers
const handleClick = (event: any) => {
  // Handler logic
};
```

---

## 📝 Naming Conventions

### **Files and Directories**
```typescript
// ✅ Good: PascalCase for components
Button.tsx
UserProfile.tsx
ImageGallery.tsx

// ✅ Good: camelCase for utilities and hooks
useAuth.ts
formatDate.ts
validationUtils.ts

// ✅ Good: kebab-case for directories
components/
  common/
  layout/
  feed/
pages/
  auth/
  dashboard/
```

### **Variables and Functions**
```typescript
// ✅ Good: camelCase for variables and functions
const userName = 'John Doe';
const isAuthenticated = true;
const handleUserLogin = () => { /* ... */ };
const formatDate = (date: Date) => { /* ... */ };

// ✅ Good: UPPER_SNAKE_CASE for constants
const API_BASE_URL = 'https://api.example.com';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ✅ Good: PascalCase for types and interfaces
interface UserProfile { /* ... */ }
type ButtonVariant = 'primary' | 'secondary';

// ❌ Bad: Inconsistent naming
const UserName = 'John Doe';
const user_name = 'John Doe';
const handleuserlogin = () => { /* ... */ };
```

### **Component Names**
```typescript
// ✅ Good: Descriptive component names
export const UserProfileCard: React.FC<UserProfileCardProps> = () => { /* ... */ };
export const ImageUploadButton: React.FC<ImageUploadButtonProps> = () => { /* ... */ };

// ❌ Bad: Generic or unclear names
export const Card: React.FC<CardProps> = () => { /* ... */ };
export const Button: React.FC<ButtonProps> = () => { /* ... */ };
```

---

## 📁 File Organization

### **Directory Structure**
```
src/
├── components/           # Reusable components
│   ├── common/          # Shared UI components
│   ├── layout/          # Layout components
│   └── feature/         # Feature-specific components
├── pages/               # Page components
├── hooks/               # Custom hooks
├── context/             # React context providers
├── services/            # Business logic and API calls
├── utils/               # Utility functions
├── types.ts             # TypeScript type definitions
└── constants.ts         # Application constants
```

### **File Naming**
```typescript
// ✅ Good: One component per file
Button.tsx
UserProfile.tsx
ImageGallery.tsx

// ✅ Good: Index files for exports
components/
  common/
    index.ts  # Export all common components
    Button.tsx
    Input.tsx

// ❌ Bad: Multiple components in one file
Button.tsx  # Contains Button, ButtonGroup, ButtonIcon
```

---

## 💬 Code Comments

### **JSDoc Comments**
```typescript
/**
 * Calculates the total price including tax
 * 
 * @param price - The base price in dollars
 * @param taxRate - The tax rate as a decimal (e.g., 0.08 for 8%)
 * @returns The total price including tax
 * 
 * @example
 * ```typescript
 * const total = calculateTotalPrice(100, 0.08); // Returns 108
 * ```
 */
export const calculateTotalPrice = (price: number, taxRate: number): number => {
  return price * (1 + taxRate);
};
```

### **Component Documentation**
```typescript
/**
 * Button component with multiple variants and states
 * 
 * Supports loading states, icons, and different visual styles.
 * Fully accessible with proper ARIA attributes.
 * 
 * @example
 * ```tsx
 * // Primary button
 * <Button variant="primary" onClick={handleClick}>
 *   Save Changes
 * </Button>
 * 
 * // Loading button
 * <Button variant="primary" isLoading loadingText="Saving...">
 *   Save Changes
 * </Button>
 * ```
 */
export const Button: React.FC<ButtonProps> = ({ /* ... */ }) => {
  // Implementation
};
```

### **Inline Comments**
```typescript
// ✅ Good: Explain why, not what
// Skip validation for admin users to allow bulk operations
if (user.role === 'admin') {
  return true;
}

// ❌ Bad: Obvious comments
// Set the name
const name = 'John';

// ✅ Good: Complex logic explanation
// Calculate exponential moving average with 12-period smoothing
const ema = (price * 2 / (12 + 1)) + (previousEma * (12 - 1) / (12 + 1));
```

---

## ⚠️ Error Handling

### **Error Boundaries**
```typescript
// ✅ Good: Comprehensive error boundary
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}
```

### **Async Error Handling**
```typescript
// ✅ Good: Proper async error handling
const handleUserUpdate = async (userData: UserUpdate): Promise<void> => {
  try {
    setIsLoading(true);
    const updatedUser = await userService.updateUser(userData);
    setUser(updatedUser);
    showSuccessMessage('User updated successfully');
  } catch (error) {
    const appError = createAppError(error);
    showErrorMessage(appError.message);
    logError(appError);
  } finally {
    setIsLoading(false);
  }
};

// ❌ Bad: Unhandled errors
const handleUserUpdate = async (userData: UserUpdate) => {
  const updatedUser = await userService.updateUser(userData);
  setUser(updatedUser);
};
```

---

## ⚡ Performance Guidelines

### **Memoization**
```typescript
// ✅ Good: Memoize expensive components
export const ExpensiveComponent = memo<ComponentProps>(({ data }) => {
  return <div>{/* Expensive rendering */}</div>;
});

// ✅ Good: Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return data.reduce((acc, item) => acc + item.value, 0);
}, [data]);

// ✅ Good: Memoize event handlers
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

### **Lazy Loading**
```typescript
// ✅ Good: Lazy load pages and heavy components
const HomePage = lazy(() => import('./pages/HomePage'));
const ImageGallery = lazy(() => import('./components/ImageGallery'));

// ✅ Good: Provide loading fallback
<Suspense fallback={<LoadingSpinner />}>
  <HomePage />
</Suspense>
```

### **Bundle Optimization**
```typescript
// ✅ Good: Use dynamic imports for code splitting
const loadHeavyLibrary = async () => {
  const { default: HeavyLibrary } = await import('./HeavyLibrary');
  return HeavyLibrary;
};

// ❌ Bad: Import everything upfront
import HeavyLibrary from './HeavyLibrary';
```

---

## 🧪 Testing Standards

### **Component Testing**
```typescript
// ✅ Good: Comprehensive component tests
describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when isLoading is true', () => {
    render(<Button isLoading loadingText="Loading...">Click me</Button>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

### **Hook Testing**
```typescript
// ✅ Good: Test custom hooks
describe('useAuth', () => {
  it('returns authentication state', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('handles login correctly', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login('user@example.com', 'password');
    });
    
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

### **Integration Testing**
```typescript
// ✅ Good: Test component interactions
describe('UserProfile', () => {
  it('updates user information', async () => {
    render(<UserProfile />);
    
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'New Name' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    
    await waitFor(() => {
      expect(screen.getByText('Profile updated')).toBeInTheDocument();
    });
  });
});
```

---

## 🔧 Code Review Checklist

### **Before Submitting Code**
- [ ] Code follows TypeScript standards
- [ ] Components are properly typed
- [ ] Error handling is implemented
- [ ] Accessibility features are included
- [ ] Performance optimizations are applied
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] Code is self-documenting
- [ ] No console.log statements in production code
- [ ] No unused imports or variables

### **During Code Review**
- [ ] Code is readable and maintainable
- [ ] Naming conventions are followed
- [ ] Error handling is comprehensive
- [ ] Performance considerations are addressed
- [ ] Security best practices are followed
- [ ] Accessibility requirements are met
- [ ] Tests cover edge cases
- [ ] Documentation is clear and complete

---

## 📚 Additional Resources

### **Tools and Extensions**
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **React DevTools**: Component debugging
- **Jest**: Unit testing
- **Testing Library**: Component testing utilities

### **Documentation**
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### **Best Practices**
- [React Best Practices](https://react.dev/learn)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Performance Best Practices](https://react.dev/learn/render-and-commit)
- [Security Best Practices](https://react.dev/learn/security) 