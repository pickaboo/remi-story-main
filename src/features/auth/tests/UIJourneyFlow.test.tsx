import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

// UI journey flow tests for login/signup forms and accessibility

describe('UI Journey Flow - User Interaction Tests', () => {
  it('shows login and signup forms and allows navigation', async () => {
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

  it('allows keyboard navigation and form validation', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/logga in på remi story/i)).toBeInTheDocument();
    });
    
    // Wait for the email input to be focused (autoFocus)
    const emailInput = screen.getByLabelText(/e-postadress/i);
    await waitFor(() => {
      expect(document.activeElement).toBe(emailInput);
    });
    
    const passwordInput = screen.getByLabelText(/lösenord/i);
    await user.tab(); // focus password
    expect(document.activeElement).toBe(passwordInput);
    
    // Try to submit empty form
    const loginButtons = screen.getAllByRole('button', { name: /logga in/i });
    const mainLoginButton = loginButtons.find(btn => btn.getAttribute('type') === 'submit');
    expect(mainLoginButton).toBeTruthy();
    await user.click(mainLoginButton!);
    // Should show validation error or stay on login
    expect(screen.getByText(/logga in på remi story/i)).toBeInTheDocument();
  });
}); 