import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, isSubscribed } from '@/lib/auth';
import { getTodayDateKey, formatDateForDisplay } from '@/lib/date-utils';

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Sign in to access practice mode' },
        { status: 401 }
      );
    }

    const hasSubscription = await isSubscribed();
    if (!hasSubscription) {
      return NextResponse.json(
        { error: 'Subscribe to access practice mode' },
        { status: 403 }
      );
    }

    const today = getTodayDateKey();

    // Get a random puzzle from the archive (not today's)
    const puzzles = await db.puzzle.findMany({
      where: {
        dateKey: { not: today },
        isPublished: true,
      },
      select: { id: true },
    });

    if (puzzles.length === 0) {
      return NextResponse.json(
        { error: 'No practice puzzles available yet' },
        { status: 404 }
      );
    }

    // Pick a random one
    const randomIndex = Math.floor(Math.random() * puzzles.length);
    const randomPuzzle = await db.puzzle.findUnique({
      where: { id: puzzles[randomIndex].id },
    });

    if (!randomPuzzle) {
      return NextResponse.json(
        { error: 'Failed to load practice puzzle' },
        { status: 500 }
      );
    }

    // For practice mode, we start fresh (no saved progress)
    const sequences = JSON.parse(randomPuzzle.sequences);
    const tags = JSON.parse(randomPuzzle.tags);

    const response = {
      id: randomPuzzle.id,
      dateKey: randomPuzzle.dateKey,
      puzzleNumber: randomPuzzle.puzzleNumber,
      formattedDate: formatDateForDisplay(randomPuzzle.dateKey),
      difficulty: randomPuzzle.difficulty,
      tags,
      sequences: [sequences[0]], // Start with just the first sequence
      primarySequenceIndex: 0,
      attemptsUsed: 0,
      attemptsRemaining: 5,
      hintsUsed: [],
      hintsRemaining: 2,
      solved: false,
      failed: false,
      isPractice: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching practice puzzle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch practice puzzle' },
      { status: 500 }
    );
  }
}
