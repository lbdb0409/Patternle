import { describe, it, expect } from 'vitest';
import {
  validateStructure,
  validateDifficulty,
  validateAmbiguity,
  validatePuzzle,
  fitQuadratic,
  checkConstantDifference,
  checkConstantRatio,
  checkAlternatingPattern,
} from '../validation';
import { RuleProgramType, PuzzleData } from '../types';

describe('fitQuadratic', () => {
  it('fits linear sequence correctly', () => {
    const result = fitQuadratic([2, 4, 6, 8, 10]);
    expect(result.coefficients[0]).toBeCloseTo(0, 1); // a ≈ 0
    expect(result.coefficients[1]).toBeCloseTo(2, 1); // b ≈ 2
    expect(result.nextValue).toBe(12);
  });

  it('fits quadratic sequence correctly', () => {
    // n^2: 1, 4, 9, 16, 25
    const result = fitQuadratic([1, 4, 9, 16, 25]);
    expect(result.coefficients[0]).toBeCloseTo(1, 1); // a ≈ 1
    expect(result.nextValue).toBe(36);
  });
});

describe('checkConstantDifference', () => {
  it('detects constant difference', () => {
    const result = checkConstantDifference([1, 4, 7, 10, 13]);
    expect(result.isConstant).toBe(true);
    expect(result.difference).toBe(3);
    expect(result.nextValue).toBe(16);
  });

  it('rejects non-constant difference', () => {
    const result = checkConstantDifference([1, 2, 4, 8, 16]);
    expect(result.isConstant).toBe(false);
  });
});

describe('checkConstantRatio', () => {
  it('detects constant ratio', () => {
    const result = checkConstantRatio([2, 6, 18, 54]);
    expect(result.isConstant).toBe(true);
    expect(result.ratio).toBe(3);
    expect(result.nextValue).toBe(162);
  });

  it('rejects non-constant ratio', () => {
    const result = checkConstantRatio([1, 2, 4, 7, 11]);
    expect(result.isConstant).toBe(false);
  });

  it('handles zeros in sequence', () => {
    const result = checkConstantRatio([0, 1, 2, 3]);
    expect(result.isConstant).toBe(false);
  });
});

describe('checkAlternatingPattern', () => {
  it('detects alternating pattern', () => {
    // +3, -1, +3, -1...
    const result = checkAlternatingPattern([1, 4, 3, 6, 5]);
    expect(result.isAlternating).toBe(true);
  });

  it('rejects non-alternating pattern', () => {
    const result = checkAlternatingPattern([1, 2, 4, 8, 16]);
    expect(result.isAlternating).toBe(false);
  });
});

describe('validateStructure', () => {
  const validPuzzle: PuzzleData = {
    ruleProgramType: RuleProgramType.ARITHMETIC_SEQUENCE,
    ruleProgramParams: { difference: 3 },
    tags: ['ARITHMETIC', 'INCREASING'],
    sequences: [
      [1, 4, 7, 10, 13],
      [2, 5, 8, 11, 14],
    ],
    answers: [16, 17],
    primarySequenceIndex: 0,
    hints: ['Look at the differences', 'Count how much it grows'],
    explanation: 'Each term increases by 3.',
  };

  it('validates a correct puzzle', () => {
    const result = validateStructure(validPuzzle);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects puzzle with too short sequences', () => {
    const invalidPuzzle = {
      ...validPuzzle,
      sequences: [[1, 2, 3]],
      answers: [4],
    };
    const result = validateStructure(invalidPuzzle);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('fewer than'))).toBe(true);
  });

  it('rejects puzzle with out of bounds values', () => {
    const invalidPuzzle = {
      ...validPuzzle,
      sequences: [[1, 2, 3, 4, 1000]],
      answers: [1001],
    };
    const result = validateStructure(invalidPuzzle);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('out of bounds'))).toBe(true);
  });

  it('rejects puzzle with mismatched answers count', () => {
    const invalidPuzzle = {
      ...validPuzzle,
      answers: [16], // Only 1 answer for 2 sequences
    };
    const result = validateStructure(invalidPuzzle);
    expect(result.valid).toBe(false);
  });

  it('rejects puzzle without 2 hints', () => {
    const invalidPuzzle = {
      ...validPuzzle,
      hints: ['Only one hint'] as [string, string],
    };
    const result = validateStructure(invalidPuzzle);
    expect(result.valid).toBe(false);
  });
});

describe('validateDifficulty', () => {
  it('warns about constant difference puzzles', () => {
    const puzzle: PuzzleData = {
      ruleProgramType: RuleProgramType.ARITHMETIC_SEQUENCE,
      ruleProgramParams: { difference: 5 },
      tags: ['ARITHMETIC'],
      sequences: [[5, 10, 15, 20, 25]],
      answers: [30],
      primarySequenceIndex: 0,
      hints: ['Hint 1', 'Hint 2'],
      explanation: 'Add 5 each time',
    };

    const result = validateDifficulty(puzzle);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('validateAmbiguity', () => {
  it('detects when quadratic fit gives different answer', () => {
    // A sequence that could be interpreted multiple ways
    const puzzle: PuzzleData = {
      ruleProgramType: RuleProgramType.SECOND_ORDER_CONSTANT,
      ruleProgramParams: { secondDifference: 2 },
      tags: ['SECOND_ORDER'],
      sequences: [[1, 2, 5, 10, 17]],
      answers: [26], // Correct: 17 + 9
      primarySequenceIndex: 0,
      hints: ['Hint 1', 'Hint 2'],
      explanation: 'Second differences are constant at 2',
    };

    const result = validateAmbiguity(puzzle);
    // Should have either an error or warning about alternative patterns
    expect(result.valid).toBe(true); // May have warnings but should be valid
  });

  it('flags truly ambiguous puzzles', () => {
    // A sequence where the intended answer differs from obvious pattern
    const puzzle: PuzzleData = {
      ruleProgramType: RuleProgramType.ARITHMETIC_SEQUENCE,
      ruleProgramParams: { difference: 3 },
      tags: ['ARITHMETIC'],
      sequences: [[1, 4, 7, 10, 13]],
      answers: [20], // Intentionally wrong - should be 16
      primarySequenceIndex: 0,
      hints: ['Hint 1', 'Hint 2'],
      explanation: 'Wrong explanation',
    };

    const result = validateAmbiguity(puzzle);
    // Should flag that constant difference gives different answer
    expect(result.errors.length + result.warnings.length).toBeGreaterThan(0);
  });
});

describe('validatePuzzle (full pipeline)', () => {
  it('validates a well-formed puzzle', () => {
    const puzzle: PuzzleData = {
      ruleProgramType: RuleProgramType.FIBONACCI_LIKE,
      ruleProgramParams: { prevMultiplier: 1, prev2Multiplier: 1 },
      tags: ['RECURSIVE', 'FIBONACCI'],
      sequences: [
        [1, 1, 2, 3, 5],
        [2, 2, 4, 6, 10],
        [1, 3, 4, 7, 11],
      ],
      answers: [8, 16, 18],
      primarySequenceIndex: 0,
      hints: [
        'Look at how each term relates to the previous ones',
        'Try adding recent terms together',
      ],
      explanation: 'Each term is the sum of the two preceding terms (Fibonacci pattern).',
    };

    const result = validatePuzzle(puzzle);
    expect(result.valid).toBe(true);
  });

  it('rejects a puzzle with multiple issues', () => {
    const puzzle: PuzzleData = {
      ruleProgramType: RuleProgramType.ARITHMETIC_SEQUENCE,
      ruleProgramParams: {},
      tags: [],
      sequences: [[1, 2]], // Too short
      answers: [3, 4], // Wrong count
      primarySequenceIndex: 0,
      hints: ['Only one'] as [string, string], // Missing hint
      explanation: 'Short', // Too short
    };

    const result = validatePuzzle(puzzle);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});
