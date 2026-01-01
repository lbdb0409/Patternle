import { describe, it, expect } from 'vitest';
import {
  evaluateNextValue,
  generateSequence,
  generateMultipleSequences,
  digitSum,
} from '../evaluators';
import { RuleProgramType } from '../types';

describe('digitSum', () => {
  it('calculates digit sum correctly', () => {
    expect(digitSum(123)).toBe(6);
    expect(digitSum(999)).toBe(27);
    expect(digitSum(0)).toBe(0);
    expect(digitSum(-123)).toBe(6); // absolute value
  });
});

describe('evaluateNextValue', () => {
  describe('ARITHMETIC_SEQUENCE', () => {
    it('adds constant difference', () => {
      const result = evaluateNextValue(
        [1, 4, 7, 10],
        RuleProgramType.ARITHMETIC_SEQUENCE,
        { difference: 3 },
        5
      );
      expect(result).toBe(13);
    });

    it('handles negative difference', () => {
      const result = evaluateNextValue(
        [10, 7, 4, 1],
        RuleProgramType.ARITHMETIC_SEQUENCE,
        { difference: -3 },
        5
      );
      expect(result).toBe(-2);
    });
  });

  describe('GEOMETRIC_SEQUENCE', () => {
    it('multiplies by constant ratio', () => {
      const result = evaluateNextValue(
        [2, 6, 18, 54],
        RuleProgramType.GEOMETRIC_SEQUENCE,
        { ratio: 3 },
        5
      );
      expect(result).toBe(162);
    });
  });

  describe('LINEAR_DIFF', () => {
    it('increases differences linearly', () => {
      // Differences: 2, 3, 4, 5... (initialDiff=2, increment=1)
      const result = evaluateNextValue(
        [1, 3, 6, 10],
        RuleProgramType.LINEAR_DIFF,
        { initialDiff: 2, diffIncrement: 1 },
        5
      );
      expect(result).toBe(15); // 10 + 5
    });
  });

  describe('SECOND_ORDER_CONSTANT', () => {
    it('maintains constant second differences', () => {
      // Sequence: 1, 2, 5, 10, 17 (differences: 1, 3, 5, 7 - second diff: 2)
      const result = evaluateNextValue(
        [1, 2, 5, 10, 17],
        RuleProgramType.SECOND_ORDER_CONSTANT,
        { secondDifference: 2 },
        6
      );
      expect(result).toBe(26); // 17 + 9
    });
  });

  describe('FIBONACCI_LIKE', () => {
    it('computes Fibonacci-like sequence', () => {
      // Standard Fibonacci: next = prev + prev2
      const result = evaluateNextValue(
        [1, 1, 2, 3, 5],
        RuleProgramType.FIBONACCI_LIKE,
        { prevMultiplier: 1, prev2Multiplier: 1 },
        6
      );
      expect(result).toBe(8);
    });

    it('computes custom weighted sum', () => {
      // next = 2*prev + 1*prev2
      const result = evaluateNextValue(
        [1, 2, 5, 12],
        RuleProgramType.FIBONACCI_LIKE,
        { prevMultiplier: 2, prev2Multiplier: 1 },
        5
      );
      expect(result).toBe(29); // 2*12 + 5
    });
  });

  describe('POSITIONAL_FORMULA', () => {
    it('computes quadratic formula', () => {
      // n^2 + n + 1 for n=1,2,3,4,5 gives 3, 7, 13, 21, 31
      const result = evaluateNextValue(
        [],
        RuleProgramType.POSITIONAL_FORMULA,
        { a: 1, b: 1, c: 1 },
        5
      );
      expect(result).toBe(31); // 25 + 5 + 1
    });
  });

  describe('ALTERNATING_OPS', () => {
    it('alternates between operations', () => {
      // Start: 2, then +3, *2, +3, *2...
      const result = evaluateNextValue(
        [2, 5, 10, 13],
        RuleProgramType.ALTERNATING_OPS,
        {
          operations: [
            { op: 'add', value: 3 },
            { op: 'multiply', value: 2 },
          ],
        },
        5
      );
      expect(result).toBe(26); // 13 * 2
    });
  });

  describe('RECURSIVE_LINEAR', () => {
    it('applies linear recurrence', () => {
      // next = 2*prev + 1
      const result = evaluateNextValue(
        [1, 3, 7, 15],
        RuleProgramType.RECURSIVE_LINEAR,
        { multiplier: 2, addend: 1 },
        5
      );
      expect(result).toBe(31); // 2*15 + 1
    });
  });

  describe('POWER_BASED', () => {
    it('generates squares plus constant', () => {
      // n^2 + 3 for n=1,2,3,4,5 gives 4, 7, 12, 19, 28
      const result = evaluateNextValue(
        [],
        RuleProgramType.POWER_BASED,
        { base: 3, powerType: 'n_squared_plus' },
        5
      );
      expect(result).toBe(28); // 25 + 3
    });

    it('generates powers of base', () => {
      // 2^n for n=1,2,3,4,5 gives 2, 4, 8, 16, 32
      const result = evaluateNextValue(
        [],
        RuleProgramType.POWER_BASED,
        { base: 2, powerType: 'k_to_n' },
        5
      );
      expect(result).toBe(32); // 2^5
    });
  });
});

describe('generateSequence', () => {
  it('generates arithmetic sequence', () => {
    const { sequence, nextValue } = generateSequence(
      RuleProgramType.ARITHMETIC_SEQUENCE,
      { difference: 5, startingValues: [3] },
      4
    );
    expect(sequence).toEqual([3, 8, 13, 18]);
    expect(nextValue).toBe(23);
  });

  it('generates positional formula sequence', () => {
    const { sequence, nextValue } = generateSequence(
      RuleProgramType.POSITIONAL_FORMULA,
      { a: 1, b: 0, c: 0 }, // n^2
      4
    );
    expect(sequence).toEqual([1, 4, 9, 16]);
    expect(nextValue).toBe(25);
  });

  it('generates Fibonacci-like sequence', () => {
    const { sequence, nextValue } = generateSequence(
      RuleProgramType.FIBONACCI_LIKE,
      { prevMultiplier: 1, prev2Multiplier: 1, startingValues: [1, 1] },
      5
    );
    expect(sequence).toEqual([1, 1, 2, 3, 5]);
    expect(nextValue).toBe(8);
  });
});

describe('generateMultipleSequences', () => {
  it('generates multiple sequences with same rule', () => {
    const sequences = generateMultipleSequences(
      RuleProgramType.ARITHMETIC_SEQUENCE,
      { difference: 3, startingValues: [1] },
      3,
      4
    );

    expect(sequences).toHaveLength(3);

    // All should have the same difference pattern
    for (const { sequence, nextValue } of sequences) {
      expect(sequence).toHaveLength(4);
      // Check constant difference
      for (let i = 1; i < sequence.length; i++) {
        expect(sequence[i] - sequence[i - 1]).toBe(3);
      }
      expect(nextValue - sequence[sequence.length - 1]).toBe(3);
    }

    // But different starting values
    expect(sequences[0].sequence[0]).not.toBe(sequences[1].sequence[0]);
  });

  it('generates positional formula variations', () => {
    const sequences = generateMultipleSequences(
      RuleProgramType.POSITIONAL_FORMULA,
      { a: 1, b: 0, c: 0 }, // n^2
      3,
      4
    );

    expect(sequences).toHaveLength(3);

    // First should be n^2: 1, 4, 9, 16
    expect(sequences[0].sequence).toEqual([1, 4, 9, 16]);

    // Others should have different constants added
    // They should differ by 3 each time based on the implementation
  });
});
