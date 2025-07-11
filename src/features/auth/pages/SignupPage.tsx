import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppContext } from '../../../context/AppContext';
import { AuthContainer } from '../components/AuthContainer';
import { Button, Input } from '../../../components/ui';
import { signupWithEmailPassword, loginWithOAuth } from '../services/authService';

// Simple SVG Icons for OAuth providers (can be reused or moved to a common place)
const GoogleIcon = () => (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"/>
    <path d="M1 1h22v22H1z" fill="none"/>
  </svg>
);
const MicrosoftIcon = () => (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.4 22.5h-9V13.1h9v9.4zM22.5 22.5h-9V13.1h9v9.4zM11.4 11.4h-9V2.1h9v9.3zM22.5 11.4h-9V2.1h9v9.3z" />
  </svg>
);
const AppleIcon = () => (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.33 11.89c-.06-2.41-1.6-4.28-3.43-4.34-.95-.03-1.99.46-2.78.91-.76.43-1.51.89-2.55.89-.95 0-1.63-.44-2.45-.88-.72-.4-1.51-.76-2.42-.76-2.11 0-3.83 1.76-3.83 4.2C1.81 14.54 3.1 18.3 5.03 20.75c.91 1.15 1.99 2.37 3.29 2.37 1.25 0 1.74-.76 3.23-.76.99 0 2.03.76 3.29.76 1.28 0 2.25-1.12 3.14-2.25.9-.99 1.34-1.92 1.35-1.97-.03-.02-2.3-1.04-2.36-3.12zm-3.12-5.75c.7-.82 1.13-1.95.99-3.09-.9.08-2.07.68-2.79 1.51-.66.75-1.17 1.93-1.02 3.03.99.11 2.12-.62 2.82-1.45z"/>
  </svg>
);

export const SignupPage: React.FC = () => {
  const { handleLoginSuccess } = useAppContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buttonOpacity, setButtonOpacity] = useState(0.4);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const result = await signupWithEmailPassword(email, password);
      if (result.user) {
        handleLoginSuccess(result.user);
        if (!result.user.emailVerified) {
          navigate('/email-confirmation');
        } else {
          navigate('/home');
        }
      } else {
        setError(result.error || 'Kunde inte skapa konto. Försök igen.');
      }
    } catch (err: any) {
      setError('Ett fel uppstod vid registrering. Försök igen.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignup = async (provider: 'google' | 'microsoft' | 'apple') => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loginWithOAuth(provider);
      if (result && result.user) {
        handleLoginSuccess(result.user, result.isNewUser);
        if (!result.user.emailVerified) {
          navigate('/email-confirmation');
        } else {
          navigate('/home');
        }
      } else {
        setError(`Kunde inte skapa konto med ${provider}.`);
      }
    } catch (err: any) {
      setError(`Ett fel uppstod vid registrering med ${provider}. Försök igen.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonMouseEnter = () => {
    setButtonOpacity(0.9);
  };

  const handleButtonMouseLeave = () => {
    setTimeout(() => {
      setButtonOpacity(0.4);
    }, 4000); // 4 seconds delay before fade out starts
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
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <Input
          id="signup-password"
          label="Lösenord (minst 6 tecken)"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input
          id="signup-confirm-password"
          label="Bekräfta lösenord"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-danger dark:text-red-400 text-center">{error}</p>}
        <Button 
          type="submit" 
          variant="primary" 
          size="lg" 
          className="w-full bg-black text-white transition-all duration-[1000ms] ease-in-out" 
          style={{ backgroundColor: `rgba(0, 0, 0, ${buttonOpacity})` }}
          onMouseEnter={handleButtonMouseEnter}
          onMouseLeave={handleButtonMouseLeave}
          isLoading={isLoading}
        >
          Skapa konto
        </Button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-color dark:border-slate-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card-bg dark:bg-dark-bg text-muted-text dark:text-slate-400">Eller registrera med</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Button variant="ghost" className="w-full border-slate-300 dark:border-dark-bg/50 text-gray-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-dark-bg/50" onClick={() => handleOAuthSignup('google')} isLoading={isLoading} aria-label="Registrera med Google">
            <GoogleIcon />
          </Button>
          <Button variant="ghost" className="w-full border-slate-300 dark:border-dark-bg/50 text-gray-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-dark-bg/50" onClick={() => handleOAuthSignup('microsoft')} isLoading={isLoading} aria-label="Registrera med Microsoft">
            <MicrosoftIcon />
          </Button>
          <Button variant="ghost" className="w-full border-slate-300 dark:border-dark-bg/50 text-gray-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-dark-bg/50" onClick={() => handleOAuthSignup('apple')} isLoading={isLoading} aria-label="Registrera med Apple">
            <AppleIcon />
          </Button>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-muted-text dark:text-slate-400">
        Har du redan ett konto?{' '}
        <button onClick={() => navigate('/login')} className="font-medium text-primary dark:text-blue-400 hover:text-primary-hover dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-blue-400 rounded border border-transparent hover:border-primary/20 dark:hover:border-blue-400/20 px-2 py-1 transition-all duration-200 hover:bg-primary/5 dark:hover:bg-blue-400/5 active:scale-95">
          Logga in här
        </button>
      </p>
    </AuthContainer>
  );
};
