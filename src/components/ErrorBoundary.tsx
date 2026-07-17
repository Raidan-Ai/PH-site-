import React, { ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const err = error as Error;
  let errorMessage = 'An unexpected error occurred.';
  let errorDetails = '';

  try {
    const parsedError = JSON.parse(err.message);
    if (parsedError.error && parsedError.operationType) {
      errorMessage = 'A database permission error occurred.';
      errorDetails = `Operation: ${parsedError.operationType}, Path: ${parsedError.path || 'unknown'}. Details: ${parsedError.error}`;
    } else {
      errorMessage = err.message;
    }
  } catch (e) {
    errorMessage = err.message;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-md w-full text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Oops! Something went wrong.</h1>
        <p className="text-slate-600 mb-4">{errorMessage}</p>
        {errorDetails && (
          <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm text-left mb-6 overflow-auto">
            {errorDetails}
          </div>
        )}
        <button
          onClick={resetErrorBoundary}
          className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

interface Props {
  children?: ReactNode;
}

export const ErrorBoundary: React.FC<Props> = ({ children }) => {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ReactErrorBoundary>
  );
};
