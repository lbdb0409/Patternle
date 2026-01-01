import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { generatePuzzle } from '@/lib/puzzle-generator';
import { getTodayDateKey, getPuzzleNumber, getDateKeyOffset } from '@/lib/date-utils';

/**
 * Cron job to generate the daily puzzle.
 * Should be scheduled to run at midnight Melbourne time.
 *
 * For Vercel Cron, add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/generate-daily",
 *     "schedule": "0 13 * * *"
 *   }]
 * }
 * Note: 13:00 UTC = 00:00 Melbourne (AEDT) or 0 14 * * * for AEST
 *
 * For self-hosted, use node-cron or a system cron job.
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret (Vercel Cron or custom)
    const authHeader = headers().get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // For Vercel Cron, check the CRON_SECRET header
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate puzzle for today
    const dateKey = getTodayDateKey();

    // Check if puzzle already exists
    const existing = await db.puzzle.findUnique({
      where: { dateKey },
    });

    if (existing) {
      console.log(`Puzzle for ${dateKey} already exists`);
      return NextResponse.json({
        success: true,
        message: 'Puzzle already exists',
        dateKey,
        puzzleId: existing.id,
      });
    }

    // Generate the puzzle
    console.log(`Generating puzzle for ${dateKey}...`);
    const { puzzle, isFallback } = await generatePuzzle(dateKey);

    const puzzleNumber = getPuzzleNumber(dateKey);

    // Store in database
    const created = await db.puzzle.create({
      data: {
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
    });

    console.log(`Puzzle created: ${created.id} for ${dateKey}`);

    return NextResponse.json({
      success: true,
      message: 'Puzzle generated successfully',
      puzzleId: created.id,
      dateKey: created.dateKey,
      puzzleNumber: created.puzzleNumber,
      isFallback,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Failed to generate daily puzzle', details: String(error) },
      { status: 500 }
    );
  }
}

// Also allow POST for manual triggering
export async function POST(request: Request) {
  return GET(request);
}
