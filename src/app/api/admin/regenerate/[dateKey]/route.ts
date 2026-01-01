import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { generatePuzzle } from '@/lib/puzzle-generator';
import { getPuzzleNumber } from '@/lib/date-utils';

export async function POST(
  request: Request,
  { params }: { params: { dateKey: string } }
) {
  try {
    // Check admin auth
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { dateKey } = params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    // Check for existing puzzle
    const existing = await db.puzzle.findUnique({
      where: { dateKey },
    });

    // Generate new puzzle
    console.log(`Regenerating puzzle for ${dateKey}...`);
    const { puzzle, isFallback } = await generatePuzzle(dateKey);

    const puzzleNumber = existing?.puzzleNumber || getPuzzleNumber(dateKey);

    // Update or create
    const updated = await db.puzzle.upsert({
      where: { dateKey },
      create: {
        dateKey,
        puzzleNumber,
        difficulty: 'hard',
        ruleProgramType: puzzle.ruleProgramType,
        ruleProgramParams: JSON.stringify(puzzle.ruleProgramParams),
        tags: JSON.stringify(puzzle.tags),
        primarySequence: JSON.stringify(puzzle.sequences[0]),
        sequences: JSON.stringify(puzzle.sequences),
        answers: JSON.stringify(puzzle.answers),
        hints: JSON.stringify(puzzle.hints),
        explanation: puzzle.explanation,
        isFallback,
      },
      update: {
        difficulty: 'hard',
        ruleProgramType: puzzle.ruleProgramType,
        ruleProgramParams: JSON.stringify(puzzle.ruleProgramParams),
        tags: JSON.stringify(puzzle.tags),
        primarySequence: JSON.stringify(puzzle.sequences[0]),
        sequences: JSON.stringify(puzzle.sequences),
        answers: JSON.stringify(puzzle.answers),
        hints: JSON.stringify(puzzle.hints),
        explanation: puzzle.explanation,
        isFallback,
        updatedAt: new Date(),
      },
    });

    // Optionally clear existing attempts/progress for this puzzle
    // (Commented out to preserve user data - enable if needed)
    // await db.attempt.deleteMany({ where: { puzzleId: updated.id } });
    // await db.hintUse.deleteMany({ where: { puzzleId: updated.id } });
    // await db.progress.deleteMany({ where: { puzzleId: updated.id } });

    return NextResponse.json({
      success: true,
      puzzleId: updated.id,
      dateKey: updated.dateKey,
      puzzleNumber: updated.puzzleNumber,
      isFallback,
      ruleProgramType: puzzle.ruleProgramType,
      wasUpdate: !!existing,
    });
  } catch (error) {
    console.error('Error regenerating puzzle:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate puzzle', details: String(error) },
      { status: 500 }
    );
  }
}
