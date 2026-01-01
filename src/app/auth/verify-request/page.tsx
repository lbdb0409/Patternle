import { Mail } from 'lucide-react';

export default function VerifyRequestPage() {
  return (
    <div className="max-w-sm mx-auto py-12 text-center">
      <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <Mail className="text-primary-600 dark:text-primary-400" size={32} />
      </div>
      <h1 className="text-2xl font-bold mb-2">Check your email</h1>
      <p className="text-gray-500 mb-6">
        A sign-in link has been sent to your email address. Click the link to continue.
      </p>
      <p className="text-sm text-gray-400">
        If you don't see the email, check your spam folder.
      </p>
    </div>
  );
}
