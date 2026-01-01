import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTodayDateKey, formatDateForDisplay, isPast, isFuture, getPuzzleNumber } from '@/lib/date-utils';
import { getSession, isSubscribed } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { dateKey: string } }
) {
  try {
    const { dateKey } = params;
    const today = getTodayDateKey();
    const url = new URL(request.url);
    const revealAnswer = url.searchParams.get('reveal') === 'true';

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    // Can't access future puzzles
    if (isFuture(dateKey)) {
      return NextResponse.json(
        { error: 'This puzzle is not yet available.' },
        { status: 403 }
      );
    }

    // For past puzzles, require subscription
    if (isPast(dateKey)) {
      const session = await getSession();
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Sign in to access past puzzles.' },
          { status: 401 }
        );
      }

      const hasSubscription = await isSubscribed();
      if (!hasSubscription) {
        return NextResponse.json(
          { error: 'Subscribe to access the puzzle archive.' },
          { status: 403 }
        );
      }
    }

    // Get the puzzle
    const puzzle = await db.puzzle.findUnique({
      where: { dateKey },
    });

    if (!puzzle) {
      return NextResponse.json(
        { error: 'No puzzle found for this date.' },
        { status: 404 }
      );
    }

    // Get user progress if logged in
    const session = await getSession();
    let progress = null;
    let hintsUsed: number[] = [];

    if (session?.user?.id) {
      progress = await db.progress.findUnique({
        where: {
          userId_puzzleId: {
            userId: session.user.id,
            puzzleId: puzzle.id,
          },
        },
      });

      const usedHints = await db.hintUse.findMany({
        where: {
          userId: session.user.id,
          puzzleId: puzzle.id,
        },
      });
      hintsUsed = usedHints.map((h) => h.hintIndex);
    }

    const sequences = JSON.parse(puzzle.sequences);
    const answers = JSON.parse(puzzle.answers);
    const tags = JSON.parse(puzzle.tags);

    const attemptsUsed = progress?.attemptsUsed || 0;

    const isSolved = progress?.solved || false;
    const isFailed = attemptsUsed >= 5 && !isSolved;

    const response = {
      id: puzzle.id,
      dateKey: puzzle.dateKey,
      puzzleNumber: getPuzzleNumber(puzzle.dateKey),
      formattedDate: formatDateForDisplay(puzzle.dateKey),
      difficulty: puzzle.difficulty,
      tags,
      sequences,
      primarySequenceIndex: 0,
      attemptsUsed,
      attemptsRemaining: Math.max(0, 5 - attemptsUsed),
      hintsUsed,
      hintsRemaining: Math.max(0, 2 - hintsUsed.length),
      solved: isSolved,
      failed: isFailed,
      isArchive: isPast(dateKey),
      ...(isSolved || isFailed || revealAnswer
        ? {
            answer: answers[0],
            explanation: puzzle.explanation,
          }
        : {}),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching puzzle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch puzzle' },
      { status: 500 }
    );
  }
}
