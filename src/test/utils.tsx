import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import { vi } from 'vitest';
import { User, AvatarColor } from '../types';

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <AppProvider>
        {children}
      </AppProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Test data factories
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  initials: 'TU',
  avatarColor: 'bg-blue-500' as AvatarColor,
  emailVerified: true,
  themePreference: 'system',
  pendingInvitationCount: 0,
  sphereIds: ['test-sphere-id'],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockSphere = (overrides = {}) => ({
  id: 'test-sphere-id',
  name: 'Test Sphere',
  description: 'A test sphere',
  gradientColors: ['#3B82F6', '#1D4ED8'],
  createdBy: 'test-user-id',
  members: ['test-user-id'],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockImageRecord = (overrides = {}) => ({
  id: 'test-image-id',
  sphereId: 'test-sphere-id',
  uploadedByUserId: 'test-user-id',
  dataUrl: 'data:image/jpeg;base64,test',
  width: 800,
  height: 600,
  size: 1024,
  filePath: 'test/path/image.jpg',
  dateTaken: '2024-01-01T00:00:00.000Z',
  userDescriptions: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

// Mock functions
export const mockNavigate = vi.fn();
export const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  state: null,
};

// Mock router
export const mockRouter = {
  navigate: mockNavigate,
  location: mockLocation,
  params: {},
  query: {},
};

// Test helpers
export const waitForLoadingToFinish = () =>
  new Promise(resolve => setTimeout(resolve, 0));

export const mockFirebaseAuth = {
  currentUser: null,
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
};

export const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
};

export const mockStorage = {
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
}; 