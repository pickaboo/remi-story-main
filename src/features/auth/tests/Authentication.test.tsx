import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { signOut } from 'firebase/auth';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../../App';
import { auth } from '../../../../firebase';

// Ensure a clean auth state before and after all tests
beforeAll(async () => {
  if (auth.currentUser) await signOut(auth);
});
afterAll(async () => {
  if (auth.currentUser) await signOut(auth);
});

describe('Authentication UI', () => {
  it('shows error on invalid login', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Wait for login page to be visible
    await waitFor(() => {
      expect(screen.queryByText(/logga in på remi story/i)).toBeInTheDocument();
      expect(screen.queryByText(/laddar/i)).not.toBeInTheDocument();
    }, { timeout: 10000 });

    // If already logged in, log out
    const userMenu = screen.queryByRole('button', { name: /användarmeny/i });
    if (userMenu) {
      await user.click(userMenu);
      const signOutButton = await screen.findByText(/logga ut/i);
      await user.click(signOutButton);
      await waitFor(() => {
        expect(screen.queryByText(/logga in på remi story/i)).toBeInTheDocument();
      });
    }

    // Try to login with invalid credentials
    const emailInput = screen.getByLabelText(/e-postadress/i);
    const passwordInput = screen.getByLabelText(/lösenord/i);
    const loginButtons = screen.getAllByRole('button', { name: /logga in/i });
    const mainLoginButton = loginButtons.find(btn => btn.getAttribute('type') === 'submit');
    expect(mainLoginButton).toBeTruthy();

    await user.type(emailInput, 'invalid@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(mainLoginButton!);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/ett fel uppstod vid inloggning/i)).toBeInTheDocument();
    });
    // Still on login page
    expect(screen.getByText(/logga in på remi story/i)).toBeInTheDocument();
  });

  it('renders login page UI correctly', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.queryByText(/logga in på remi story/i)).toBeInTheDocument();
      expect(screen.queryByText(/laddar/i)).not.toBeInTheDocument();
    }, { timeout: 10000 });

    // Check form fields
    expect(screen.getByLabelText(/e-postadress/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lösenord/i)).toBeInTheDocument();
    // Main login button
    const loginButtons = screen.getAllByRole('button', { name: /logga in/i });
    const mainLoginButton = loginButtons.find(btn => btn.getAttribute('type') === 'submit');
    expect(mainLoginButton).toBeTruthy();
    // Social login buttons
    expect(screen.getByRole('button', { name: /logga in med google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logga in med microsoft/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logga in med apple/i })).toBeInTheDocument();
    // Signup link
    expect(screen.getByText(/skapa ett här/i)).toBeInTheDocument();
  });
}); 