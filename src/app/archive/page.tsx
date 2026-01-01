import { getSession, isSubscribed } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTodayDateKey, formatDateForDisplay, getPuzzleNumber } from '@/lib/date-utils';
import Link from 'next/link';
import { Lock, CheckCircle, XCircle, Circle, ChevronLeft, ChevronRight } from 'lucide-react';
import { SubscriptionPrompt } from '@/components/subscription-prompt';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Puzzle Archive - Patternle | Play Past Daily Number Puzzles',
  description: 'Access the Patternle puzzle archive! Play hundreds of past daily number sequence puzzles. Like Wordle archives but for math. Track your progress and solve them all.',
  alternates: {
    canonical: 'https://www.patternle.net/archive',
  },
  openGraph: {
    title: 'Patternle Puzzle Archive - Past Daily Challenges',
    description: 'Play past Patternle puzzles from the archive. Hundreds of number sequence puzzles to solve!',
  },
};

const PUZZLES_PER_PAGE = 20;

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const currentPage = Math.max(1, parseInt(searchParams.page || '1', 10));
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

  // Get total count for pagination
  const today = getTodayDateKey();
  const totalCount = await db.puzzle.count({
    where: {
      dateKey: { lt: today },
      isPublished: true,
    },
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / PUZZLES_PER_PAGE));
  const validPage = Math.min(currentPage, totalPages);
  const skip = (validPage - 1) * PUZZLES_PER_PAGE;

  // Fetch archive puzzles with user progress (paginated)
  const puzzles = await db.puzzle.findMany({
    where: {
      dateKey: { lt: today },
      isPublished: true,
    },
    orderBy: { dateKey: 'desc' },
    skip,
    take: PUZZLES_PER_PAGE,
    select: {
      id: true,
      dateKey: true,
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
      puzzleNumber: getPuzzleNumber(puzzle.dateKey),
      formattedDate: formatDateForDisplay(puzzle.dateKey),
      tags: JSON.parse(puzzle.tags),
      solved: userProgress?.solved || false,
      attempted: (userProgress?.attemptsUsed || 0) > 0,
      failed: (userProgress?.attemptsUsed || 0) >= 5 && !userProgress?.solved,
    };
  });

  // Get total solved count (all pages)
  const allPuzzleIds = await db.puzzle.findMany({
    where: {
      dateKey: { lt: today },
      isPublished: true,
    },
    select: { id: true },
  });

  const solvedProgress = await db.progress.count({
    where: {
      userId: session.user.id,
      puzzleId: { in: allPuzzleIds.map((p) => p.id) },
      solved: true,
    },
  });

  const solvedCount = solvedProgress;

  return (
    <div className="space-y-6">
      {/* Hidden SEO content for archive page */}
      <div className="sr-only" aria-hidden="true">
        <h1>Patternle Puzzle Archive - Play Past Daily Number Puzzles</h1>
        <p>
          Browse and play past Patternle puzzles from the archive. Like Wordle archives, Nerdle history,
          and Mathler past puzzles, our archive lets you revisit and solve previous daily challenges.
          Perfect for puzzle enthusiasts who want more number sequence games, pattern recognition practice,
          and brain training exercises.
        </p>
        <p>
          Each puzzle features unique number sequences including arithmetic progressions, geometric sequences,
          Fibonacci patterns, prime number sequences, and more. Track your progress, compete for completion,
          and improve your pattern recognition skills.
        </p>
        <p>
          Keywords: puzzle archive, past puzzles, wordle archive, nerdle history, mathler past games,
          number sequence collection, pattern puzzles, daily puzzle history, brain games archive,
          math puzzle collection, sequence games, logic puzzles
        </p>
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Puzzle Archive</h1>
        <p className="text-gray-500">
          {solvedCount} of {totalCount} puzzles solved
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

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-1 pt-4">
          {/* Previous button */}
          {validPage > 1 ? (
            <Link
              href={`/archive?page=${validPage - 1}`}
              className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft size={20} />
            </Link>
          ) : (
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed">
              <ChevronLeft size={20} />
            </div>
          )}

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {generatePageNumbers(validPage, totalPages).map((pageNum, idx) =>
              pageNum === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                  ...
                </span>
              ) : (
                <Link
                  key={pageNum}
                  href={`/archive?page=${pageNum}`}
                  className={`flex items-center justify-center min-w-[2.5rem] h-10 px-3 rounded-lg border transition-colors ${
                    pageNum === validPage
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {pageNum}
                </Link>
              )
            )}
          </div>

          {/* Next button */}
          {validPage < totalPages ? (
            <Link
              href={`/archive?page=${validPage + 1}`}
              className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight size={20} />
            </Link>
          ) : (
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed">
              <ChevronRight size={20} />
            </div>
          )}
        </nav>
      )}
    </div>
  );
}

/**
 * Generates an array of page numbers to display, with ellipsis for gaps.
 * Shows: first page, last page, current page, and 1-2 pages around current.
 */
function generatePageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];

  // Always show first page
  pages.push(1);

  // Calculate range around current page
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  // Add ellipsis after first page if needed
  if (start > 2) {
    pages.push('...');
  }

  // Add pages around current
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // Add ellipsis before last page if needed
  if (end < total - 1) {
    pages.push('...');
  }

  // Always show last page
  pages.push(total);

  return pages;
}
