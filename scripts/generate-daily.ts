/**
 * Script to manually generate the daily puzzle.
 * Run with: npm run generate-puzzle
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { generatePuzzle } from '../src/lib/puzzle-generator';
import { getTodayDateKey, getPuzzleNumber } from '../src/lib/date-utils';

async function main() {
  const prisma = new PrismaClient();

  try {
    const dateKey = process.argv[2] || getTodayDateKey();

    console.log(`Generating puzzle for ${dateKey}...`);

    // Check if puzzle already exists
    const existing = await prisma.puzzle.findUnique({
      where: { dateKey },
    });

    if (existing) {
      console.log(`Puzzle for ${dateKey} already exists (ID: ${existing.id})`);
      console.log('Use --force flag to regenerate (not implemented in this script)');
      return;
    }

    // Generate the puzzle
    const { puzzle, isFallback } = await generatePuzzle(dateKey);

    const puzzleNumber = getPuzzleNumber(dateKey);

    // Store in database
    const created = await prisma.puzzle.create({
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

    console.log('Puzzle generated successfully!');
    console.log(`  ID: ${created.id}`);
    console.log(`  Date: ${created.dateKey}`);
    console.log(`  Number: ${created.puzzleNumber}`);
    console.log(`  Rule: ${puzzle.ruleProgramType}`);
    console.log(`  Primary sequence: ${puzzle.sequences[0].join(', ')}`);
    console.log(`  Answer: ${puzzle.answers[0]}`);
    console.log(`  Fallback: ${isFallback}`);
  } catch (error) {
    console.error('Error generating puzzle:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
