'use client';

import { useEffect } from 'react';
import { logger } from './lib/logger';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    logger.error('Unhandled client error captured by error boundary', {
      name: error?.name,
      message: error?.message,
      digest: error?.digest,
      stack: error?.stack,
    });
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-sm text-gray-600 mb-4 max-w-md">
        An unexpected error occurred. Our team has been notified.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
