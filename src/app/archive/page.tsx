import { getSession, isSubscribed } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTodayDateKey, formatDateForDisplay } from '@/lib/date-utils';
import Link from 'next/link';
import { Lock, CheckCircle, XCircle, Circle } from 'lucide-react';
import { SubscriptionPrompt } from '@/components/subscription-prompt';

export const dynamic = 'force-dynamic';

export default async function ArchivePage() {
  const session = await getSession();
  const hasSubscription = await isSubscribed();

  if (!session?.user) {
    return (
      <div className="text-center py-12">
        <Lock className="mx-auto mb-4 text-gray-400" size={48} />
        <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
        <p className="text-gray-500 mb-6">
          Sign in to access the puzzle archive.
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

  // Fetch archive puzzles with user progress
  const today = getTodayDateKey();
  const puzzles = await db.puzzle.findMany({
    where: {
      dateKey: { lt: today },
      isPublished: true,
    },
    orderBy: { dateKey: 'desc' },
    select: {
      id: true,
      dateKey: true,
      puzzleNumber: true,
      difficulty: true,
      tags: true,
    },
  });

  const progress = await db.progress.findMany({
    where: {
      userId: session.user.id,
      puzzleId: { in: puzzles.map((p) => p.id) },
    },
  });

  const progressMap = new Map(progress.map((p) => [p.puzzleId, p]));

  const archivePuzzles = puzzles.map((puzzle) => {
    const userProgress = progressMap.get(puzzle.id);
    return {
      ...puzzle,
      formattedDate: formatDateForDisplay(puzzle.dateKey),
      tags: JSON.parse(puzzle.tags),
      solved: userProgress?.solved || false,
      attempted: (userProgress?.attemptsUsed || 0) > 0,
      failed: (userProgress?.attemptsUsed || 0) >= 5 && !userProgress?.solved,
    };
  });

  const solvedCount = archivePuzzles.filter((p) => p.solved).length;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Puzzle Archive</h1>
        <p className="text-gray-500">
          {solvedCount} of {archivePuzzles.length} puzzles solved
        </p>
      </div>

      {archivePuzzles.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No archive puzzles available yet. Check back tomorrow!
        </div>
      ) : (
        <div className="grid gap-3">
          {archivePuzzles.map((puzzle) => (
            <Link
              key={puzzle.id}
              href={`/puzzle/${puzzle.dateKey}`}
              className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
            >
              <div className="flex-shrink-0">
                {puzzle.solved ? (
                  <CheckCircle className="text-green-500" size={24} />
                ) : puzzle.failed ? (
                  <XCircle className="text-red-500" size={24} />
                ) : puzzle.attempted ? (
                  <Circle className="text-yellow-500" size={24} />
                ) : (
                  <Circle className="text-gray-300" size={24} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">#{puzzle.puzzleNumber}</div>
                <div className="text-sm text-gray-500">{puzzle.formattedDate}</div>
              </div>
              <div className="flex-shrink-0 text-xs text-gray-400 uppercase">
                {puzzle.difficulty}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
