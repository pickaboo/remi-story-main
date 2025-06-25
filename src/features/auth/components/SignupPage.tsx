import React, { useState } from 'react';
import { AuthContainer } from '../../../../components/auth/AuthContainer';
import { Input } from '../../../../components/common/Input';
import { Button } from '../../../../components/common/Button';
import { User, AuthView } from '../types';
import { signupWithEmailPassword, loginWithOAuth } from '../services/authService';

interface SignupPageProps {
  onLoginSuccess: (user: User, isNewOAuthUser?: boolean) => void; // For OAuth flow that might "log in" directly
  onNavigate: (viewOrPath: AuthView | string, params?: any) => void;
}

// Simple SVG Icons for OAuth providers (can be reused or moved to a common place)
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    <path d="M1 1h22v22H1z" fill="none"/>
  </svg>
);
const MicrosoftIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.4 22.5h-9V13.1h9v9.4zM22.5 22.5h-9V13.1h9v9.4zM11.4 11.4h-9V2.1h9v9.3zM22.5 11.4h-9V2.1h9v9.3z" />
  </svg>
);
const AppleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.33 11.89c-.06-2.41-1.6-4.28-3.43-4.34-.95-.03-1.99.46-2.78.91-.76.43-1.51.89-2.55.89-.95 0-1.63-.44-2.45-.88-.72-.4-1.51-.76-2.42-.76-2.11 0-3.83 1.76-3.83 4.2C1.81 14.54 3.1 18.3 5.03 20.75c.91 1.15 1.99 2.37 3.29 2.37 1.25 0 1.74-.76 3.23-.76.99 0 2.03.76 3.29.76 1.28 0 2.25-1.12 3.14-2.25.9-.99 1.34-1.92 1.35-1.97-.03-.02-2.3-1.04-2.36-3.12zm-3.12-5.75c.7-.82 1.13-1.95.99-3.09-.9.08-2.07.68-2.79 1.51-.66.75-1.17 1.93-1.02 3.03.99.11 2.12-.62 2.82-1.45z"/>
  </svg>
);

export const SignupPage: React.FC<SignupPageProps> = ({ onLoginSuccess, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Lösenorden matchar inte.');
      return;
    }
    if (password.length < 6) {
      setError('Lösenordet måste vara minst 6 tecken långt.');
      return;
    }
    setIsLoading(true);
    try {
      const result = await signupWithEmailPassword(email, password);
      if (result.user) {
        onNavigate(AuthView.EmailConfirmation, { email: result.user.email });
      } else {
        setError(result.error || 'Kunde inte skapa konto. Försök igen.');
      }
    } catch (err: any) {
      setError(err.message || 'Ett oväntat fel uppstod. Försök igen senare.');
      console.error("Signup error:", err);
    }
    setIsLoading(false);
  };

  const handleOAuthSignup = async (provider: 'google' | 'microsoft' | 'apple') => {
    setError(null);
    setIsLoading(true);
    try {
      // For signup, OAuth behaves same as login; if it's a new user, onLoginSuccess will handle redirection to profile completion.
      const result = await loginWithOAuth(provider);
      if (result && result.user) {
        onLoginSuccess(result.user, result.isNewUser); // Pass isNewUser flag
      } else {
        setError(`Kunde inte skapa konto med ${provider}.`);
      }
    } catch (err) {
      setError('Ett oväntat fel uppstod under OAuth-registrering.');
      console.error("OAuth signup error:", err);
    }
    setIsLoading(false);
  };

  return (
    <AuthContainer title="Skapa ett konto">
      <form onSubmit={handleEmailSignup} className="space-y-6">
        <Input
          id="signup-email"
          label="E-postadress"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <Input
          id="signup-password"
          label="Lösenord (minst 6 tecken)"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          required
        />
        <Input
          id="signup-confirm-password"
          label="Bekräfta lösenord"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-danger dark:text-red-400 text-center">{error}</p>}
        <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
          Skapa konto
        </Button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-color dark:border-slate-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card-bg dark:bg-slate-800 text-muted-text dark:text-slate-400">Eller registrera med</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3">
          <Button variant="ghost" className="w-full border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700" onClick={() => handleOAuthSignup('google')} isLoading={isLoading} aria-label="Registrera med Google">
            <GoogleIcon /> Registrera med Google
          </Button>
          <Button variant="ghost" className="w-full border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700" onClick={() => handleOAuthSignup('microsoft')} isLoading={isLoading} aria-label="Registrera med Microsoft">
            <MicrosoftIcon /> Registrera med Microsoft
          </Button>
          <Button variant="ghost" className="w-full border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700" onClick={() => handleOAuthSignup('apple')} isLoading={isLoading} aria-label="Registrera med Apple">
            <AppleIcon /> Registrera med Apple
          </Button>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-muted-text dark:text-slate-400">
        Har du redan ett konto?{' '}
        <button onClick={() => onNavigate('#login')} className="font-medium text-primary dark:text-blue-400 hover:text-primary-hover dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-blue-400 rounded">
          Logga in här
        </button>
      </p>
    </AuthContainer>
  );
};
