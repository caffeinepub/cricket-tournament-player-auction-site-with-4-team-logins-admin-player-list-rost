import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import CrashFallbackScreen from './CrashFallbackScreen';

interface FatalError {
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
}

interface FatalErrorContextType {
  fatalError: FatalError | null;
  setFatalError: (error: FatalError | null) => void;
}

const FatalErrorContext = createContext<FatalErrorContextType | undefined>(undefined);

export function useFatalError() {
  const context = useContext(FatalErrorContext);
  if (!context) {
    throw new Error('useFatalError must be used within FatalErrorProvider');
  }
  return context;
}

interface FatalErrorProviderProps {
  children: ReactNode;
}

export default function FatalErrorProvider({ children }: FatalErrorProviderProps) {
  const [fatalError, setFatalError] = useState<FatalError | null>(null);

  if (fatalError) {
    const error = new Error(fatalError.message);
    if (fatalError.stack) {
      error.stack = fatalError.stack;
    }

    return (
      <CrashFallbackScreen
        error={error}
        onReset={() => {
          setFatalError(null);
          window.location.hash = '#/';
          window.location.reload();
        }}
      />
    );
  }

  return (
    <FatalErrorContext.Provider value={{ fatalError, setFatalError }}>
      {children}
    </FatalErrorContext.Provider>
  );
}
