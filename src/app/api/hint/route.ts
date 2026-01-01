import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

const HintSchema = z.object({
  puzzleId: z.string(),
  hintIndex: z.number().int().min(1).max(2),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { puzzleId, hintIndex } = HintSchema.parse(body);

    // Get the puzzle
    const puzzle = await db.puzzle.findUnique({
      where: { id: puzzleId },
    });

    if (!puzzle) {
      return NextResponse.json(
        { error: 'Puzzle not found' },
        { status: 404 }
      );
    }

    const session = await getSession();
    const userId = session?.user?.id;

    // Check if user has already used this hint
    if (userId) {
      const existingUse = await db.hintUse.findUnique({
        where: {
          userId_puzzleId_hintIndex: {
            userId,
            puzzleId,
            hintIndex,
          },
        },
      });

      if (existingUse) {
        // Return the hint anyway (they already used it)
        const hints = JSON.parse(puzzle.hints);
        return NextResponse.json({
          hint: hints[hintIndex - 1],
          hintIndex,
          alreadyUsed: true,
        });
      }

      // Count total hints used for this puzzle
      const hintsUsed = await db.hintUse.count({
        where: {
          userId,
          puzzleId,
        },
      });

      if (hintsUsed >= 2) {
        return NextResponse.json(
          { error: 'Maximum hints (2) already used for this puzzle' },
          { status: 400 }
        );
      }

      // Check if puzzle is already solved
      const progress = await db.progress.findUnique({
        where: {
          userId_puzzleId: {
            userId,
            puzzleId,
          },
        },
      });

      if (progress?.solved || (progress?.attemptsUsed || 0) >= 5) {
        return NextResponse.json(
          { error: 'Puzzle is already finished' },
          { status: 400 }
        );
      }

      // Record hint use
      await db.hintUse.create({
        data: {
          userId,
          puzzleId,
          hintIndex,
        },
      });

      // Update progress
      await db.progress.upsert({
        where: {
          userId_puzzleId: {
            userId,
            puzzleId,
          },
        },
        create: {
          userId,
          puzzleId,
          hintsUsed: 1,
        },
        update: {
          hintsUsed: { increment: 1 },
        },
      });
    }

    // Return the hint (for both logged in and anonymous users)
    const hints = JSON.parse(puzzle.hints);
    const hint = hints[hintIndex - 1];

    if (!hint) {
      return NextResponse.json(
        { error: 'Invalid hint index' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      hint,
      hintIndex,
      alreadyUsed: false,
    });
  } catch (error: unknown) {
    console.error('Error getting hint:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to get hint' },
      { status: 500 }
    );
  }
}
