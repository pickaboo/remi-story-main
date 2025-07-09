import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Views } from '../../../constants/viewEnum';
import type { View } from '../../../constants/viewEnum';
import { simulateVerifyEmail } from '../services/authService';
import { useAppContext } from '../../../context/AppContext';
import { AuthContainer } from '../components/AuthContainer';
import { Button } from '../../../components/ui';

export const EmailConfirmationPage: React.FC = () => {
  const { handleNavigate, handleLoginSuccess, currentUser } = useAppContext();
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Använd användarens e-postadress om de är inloggade, annars fallback
  const userEmail = currentUser?.email || "din e-postadress";

  const handleSimulateVerification = async () => {
    if (!userEmail) {
      setError("Ingen e-postadress angiven för verifiering.");
      return;
    }
    setIsVerifying(true);
    setError(null);
    try {
      const verifiedUser = await simulateVerifyEmail(userEmail);
      if (verifiedUser) {
        // Treat as a new user needing profile completion
        await handleLoginSuccess(verifiedUser, true); 
        
        // Navigate to Home after verification
        handleNavigate(Views.Home);
      } else {
        setError("Kunde inte verifiera e-postadressen. Försök logga in eller registrera dig igen.");
      }
    } catch (err: any) {
      setError(err.message || "Ett oväntat fel uppstod under verifieringen.");
    }
    setIsVerifying(false);
  };

  useEffect(() => {
    // If email is not passed, it might be an invalid state, redirect to signup
    if (!userEmail) {
      console.warn("EmailConfirmationPage reached without an email. Redirecting to signup.");
      handleNavigate(Views.Signup);
    }
  }, [userEmail, handleNavigate]);

  // Om användaren är inloggad och redan verifierad, redirecta till Home
  useEffect(() => {
    if (currentUser && currentUser.emailVerified) {
      handleNavigate(Views.Home);
    }
  }, [currentUser, handleNavigate]);

  return (
    <AuthContainer title="Bekräfta din E-postadress">
      <div className="text-center space-y-6">
        {currentUser && !currentUser.emailVerified && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Du är inloggad men din e-post är inte verifierad
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              För att använda alla funktioner i appen behöver du verifiera din e-postadress: <span className="font-medium">{currentUser.email}</span>
            </p>
          </div>
        )}
        
        <p className="text-muted-text dark:text-slate-400">
          Ett bekräftelsemail har skickats till <span className="font-medium text-primary dark:text-blue-400">{userEmail}</span>.
        </p>
        <p className="text-muted-text dark:text-slate-400">
          I en riktig applikation skulle du klicka på länken i mailet för att verifiera ditt konto.
        </p>
        {/* Simuleringsknapp och relaterad logik borttagen */}
        {error && <p className="text-sm text-danger dark:text-red-400 mt-4">{error}</p>}
        <p className="mt-4 text-sm text-muted-text dark:text-slate-400">
          Inget mail?{' '}
          <button onClick={() => handleNavigate(Views.Signup)} className="font-medium text-primary dark:text-blue-400 hover:text-primary-hover dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-blue-400 rounded border border-transparent hover:border-primary/20 dark:hover:border-blue-400/20 px-2 py-1 transition-all duration-200 hover:bg-primary/5 dark:hover:bg-blue-400/5 active:scale-95">
            Försök registrera igen
          </button>
          {' '}eller{' '}
          <button onClick={() => handleNavigate(Views.Login)} className="font-medium text-primary dark:text-blue-400 hover:text-primary-hover dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-blue-400 rounded border border-transparent hover:border-primary/20 dark:hover:border-blue-400/20 px-2 py-1 transition-all duration-200 hover:bg-primary/5 dark:hover:bg-blue-400/5 active:scale-95">
            logga in
          </button>
        </p>
      </div>
    </AuthContainer>
  );
};
