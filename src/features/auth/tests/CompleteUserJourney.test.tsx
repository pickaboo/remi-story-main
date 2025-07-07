import { vi } from 'vitest';
import { getAuth, signOut } from 'firebase/auth';

// Import the app's Firebase instances (already connected to emulators in development)
import { auth } from '../../../firebase';

import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

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

// This test simulates a user logging in and verifies that the app navigates away from the login page

describe('Complete User Journey - Login with Existing User', () => {
  it('logs in and navigates to authenticated state', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Wait for login page to be visible
    await waitFor(() => {
      expect(screen.queryByText(/logga in på remi story/i)).toBeInTheDocument();
      expect(screen.queryByText(/laddar/i)).not.toBeInTheDocument();
    }, { timeout: 10000 });

    // Fill in login form
    const emailInput = screen.getByLabelText(/e-postadress/i);
    const passwordInput = screen.getByLabelText(/lösenord/i);
    const loginButtons = screen.getAllByRole('button', { name: /logga in/i });
    const mainLoginButton = loginButtons.find(btn => btn.getAttribute('type') === 'submit');
    expect(mainLoginButton).toBeTruthy();

    await user.type(emailInput, 'testuser@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(mainLoginButton!);

    // Wait for navigation away from login page
    await waitFor(() => {
      expect(screen.queryByLabelText(/e-postadress/i)).not.toBeInTheDocument();
    }, { timeout: 10000 });

    // Should not be on login page
    expect(screen.queryByText(/logga in på remi story/i)).not.toBeInTheDocument();

    // Should be on an authenticated page or loading
    const userMenu = screen.queryByRole('button', { name: /användarmeny/i });
    const profileCompletion = screen.queryByText(/slutför din profil/i);
    const homeContent = screen.queryByText(/välkommen/i);
    const loadingSpinner = screen.queryByText(/laddar/i);
    expect(userMenu || profileCompletion || homeContent || loadingSpinner).toBeTruthy();
  });
}); 