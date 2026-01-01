import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTodayDateKey, formatDateForDisplay, getPuzzleNumber } from '@/lib/date-utils';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const dateKey = getTodayDateKey();

    // Get today's puzzle
    const puzzle = await db.puzzle.findUnique({
      where: { dateKey },
    });

    if (!puzzle) {
      return NextResponse.json(
        { error: 'No puzzle available for today. Please check back later.' },
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

      // Get used hints
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

    // If solved or failed (5 attempts), include the answer and explanation
    const isSolved = progress?.solved || false;
    const isFailed = attemptsUsed >= 5 && !isSolved;

    const response = {
      id: puzzle.id,
      dateKey: puzzle.dateKey,
      puzzleNumber: puzzle.puzzleNumber,
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
      // Only include answer and explanation if finished
      ...(isSolved || isFailed
        ? {
            answer: answers[0],
            explanation: puzzle.explanation,
          }
        : {}),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching today puzzle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch puzzle' },
      { status: 500 }
    );
  }
}
