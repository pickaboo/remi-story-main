import { useState, useCallback } from 'react';

interface ErrorState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorActions {
  resetError: () => void;
  setError: (error: Error, errorInfo?: React.ErrorInfo) => void;
  handleError: (error: Error, errorInfo?: React.ErrorInfo) => void;
}

export const useErrorBoundary = (): [ErrorState, ErrorActions] => {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    errorInfo: null
  });

  const resetError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }, []);

  const setError = useCallback((error: Error, errorInfo?: React.ErrorInfo) => {
    setErrorState({
      hasError: true,
      error,
      errorInfo: errorInfo || null
    });
  }, []);

  const handleError = useCallback((error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Error caught by error boundary:', error, errorInfo);
    setError(error, errorInfo);
  }, [setError]);

  const actions: ErrorActions = {
    resetError,
    setError,
    handleError
  };

  return [errorState, actions];
}; 