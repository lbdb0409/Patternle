import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generatePuzzle, FALLBACK_PUZZLES } from '@/lib/puzzle-generator';
import { getPuzzleNumber, getTodayDateKey } from '@/lib/date-utils';
import { format, addDays, parseISO } from 'date-fns';

const PUZZLES_TO_GENERATE = 365; // Generate 1 year at a time
const MIN_DAYS_REMAINING = 7; // Trigger when less than 7 days of puzzles remain

/**
 * Cron endpoint to auto-generate puzzles when running low.
 *
 * Set up in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/generate-puzzles",
 *     "schedule": "0 13 * * *"  // 13:00 UTC = midnight AEST
 *   }]
 * }
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the latest puzzle date
    const latestPuzzle = await db.puzzle.findFirst({
      orderBy: { dateKey: 'desc' },
      select: { dateKey: true },
    });

    if (!latestPuzzle) {
      return NextResponse.json({
        error: 'No puzzles in database. Run npm run generate-puzzles first.'
      }, { status: 400 });
    }

    const today = getTodayDateKey();
    const latestDate = latestPuzzle.dateKey;

    // Calculate days remaining
    const todayDate = parseISO(today);
    const latestPuzzleDate = parseISO(latestDate);
    const daysRemaining = Math.floor(
      (latestPuzzleDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    console.log(`Puzzle check: ${daysRemaining} days of puzzles remaining (latest: ${latestDate})`);

    // If we have enough puzzles, skip
    if (daysRemaining >= MIN_DAYS_REMAINING) {
      return NextResponse.json({
        message: 'Sufficient puzzles available',
        daysRemaining,
        latestPuzzleDate: latestDate,
        nextCheck: 'Will generate more when < 7 days remain',
      });
    }

    // Generate more puzzles
    console.log(`Generating ${PUZZLES_TO_GENERATE} new puzzles...`);

    let generated = 0;
    let failed = 0;
    const startDate = addDays(latestPuzzleDate, 1);

    for (let i = 0; i < PUZZLES_TO_GENERATE; i++) {
      const date = addDays(startDate, i);
      const dateKey = format(date, 'yyyy-MM-dd');

      try {
        // Check if exists
        const existing = await db.puzzle.findUnique({
          where: { dateKey },
        });

        if (existing) {
          continue;
        }

        // Generate puzzle
        let puzzle;
        let isFallback = false;

        try {
          const result = await generatePuzzle(dateKey);
          puzzle = result.puzzle;
          isFallback = result.isFallback;
        } catch {
          puzzle = FALLBACK_PUZZLES[i % FALLBACK_PUZZLES.length];
          isFallback = true;
        }

        const puzzleNumber = getPuzzleNumber(dateKey);

        await db.puzzle.create({
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
            isPublished: true,
          },
        });

        generated++;
        console.log(`Generated puzzle for ${dateKey} (${generated}/${PUZZLES_TO_GENERATE})`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to generate puzzle for ${dateKey}:`, error);
        failed++;
      }
    }

    const newLatestPuzzle = await db.puzzle.findFirst({
      orderBy: { dateKey: 'desc' },
      select: { dateKey: true },
    });

    return NextResponse.json({
      success: true,
      generated,
      failed,
      previousLatestDate: latestDate,
      newLatestDate: newLatestPuzzle?.dateKey,
      message: `Generated ${generated} puzzles, ${failed} failed`,
    });
  } catch (error) {
    console.error('Cron puzzle generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate puzzles', details: String(error) },
      { status: 500 }
    );
  }
}
