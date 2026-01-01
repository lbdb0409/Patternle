'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

const errorMessages: Record<string, string> = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'You do not have permission to sign in.',
  Verification: 'The verification link may have expired or already been used.',
  Default: 'An error occurred during sign in.',
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessage = error
    ? errorMessages[error] || errorMessages.Default
    : errorMessages.Default;

  return (
    <div className="max-w-sm mx-auto py-12 text-center">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertTriangle className="text-red-600 dark:text-red-400" size={32} />
      </div>
      <h1 className="text-2xl font-bold mb-2">Authentication Error</h1>
      <p className="text-gray-500 mb-6">{errorMessage}</p>
      <Link
        href="/auth/signin"
        className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
      >
        Try Again
      </Link>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="max-w-sm mx-auto py-12 text-center">
      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-6 animate-pulse" />
      <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-2 animate-pulse" />
      <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-6 animate-pulse" />
      <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse" />
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ErrorContent />
    </Suspense>
  );
}
