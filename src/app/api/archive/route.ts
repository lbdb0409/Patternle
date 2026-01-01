import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, isSubscribed } from '@/lib/auth';
import { getTodayDateKey, formatDateForDisplay, getPuzzleNumber } from '@/lib/date-utils';

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Sign in to access the archive' },
        { status: 401 }
      );
    }

    const hasSubscription = await isSubscribed();
    if (!hasSubscription) {
      return NextResponse.json(
        { error: 'Subscribe to access the archive' },
        { status: 403 }
      );
    }

    const today = getTodayDateKey();

    // Get all past puzzles
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

    // Get user's progress for these puzzles
    const progress = await db.progress.findMany({
      where: {
        userId: session.user.id,
        puzzleId: { in: puzzles.map((p) => p.id) },
      },
    });

    const progressMap = new Map(progress.map((p) => [p.puzzleId, p]));

    // Format response - compute puzzle numbers dynamically
    const archivePuzzles = puzzles.map((puzzle) => {
      const userProgress = progressMap.get(puzzle.id);
      return {
        id: puzzle.id,
        dateKey: puzzle.dateKey,
        puzzleNumber: getPuzzleNumber(puzzle.dateKey),
        formattedDate: formatDateForDisplay(puzzle.dateKey),
        difficulty: puzzle.difficulty,
        tags: JSON.parse(puzzle.tags),
        solved: userProgress?.solved || false,
        attemptsUsed: userProgress?.attemptsUsed || 0,
      };
    });

    return NextResponse.json({ puzzles: archivePuzzles });
  } catch (error) {
    console.error('Error fetching archive:', error);
    return NextResponse.json(
      { error: 'Failed to fetch archive' },
      { status: 500 }
    );
  }
}
