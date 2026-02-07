interface GlobalErrorContext {
  url: string;
  origin: string;
  hash: string;
  timestamp: string;
  userAgent: string;
}

interface CapturedError {
  message: string;
  stack?: string;
  context: GlobalErrorContext;
  type: 'error' | 'unhandledrejection';
}

type ErrorCallback = (error: CapturedError) => void;

let errorCallback: ErrorCallback | null = null;

function getErrorContext(): GlobalErrorContext {
  return {
    url: window.location.href,
    origin: window.location.origin,
    hash: window.location.hash,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  };
}

function handleError(event: ErrorEvent) {
  const capturedError: CapturedError = {
    message: event.message || 'Unknown error',
    stack: event.error?.stack,
    context: getErrorContext(),
    type: 'error',
  };

  console.error('[Global Error Handler]', capturedError);

  if (errorCallback) {
    errorCallback(capturedError);
  }
}

function handleUnhandledRejection(event: PromiseRejectionEvent) {
  const error = event.reason;
  const capturedError: CapturedError = {
    message: error?.message || String(error) || 'Unhandled promise rejection',
    stack: error?.stack,
    context: getErrorContext(),
    type: 'unhandledrejection',
  };

  console.error('[Unhandled Rejection Handler]', capturedError);

  if (errorCallback) {
    errorCallback(capturedError);
  }
}

export function initializeGlobalErrorHandling(callback?: ErrorCallback) {
  if (callback) {
    errorCallback = callback;
  }

  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  console.log('[Global Error Handling] Initialized');
}

export function cleanupGlobalErrorHandling() {
  window.removeEventListener('error', handleError);
  window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  errorCallback = null;
}
