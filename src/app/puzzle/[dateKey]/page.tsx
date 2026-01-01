import { PuzzleGame } from '@/components/puzzle-game';
import { getSession, isSubscribed } from '@/lib/auth';
import { getTodayDateKey, isPast, isFuture } from '@/lib/date-utils';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowLeft } from 'lucide-react';
import { SubscribeButton } from '@/components/subscribe-button';

export const dynamic = 'force-dynamic';

interface PuzzlePageProps {
  params: { dateKey: string };
}

export default async function PuzzlePage({ params }: PuzzlePageProps) {
  const { dateKey } = params;
  const today = getTodayDateKey();

  // Redirect today's puzzle to home
  if (dateKey === today) {
    redirect('/');
  }

  // Can't access future puzzles
  if (isFuture(dateKey)) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-2">Not Available Yet</h1>
        <p className="text-gray-500 mb-6">
          This puzzle hasn't been released yet.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft size={18} />
          Play Today's Puzzle
        </Link>
      </div>
    );
  }

  // Check auth for past puzzles
  if (isPast(dateKey)) {
    const session = await getSession();

    if (!session?.user) {
      return (
        <div className="text-center py-12">
          <Lock className="mx-auto mb-4 text-gray-400" size={48} />
          <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
          <p className="text-gray-500 mb-6">
            Sign in to access past puzzles.
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

    const hasSubscription = await isSubscribed();
    if (!hasSubscription) {
      return (
        <div className="text-center py-12">
          <Lock className="mx-auto mb-4 text-gray-400" size={48} />
          <h1 className="text-2xl font-bold mb-2">Subscription Required</h1>
          <p className="text-gray-500 mb-6">
            Subscribe for $3/month to access past puzzles.
          </p>
          <SubscribeButton />
        </div>
      );
    }
  }

  return (
    <div className="space-y-4">
      <Link
        href="/archive"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} />
        Back to Archive
      </Link>

      <PuzzleGame dateKey={dateKey} />
    </div>
  );
}
