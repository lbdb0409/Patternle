/**
 * Puzzle Generation Script
 * Generates 730 puzzles (2 years) and loads them into the database.
 *
 * Usage:
 *   npm run generate-puzzles
 */

// Load environment variables
import 'dotenv/config';

import { PrismaClient } from '@prisma/client';
import { format, addDays } from 'date-fns';
import { generatePuzzle, FALLBACK_PUZZLES } from '../src/lib/puzzle-generator';
import { getPuzzleNumber } from '../src/lib/date-utils';

const prisma = new PrismaClient();

// Configuration
const TOTAL_PUZZLES = 365; // 1 year
const START_FROM_TOMORROW = true;
const DELAY_BETWEEN_PUZZLES_MS = 2000; // 2 second delay to avoid rate limiting
const BATCH_SIZE = 10; // Save progress every 10 puzzles

// Track progress
let generated = 0;
let failed = 0;
let skipped = 0;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getStartDate(): Date {
  const now = new Date();
  if (START_FROM_TOMORROW) {
    return addDays(now, 1);
  }
  return now;
}

async function generateSinglePuzzle(dateKey: string, index: number): Promise<boolean> {
  try {
    // Check if puzzle already exists
    const existing = await prisma.puzzle.findUnique({
      where: { dateKey },
    });

    if (existing) {
      console.log(`  [${index + 1}/${TOTAL_PUZZLES}] ${dateKey} - Already exists, skipping`);
      skipped++;
      return true;
    }

    console.log(`  [${index + 1}/${TOTAL_PUZZLES}] ${dateKey} - Generating...`);

    // Try AI generation first, fall back to deterministic
    let puzzle;
    let isFallback = false;

    try {
      const result = await generatePuzzle(dateKey);
      puzzle = result.puzzle;
      isFallback = result.isFallback;
    } catch (error) {
      console.log(`    AI failed, using fallback puzzle`);
      // Use fallback based on index to ensure variety
      puzzle = FALLBACK_PUZZLES[index % FALLBACK_PUZZLES.length];
      isFallback = true;
    }

    // Calculate puzzle number
    const puzzleNumber = getPuzzleNumber(dateKey);

    // Store in database
    await prisma.puzzle.create({
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

    const source = isFallback ? '(fallback)' : '(AI)';
    console.log(`    ✓ Created ${source} - ${puzzle.ruleProgramType}`);
    generated++;
    return true;
  } catch (error) {
    console.error(`    ✗ Failed: ${error}`);
    failed++;
    return false;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           PATTERNLE PUZZLE GENERATOR                       ║');
  console.log('║           Generating 730 puzzles (2 years)                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  const startDate = getStartDate();
  console.log(`Starting from: ${format(startDate, 'yyyy-MM-dd')}`);
  console.log(`Ending at: ${format(addDays(startDate, TOTAL_PUZZLES - 1), 'yyyy-MM-dd')}`);
  console.log(`Delay between puzzles: ${DELAY_BETWEEN_PUZZLES_MS}ms`);
  console.log('');

  // Check OpenRouter API key
  if (!process.env.OPENROUTER_API_KEY) {
    console.log('⚠️  Warning: OPENROUTER_API_KEY not set. Will use fallback puzzles.');
    console.log('   Set it in .env for AI-generated puzzles.');
    console.log('');
  }

  const startTime = Date.now();

  for (let i = 0; i < TOTAL_PUZZLES; i++) {
    const date = addDays(startDate, i);
    const dateKey = format(date, 'yyyy-MM-dd');

    await generateSinglePuzzle(dateKey, i);

    // Progress update every batch
    if ((i + 1) % BATCH_SIZE === 0) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const rate = (i + 1) / elapsed;
      const remaining = Math.round((TOTAL_PUZZLES - i - 1) / rate);
      console.log('');
      console.log(`  📊 Progress: ${i + 1}/${TOTAL_PUZZLES} (${Math.round((i + 1) / TOTAL_PUZZLES * 100)}%)`);
      console.log(`     Generated: ${generated}, Skipped: ${skipped}, Failed: ${failed}`);
      console.log(`     Elapsed: ${Math.floor(elapsed / 60)}m ${elapsed % 60}s, ETA: ${Math.floor(remaining / 60)}m ${remaining % 60}s`);
      console.log('');
    }

    // Delay to avoid rate limiting (skip for already-existing puzzles)
    if (i < TOTAL_PUZZLES - 1) {
      await sleep(DELAY_BETWEEN_PUZZLES_MS);
    }
  }

  const totalTime = Math.round((Date.now() - startTime) / 1000);

  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    GENERATION COMPLETE                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  ✓ Generated: ${generated} puzzles`);
  console.log(`  ⊘ Skipped:   ${skipped} (already existed)`);
  console.log(`  ✗ Failed:    ${failed}`);
  console.log(`  ⏱ Time:      ${Math.floor(totalTime / 60)}m ${totalTime % 60}s`);
  console.log('');

  if (failed > 0) {
    console.log('⚠️  Some puzzles failed to generate. Re-run the script to retry.');
  }
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
