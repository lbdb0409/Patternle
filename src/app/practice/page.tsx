import { getSession, isSubscribed } from '@/lib/auth';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { SubscriptionPrompt } from '@/components/subscription-prompt';
import { PracticeContent } from '@/components/practice-content';

export const dynamic = 'force-dynamic';

export default async function PracticePage() {
  const session = await getSession();
  const hasSubscription = await isSubscribed();

  if (!session?.user) {
    return (
      <div className="text-center py-12">
        <Lock className="mx-auto mb-4 text-gray-400" size={48} />
        <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
        <p className="text-gray-500 mb-6">
          Sign in to access practice mode.
        </p>
        <Link
          href="/auth/signin"
          className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (!hasSubscription) {
    return (
      <div className="py-8">
        <SubscriptionPrompt />
      </div>
    );
  }

  return <PracticeContent />;
}
