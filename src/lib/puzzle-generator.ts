import { generatePuzzleWithAI, PuzzleGenerationResponse } from './openrouter';
import {
  RuleProgramType,
  RuleProgramParams,
  PuzzleData,
  generateMultipleSequences,
  validatePuzzle,
} from './rules';

const SEQUENCE_LENGTH = 5; // Number of visible terms
const NUM_SEQUENCES = 5; // Total sequences (1 shown initially, others revealed on wrong guesses)
const MAX_GENERATION_ATTEMPTS = 20;

/**
 * Fallback puzzles to use when AI generation fails.
 */
export const FALLBACK_PUZZLES: PuzzleData[] = [
  {
    ruleProgramType: RuleProgramType.SECOND_ORDER_CONSTANT,
    ruleProgramParams: { secondDifference: 3, startingValues: [2, 5] },
    tags: ['DIFFERENCES', 'SECOND_ORDER', 'INCREASING'],
    sequences: [
      [2, 5, 11, 20, 32],
      [1, 4, 10, 19, 31],
      [3, 7, 14, 24, 37],
      [0, 3, 9, 18, 30],
      [5, 9, 16, 26, 39],
    ],
    answers: [47, 46, 53, 45, 55],
    primarySequenceIndex: 0,
    hints: [
      'This pattern only uses addition, but the amount added changes each time.',
      'The amount you add increases by the same number each step.',
    ],
    explanation:
      'Each term adds an increasing amount. The differences are 3, 6, 9, 12, 15... (increasing by 3 each time). Next difference is 15, so 32 + 15 = 47.',
  },
  {
    ruleProgramType: RuleProgramType.FIBONACCI_LIKE,
    ruleProgramParams: { prevMultiplier: 1, prev2Multiplier: 2, startingValues: [1, 3] },
    tags: ['RECURSIVE', 'FIBONACCI', 'INCREASING'],
    sequences: [
      [1, 3, 5, 11, 21],
      [2, 4, 8, 16, 32],
      [1, 2, 4, 7, 13],
      [3, 5, 11, 21, 43],
      [2, 3, 7, 13, 27],
    ],
    answers: [43, 64, 24, 85, 53],
    primarySequenceIndex: 0,
    hints: [
      'This uses addition and multiplication. Each number is calculated from the two before it.',
      'Try: current number + (2 × the number before that).',
    ],
    explanation:
      'Each term equals the previous term plus twice the term before that: next = prev + 2×prev2. So 21 + (2×11) = 21 + 22 = 43.',
  },
  {
    ruleProgramType: RuleProgramType.ALTERNATING_OPS,
    ruleProgramParams: {
      operations: [
        { op: 'multiply', value: 2 },
        { op: 'add', value: 3 },
      ],
      startingValues: [1],
    },
    tags: ['ALTERNATING', 'MIXED_SIGNS'],
    sequences: [
      [1, 2, 5, 10, 13],
      [2, 4, 7, 14, 17],
      [3, 6, 9, 18, 21],
      [4, 8, 11, 22, 25],
      [5, 10, 13, 26, 29],
    ],
    answers: [26, 34, 42, 50, 58],
    primarySequenceIndex: 0,
    hints: [
      'This uses both multiplication and addition, alternating between them.',
      'First multiply by 2, then add 3, then multiply by 2, then add 3...',
    ],
    explanation: 'The sequence alternates: ×2, +3, ×2, +3... So 13 × 2 = 26.',
  },
  {
    ruleProgramType: RuleProgramType.POSITIONAL_FORMULA,
    ruleProgramParams: { a: 1, b: 2, c: -1 },
    tags: ['POLYNOMIAL', 'POSITIONAL', 'INCREASING'],
    sequences: [
      [2, 7, 14, 23, 34],
      [5, 10, 17, 26, 37],
      [8, 13, 20, 29, 40],
      [11, 16, 23, 32, 43],
      [14, 19, 26, 35, 46],
    ],
    answers: [47, 50, 53, 56, 59],
    primarySequenceIndex: 0,
    hints: [
      'Each term is calculated using its position (1st, 2nd, 3rd...). Uses multiplication and addition.',
      'The formula involves squaring the position number.',
    ],
    explanation: 'The nth term equals n² + 2n - 1. For position 6: 36 + 12 - 1 = 47.',
  },
  {
    ruleProgramType: RuleProgramType.LINEAR_DIFF,
    ruleProgramParams: { initialDiff: 5, diffIncrement: 4, startingValues: [3] },
    tags: ['DIFFERENCES', 'INCREASING'],
    sequences: [
      [3, 8, 17, 30, 47],
      [1, 6, 15, 28, 45],
      [5, 10, 19, 32, 49],
      [2, 7, 16, 29, 46],
      [7, 12, 21, 34, 51],
    ],
    answers: [68, 66, 70, 67, 72],
    primarySequenceIndex: 0,
    hints: [
      'This only uses addition. Calculate what you add each time to get to the next number.',
      'The differences between terms are: 5, 9, 13, 17... See the pattern?',
    ],
    explanation:
      'The differences are 5, 9, 13, 17, 21 (increasing by 4 each time). Next difference is 21, so 47 + 21 = 68.',
  },
];

/**
 * Generates a complete puzzle using AI and the rule engine.
 */
export async function generatePuzzle(
  dateKey: string,
  attempt: number = 0
): Promise<{ puzzle: PuzzleData; isFallback: boolean }> {
  // If we've exceeded max attempts, use a fallback puzzle
  if (attempt >= MAX_GENERATION_ATTEMPTS) {
    console.log(`Using fallback puzzle after ${attempt} failed attempts`);
    const fallbackIndex = hashDateToIndex(dateKey, FALLBACK_PUZZLES.length);
    return {
      puzzle: FALLBACK_PUZZLES[fallbackIndex],
      isFallback: true,
    };
  }

  try {
    // Get AI-generated parameters
    const aiResponse = await generatePuzzleWithAI();

    // Generate sequences using the rule engine
    const puzzle = buildPuzzleFromAIResponse(aiResponse);

    // Validate the puzzle
    const validation = validatePuzzle(puzzle);

    if (!validation.valid) {
      console.log(
        `Puzzle validation failed (attempt ${attempt + 1}):`,
        validation.errors
      );
      return generatePuzzle(dateKey, attempt + 1);
    }

    if (validation.warnings.length > 0) {
      console.log('Puzzle warnings:', validation.warnings);
    }

    return { puzzle, isFallback: false };
  } catch (error) {
    console.error(`Puzzle generation error (attempt ${attempt + 1}):`, error);
    return generatePuzzle(dateKey, attempt + 1);
  }
}

/**
 * Builds a complete puzzle from AI response using the rule engine.
 */
function buildPuzzleFromAIResponse(response: PuzzleGenerationResponse): PuzzleData {
  const { ruleProgramType, ruleProgramParams, tags, hints, explanation, suggestedStartingValues } =
    response;

  // Use suggested starting values or generate variations
  let startingValueSets: number[][] = suggestedStartingValues || [];

  // Ensure we have enough starting value sets
  if (startingValueSets.length < NUM_SEQUENCES) {
    const baseValues = ruleProgramParams.startingValues || [1];
    while (startingValueSets.length < NUM_SEQUENCES) {
      const variation = baseValues.map((v, i) => v + (startingValueSets.length + 1) * (i + 1) * 2);
      startingValueSets.push(variation);
    }
  }

  // Generate sequences
  const generatedSequences = generateMultipleSequences(
    ruleProgramType as RuleProgramType,
    ruleProgramParams,
    NUM_SEQUENCES,
    SEQUENCE_LENGTH
  );

  // For non-positional rules, we need to use the starting values
  if (needsStartingValues(ruleProgramType as RuleProgramType)) {
    // Regenerate with specific starting values
    const sequences: number[][] = [];
    const answers: number[] = [];

    for (let i = 0; i < NUM_SEQUENCES; i++) {
      const startVals = startingValueSets[i] || startingValueSets[0];
      const paramsWithStart = { ...ruleProgramParams, startingValues: startVals };
      const generated = generateMultipleSequences(
        ruleProgramType as RuleProgramType,
        paramsWithStart,
        1,
        SEQUENCE_LENGTH
      )[0];
      sequences.push(generated.sequence);
      answers.push(generated.nextValue);
    }

    return {
      ruleProgramType: ruleProgramType as RuleProgramType,
      ruleProgramParams,
      tags,
      sequences,
      answers,
      primarySequenceIndex: 0,
      hints,
      explanation,
    };
  }

  return {
    ruleProgramType: ruleProgramType as RuleProgramType,
    ruleProgramParams,
    tags,
    sequences: generatedSequences.map((g) => g.sequence),
    answers: generatedSequences.map((g) => g.nextValue),
    primarySequenceIndex: 0,
    hints,
    explanation,
  };
}

/**
 * Checks if a rule type needs explicit starting values.
 */
function needsStartingValues(ruleType: RuleProgramType): boolean {
  return ![
    RuleProgramType.POSITIONAL_FORMULA,
    RuleProgramType.CUBIC_POSITIONAL,
    RuleProgramType.POWER_BASED,
  ].includes(ruleType);
}

/**
 * Hashes a date string to a consistent index for fallback selection.
 */
function hashDateToIndex(dateKey: string, max: number): number {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    const char = dateKey.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % max;
}

/**
 * Creates a puzzle directly from a rule type and params (for testing/admin).
 */
export function createPuzzleFromRule(
  ruleType: RuleProgramType,
  params: RuleProgramParams,
  hints: [string, string],
  explanation: string,
  tags: string[]
): PuzzleData {
  const sequences = generateMultipleSequences(ruleType, params, NUM_SEQUENCES, SEQUENCE_LENGTH);

  return {
    ruleProgramType: ruleType,
    ruleProgramParams: params,
    tags,
    sequences: sequences.map((s) => s.sequence),
    answers: sequences.map((s) => s.nextValue),
    primarySequenceIndex: 0,
    hints,
    explanation,
  };
}
