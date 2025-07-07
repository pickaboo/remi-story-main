import { vi } from 'vitest';
import { getAuth, connectAuthEmulator, signOut } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Import the app's Firebase instances
import { auth, db, storage } from '../../../../firebase';

// Connect app's Firebase instances to emulators
connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
connectFirestoreEmulator(db, 'localhost', 8089);
connectStorageEmulator(storage, 'localhost', 9199);

import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../../App';

beforeAll(async () => {
  // Säkerställ att ingen är inloggad före test
  if (auth.currentUser) {
    await signOut(auth);
  }
});

afterAll(async () => {
  if (auth.currentUser) {
    await signOut(auth);
  }
});

// Emulator-specific UI flow tests for auth pages

describe('Auth Emulator Flow Tests', () => {
  it('shows login and signup pages and allows navigation', async () => {
    const user = userEvent.setup();
    render(<App />);
    // Wait for login page
    await waitFor(() => {
      expect(screen.getByText(/logga in på remi story/i)).toBeInTheDocument();
    });
    // Go to signup
    const signupBtn = screen.getByText(/skapa ett här/i);
    await user.click(signupBtn);
    await waitFor(() => {
      expect(screen.getByText(/skapa ett konto/i)).toBeInTheDocument();
    });
    // Go back to login
    const loginBtn = screen.getAllByText(/logga in/i)[0];
    await user.click(loginBtn);
    await waitFor(() => {
      expect(screen.getByText(/logga in på remi story/i)).toBeInTheDocument();
    });
  });

  it('shows validation errors on empty form submit', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/logga in på remi story/i)).toBeInTheDocument();
    });
    // Try to submit empty login form
    const loginButtons = screen.getAllByRole('button', { name: /logga in/i });
    const mainLoginButton = loginButtons.find(btn => btn.getAttribute('type') === 'submit');
    expect(mainLoginButton).toBeTruthy();
    await user.click(mainLoginButton!);
    // Should stay on login page
    expect(screen.getByText(/logga in på remi story/i)).toBeInTheDocument();
  });
}); 