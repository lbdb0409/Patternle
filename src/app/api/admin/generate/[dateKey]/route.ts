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

    // Check if puzzle already exists
    const existing = await db.puzzle.findUnique({
      where: { dateKey },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Puzzle already exists for this date. Use regenerate endpoint.' },
        { status: 409 }
      );
    }

    // Generate the puzzle
    console.log(`Generating puzzle for ${dateKey}...`);
    const { puzzle, isFallback } = await generatePuzzle(dateKey);

    // Store in database
    const puzzleNumber = getPuzzleNumber(dateKey);

    const created = await db.puzzle.create({
      data: {
        dateKey,
        puzzleNumber,
        difficulty: puzzle.ruleProgramParams ? 'hard' : 'medium',
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
    });

    return NextResponse.json({
      success: true,
      puzzleId: created.id,
      dateKey: created.dateKey,
      puzzleNumber: created.puzzleNumber,
      isFallback,
      ruleProgramType: puzzle.ruleProgramType,
    });
  } catch (error) {
    console.error('Error generating puzzle:', error);
    return NextResponse.json(
      { error: 'Failed to generate puzzle', details: String(error) },
      { status: 500 }
    );
  }
}
