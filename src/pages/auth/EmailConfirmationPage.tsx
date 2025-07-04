import React, { useState, useEffect } from 'react';
import { View } from '../../types';
import { simulateVerifyEmail } from '../../services/authService';
import { useAppContext } from '../../context/AppContext';
import { AuthContainer } from '../../components/auth/AuthContainer';
import { Button } from '../../components/common/Button';

export const EmailConfirmationPage: React.FC = () => {
  const { handleNavigate, handleLoginSuccess } = useAppContext();
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const userEmail = "din e-postadress";

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
        handleLoginSuccess(verifiedUser, true); 
        // handleLoginSuccess should handle navigation to ProfileCompletion
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
      handleNavigate(View.Signup);
    }
  }, [userEmail, handleNavigate]);

  return (
    <AuthContainer title="Bekräfta din E-postadress">
      <div className="text-center space-y-6">
        <p className="text-muted-text dark:text-slate-400">
          Ett (simulerat) bekräftelsemail har skickats till <span className="font-medium text-primary dark:text-blue-400">{userEmail}</span>.
        </p>
        <p className="text-muted-text dark:text-slate-400">
          I en riktig applikation skulle du klicka på länken i mailet för att verifiera ditt konto.
        </p>
        
        <Button 
          onClick={handleSimulateVerification} 
          variant="primary" 
          size="lg" 
          className="w-full"
          isLoading={isVerifying}
        >
          Simulera E-postverifiering & Fortsätt
        </Button>

        {error && <p className="text-sm text-danger dark:text-red-400 mt-4">{error}</p>}

        <p className="mt-4 text-sm text-muted-text dark:text-slate-400">
          Inget mail?{' '}
          <button onClick={() => handleNavigate(View.Signup)} className="font-medium text-primary dark:text-blue-400 hover:text-primary-hover dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-blue-400 rounded">
            Försök registrera igen
          </button>
          {' '}eller{' '}
          <button onClick={() => handleNavigate(View.Login)} className="font-medium text-primary dark:text-blue-400 hover:text-primary-hover dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-blue-400 rounded">
            logga in
          </button>.
        </p>
      </div>
    </AuthContainer>
  );
};
