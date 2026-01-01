import { PrismaClient } from '@prisma/client';
import { FALLBACK_PUZZLES } from '../src/lib/puzzle-generator';
import { format, subDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create some initial puzzles for testing
  const today = new Date();

  for (let i = 0; i < 5; i++) {
    const date = subDays(today, i);
    const dateKey = format(date, 'yyyy-MM-dd');

    // Check if puzzle already exists
    const existing = await prisma.puzzle.findUnique({
      where: { dateKey },
    });

    if (existing) {
      console.log(`Puzzle for ${dateKey} already exists, skipping...`);
      continue;
    }

    // Use fallback puzzles for seeding
    const puzzle = FALLBACK_PUZZLES[i % FALLBACK_PUZZLES.length];

    await prisma.puzzle.create({
      data: {
        dateKey,
        puzzleNumber: i + 1,
        difficulty: 'hard',
        ruleProgramType: puzzle.ruleProgramType,
        ruleProgramParams: JSON.stringify(puzzle.ruleProgramParams),
        tags: JSON.stringify(puzzle.tags),
        primarySequence: JSON.stringify(puzzle.sequences[0]),
        sequences: JSON.stringify(puzzle.sequences),
        answers: JSON.stringify(puzzle.answers),
        hints: JSON.stringify(puzzle.hints),
        explanation: puzzle.explanation,
        isFallback: true,
      },
    });

    console.log(`Created puzzle for ${dateKey}`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
