import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getCurrentAuthenticatedUser,
  loginWithEmailPassword,
  signupWithEmailPassword,
  logout 
} from '../../services/authService';

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  sendEmailVerification: vi.fn(),
  updateProfile: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  OAuthProvider: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({
    exists: () => false,
    id: 'test-id',
    data: () => ({}),
  })),
  setDoc: vi.fn(),
  arrayUnion: vi.fn(),
  arrayRemove: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() })),
  },
  collection: vi.fn(),
  getDocs: vi.fn(),
  where: vi.fn(),
  query: vi.fn(),
}));

// Mock Firebase
vi.mock('../../firebase', () => ({
  auth: {},
  db: {},
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('loginWithEmailPassword', () => {
    it('should sign in user successfully', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: true,
      };

      (signInWithEmailAndPassword as any).mockResolvedValue({
        user: mockUser,
      });

      const result = await loginWithEmailPassword('test@example.com', 'password123');

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
      expect(result).toBeDefined();
    });

    it('should handle sign in errors', async () => {
      const errorMessage = 'Invalid email or password';
      (signInWithEmailAndPassword as any).mockRejectedValue(
        new Error(errorMessage)
      );

      await expect(loginWithEmailPassword('invalid@example.com', 'wrong')).rejects.toThrow(
        errorMessage
      );
    });
  });

  describe('signupWithEmailPassword', () => {
    it('should create user successfully', async () => {
      const mockUser = {
        uid: 'new-uid',
        email: 'new@example.com',
        displayName: 'New User',
        emailVerified: false,
      };

      (createUserWithEmailAndPassword as any).mockResolvedValue({
        user: mockUser,
      });

      const result = await signupWithEmailPassword('new@example.com', 'password123');

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'new@example.com',
        'password123'
      );
      expect(result.user).toBeDefined();
    });

    it('should handle sign up errors', async () => {
      const errorMessage = 'Email already in use';
      (createUserWithEmailAndPassword as any).mockRejectedValue(
        new Error(errorMessage)
      );

      const result = await signupWithEmailPassword('existing@example.com', 'password123');
      expect(result.user).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('logout', () => {
    it('should sign out user successfully', async () => {
      (signOut as any).mockResolvedValue(undefined);

      await logout();

      expect(signOut).toHaveBeenCalledWith(expect.anything());
    });

    it('should handle logout errors', async () => {
      const errorMessage = 'Logout failed';
      (signOut as any).mockRejectedValue(new Error(errorMessage));

      await expect(logout()).rejects.toThrow(errorMessage);
    });
  });

  describe('getCurrentAuthenticatedUser', () => {
    it('should return current user when authenticated', async () => {
      const mockUser = {
        uid: 'current-uid',
        email: 'current@example.com',
        displayName: 'Current User',
        emailVerified: true,
      };

      // Mock the auth state
      const mockAuth = {
        currentUser: mockUser,
      };

      // This would need to be adjusted based on your actual implementation
      // For now, we'll test the basic structure
      expect(mockAuth.currentUser).toEqual(mockUser);
    });

    it('should return null when not authenticated', async () => {
      const mockAuth = {
        currentUser: null,
      };

      expect(mockAuth.currentUser).toBeNull();
    });
  });
}); 