import { AppError, ErrorCode, ErrorHandler, ErrorType } from '../types';

class ErrorService implements ErrorHandler {
  private errorLog: AppError[] = [];
  private readonly maxLogSize = 100;

  /**
   * Create a standardized AppError from various error types
   */
  private createAppError(error: Error | string, code: ErrorCode = 'UNKNOWN_ERROR', context?: Record<string, any>): AppError {
    const message = typeof error === 'string' ? error : error.message;
    const details = error instanceof Error ? error.stack : undefined;
    
    return {
      type: ErrorType.UNKNOWN,
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      context
    };
  }



  /**
   * Handle any type of error with appropriate logging and user feedback
   */
  handleError(error: AppError | Error | string): void {
    const appError = this.isAppError(error) ? error : this.createAppError(error);
    
    this.logError(appError);
    this.showUserFriendlyError(appError);
  }

  /**
   * Log error for debugging purposes
   */
  logError(error: AppError | Error | string, context?: Record<string, any>): void {
    const appError = this.isAppError(error) ? error : this.createAppError(error, 'UNKNOWN_ERROR', context);
    
    // Add to internal log
    this.errorLog.push(appError);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift(); // Remove oldest error
    }

    // Console logging for development
    if (import.meta.env.DEV) {
      console.group(`🚨 Error [${appError.code}]`);
      console.error('Message:', appError.message);
      console.error('Details:', appError.details);
      console.error('Context:', appError.context);
      console.error('Timestamp:', appError.timestamp);
      console.groupEnd();
    }

    // TODO: In production, send to error tracking service (Sentry, etc.)
    // if (import.meta.env.PROD) {
    //   // Send to error tracking service
    // }
  }

  /**
   * Show user-friendly error message
   */
  showUserFriendlyError(error: AppError | Error | string): void {
    const appError = this.isAppError(error) ? error : this.createAppError(error);
    
    // Create user-friendly message based on error code
    const userMessage = this.getUserFriendlyMessage(appError);
    
    // Show in UI (you can integrate this with your global feedback system)
    console.warn('User Error:', userMessage);
    
    // TODO: Integrate with global feedback system
    // showGlobalFeedback(userMessage, 'error');
  }

  /**
   * Get user-friendly error message based on error code
   */
  private getUserFriendlyMessage(error: AppError): string {
    switch (error.code) {
      case 'AUTH_FAILED':
        return 'Inloggningen misslyckades. Kontrollera dina uppgifter och försök igen.';
      case 'NETWORK_ERROR':
        return 'Nätverksfel. Kontrollera din internetanslutning och försök igen.';
      case 'VALIDATION_ERROR':
        return 'Ogiltig inmatning. Kontrollera dina uppgifter och försök igen.';
      case 'PERMISSION_DENIED':
        return 'Du har inte behörighet att utföra denna åtgärd.';
      case 'NOT_FOUND':
        return 'Det begärda innehållet kunde inte hittas.';
      case 'ALREADY_EXISTS':
        return 'Detta innehåll finns redan.';
      case 'INVALID_INPUT':
        return 'Ogiltig inmatning. Kontrollera dina uppgifter.';
      case 'UPLOAD_FAILED':
        return 'Uppladdningen misslyckades. Kontrollera filen och försök igen.';
      case 'PROCESSING_ERROR':
        return 'Ett fel uppstod vid bearbetning. Försök igen senare.';
      case 'UNKNOWN_ERROR':
      default:
        return 'Ett oväntat fel uppstod. Försök igen senare.';
    }
  }

  /**
   * Check if error is already an AppError
   */
  private isAppError(error: any): error is AppError {
    return error && typeof error === 'object' && 'code' in error && 'message' in error;
  }

  /**
   * Create specific error types for common scenarios
   */
  createAuthError(message: string, details?: string): AppError {
    return this.createAppError(message, 'AUTH_FAILED', { details });
  }

  createNetworkError(message: string, details?: string): AppError {
    return this.createAppError(message, 'NETWORK_ERROR', { details });
  }

  createValidationError(message: string, field?: string): AppError {
    return this.createAppError(message, 'VALIDATION_ERROR', { field });
  }

  createPermissionError(message: string): AppError {
    return this.createAppError(message, 'PERMISSION_DENIED');
  }

  createNotFoundError(message: string): AppError {
    return this.createAppError(message, 'NOT_FOUND');
  }

  createUploadError(message: string, details?: string): AppError {
    return this.createAppError(message, 'UPLOAD_FAILED', { details });
  }

  createProcessingError(message: string, details?: string): AppError {
    return this.createAppError(message, 'PROCESSING_ERROR', { details });
  }

  /**
   * Get error log for debugging
   */
  getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Handle async operations with error catching
   */
  async withErrorHandling<T>(
    operation: () => Promise<T>,
    errorCode: ErrorCode = 'UNKNOWN_ERROR',
    context?: Record<string, any>
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      const appError = this.createAppError(
        error instanceof Error ? error : String(error),
        errorCode,
        context
      );
      this.handleError(appError);
      return null;
    }
  }
}

// Export singleton instance
export const errorService = new ErrorService();

// Export error creation helpers
export const createError = {
  auth: (message: string, details?: string) => errorService.createAuthError(message, details),
  network: (message: string, details?: string) => errorService.createNetworkError(message, details),
  validation: (message: string, field?: string) => errorService.createValidationError(message, field),
  permission: (message: string) => errorService.createPermissionError(message),
  notFound: (message: string) => errorService.createNotFoundError(message),
  upload: (message: string, details?: string) => errorService.createUploadError(message, details),
  processing: (message: string, details?: string) => errorService.createProcessingError(message, details),
}; 