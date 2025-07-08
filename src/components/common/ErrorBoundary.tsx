import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError } from '../../types';
import { ErrorType } from '../../types';
import { errorService } from '../../services/errorService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    const appError: AppError = {
      type: ErrorType.UNKNOWN,
      code: 'UNKNOWN_ERROR',
      message: error.message,
      details: error.stack,
      timestamp: new Date().toISOString(),
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: 'ErrorBoundary',
      },
    };

    errorService.logError(appError);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-slate-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-dark-bg rounded-xl shadow-2xl border border-border-color dark:border-dark-bg/50 p-6">
            <div className="text-center">
              {/* Error Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                <svg
                  className="h-6 w-6 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              {/* Error Title */}
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Något gick fel
              </h2>

              {/* Error Message */}
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Ett oväntat fel uppstod. Vi har loggat felet och kommer att undersöka det.
              </p>

              {/* Error Details (Development Only) */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Teknisk information (endast utveckling)
                  </summary>
                  <div className="bg-slate-50 dark:bg-dark-bg rounded-lg p-3 text-xs font-mono text-slate-600 dark:text-slate-400 overflow-auto max-h-32">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="whitespace-pre-wrap mt-1">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo && (
                      <div className="mt-2">
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap mt-1">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleRetry}
                  className="flex-1 px-4 py-2 bg-primary dark:bg-blue-600 text-white rounded-lg hover:bg-primary/90 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-blue-400/50 transition-colors"
                >
                  Försök igen
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 px-4 py-2 bg-slate-100 dark:bg-dark-bg text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-dark-bg/50 focus:outline-none focus:ring-2 focus:ring-slate-300/50 dark:focus:ring-dark-bg/50 transition-colors"
                >
                  Ladda om sidan
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error | string) => {
    errorService.handleError(error);
  }, []);

  return { handleError };
} 