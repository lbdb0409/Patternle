import { RuleProgramType, RuleProgramParams, PuzzleData } from './types';

const MIN_VALUE = -999;
const MAX_VALUE = 999;
const MIN_SEQUENCE_LENGTH = 4;

/**
 * Validation result structure.
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Structural validation: checks bounds, lengths, and integer constraints.
 */
export function validateStructure(puzzle: PuzzleData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check sequences exist and have minimum length
  if (!puzzle.sequences || puzzle.sequences.length === 0) {
    errors.push('No sequences provided');
  } else {
    for (let i = 0; i < puzzle.sequences.length; i++) {
      const seq = puzzle.sequences[i];
      if (seq.length < MIN_SEQUENCE_LENGTH) {
        errors.push(`Sequence ${i + 1} has fewer than ${MIN_SEQUENCE_LENGTH} terms`);
      }

      // Check all values are integers within bounds
      for (let j = 0; j < seq.length; j++) {
        const val = seq[j];
        if (!Number.isInteger(val)) {
          errors.push(`Sequence ${i + 1}, term ${j + 1} is not an integer: ${val}`);
        }
        if (val < MIN_VALUE || val > MAX_VALUE) {
          errors.push(`Sequence ${i + 1}, term ${j + 1} is out of bounds: ${val}`);
        }
      }
    }
  }

  // Check answers exist and are valid
  if (!puzzle.answers || puzzle.answers.length !== puzzle.sequences?.length) {
    errors.push('Answers count does not match sequences count');
  } else {
    for (let i = 0; i < puzzle.answers.length; i++) {
      const ans = puzzle.answers[i];
      if (!Number.isInteger(ans)) {
        errors.push(`Answer ${i + 1} is not an integer: ${ans}`);
      }
      if (ans < MIN_VALUE || ans > MAX_VALUE) {
        errors.push(`Answer ${i + 1} is out of bounds: ${ans}`);
      }
    }
  }

  // Check hints
  if (!puzzle.hints || puzzle.hints.length !== 2) {
    errors.push('Exactly 2 hints are required');
  }

  // Check explanation
  if (!puzzle.explanation || puzzle.explanation.length < 10) {
    errors.push('Explanation is too short or missing');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Fits a quadratic polynomial (ax^2 + bx + c) to a sequence using least squares.
 * Returns coefficients [a, b, c] and the predicted next value.
 */
export function fitQuadratic(sequence: number[]): {
  coefficients: [number, number, number];
  nextValue: number;
  error: number;
} {
  const n = sequence.length;

  // Build matrices for least squares: X^T * X * beta = X^T * y
  // X = [1, i, i^2] for i = 1 to n
  let sumX0 = 0, sumX1 = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0;
  let sumY = 0, sumX1Y = 0, sumX2Y = 0;

  for (let i = 0; i < n; i++) {
    const x = i + 1; // 1-indexed position
    const y = sequence[i];
    const x2 = x * x;
    const x3 = x2 * x;
    const x4 = x3 * x;

    sumX0 += 1;
    sumX1 += x;
    sumX2 += x2;
    sumX3 += x3;
    sumX4 += x4;
    sumY += y;
    sumX1Y += x * y;
    sumX2Y += x2 * y;
  }

  // Solve 3x3 system using Cramer's rule
  // [sumX0  sumX1  sumX2] [c]   [sumY]
  // [sumX1  sumX2  sumX3] [b] = [sumX1Y]
  // [sumX2  sumX3  sumX4] [a]   [sumX2Y]

  const det =
    sumX0 * (sumX2 * sumX4 - sumX3 * sumX3) -
    sumX1 * (sumX1 * sumX4 - sumX3 * sumX2) +
    sumX2 * (sumX1 * sumX3 - sumX2 * sumX2);

  if (Math.abs(det) < 1e-10) {
    // Singular matrix, fall back to linear fit
    const linearSlope = (sequence[n - 1] - sequence[0]) / (n - 1);
    const linearIntercept = sequence[0] - linearSlope;
    return {
      coefficients: [0, linearSlope, linearIntercept],
      nextValue: Math.round(sequence[0] + linearSlope * n),
      error: Infinity,
    };
  }

  const detC =
    sumY * (sumX2 * sumX4 - sumX3 * sumX3) -
    sumX1 * (sumX1Y * sumX4 - sumX3 * sumX2Y) +
    sumX2 * (sumX1Y * sumX3 - sumX2 * sumX2Y);

  const detB =
    sumX0 * (sumX1Y * sumX4 - sumX3 * sumX2Y) -
    sumY * (sumX1 * sumX4 - sumX3 * sumX2) +
    sumX2 * (sumX1 * sumX2Y - sumX1Y * sumX2);

  const detA =
    sumX0 * (sumX2 * sumX2Y - sumX1Y * sumX3) -
    sumX1 * (sumX1 * sumX2Y - sumX1Y * sumX2) +
    sumY * (sumX1 * sumX3 - sumX2 * sumX2);

  const c = detC / det;
  const b = detB / det;
  const a = detA / det;

  // Calculate fit error
  let error = 0;
  for (let i = 0; i < n; i++) {
    const x = i + 1;
    const predicted = a * x * x + b * x + c;
    error += Math.abs(sequence[i] - predicted);
  }

  // Predict next value
  const nextX = n + 1;
  const nextValue = Math.round(a * nextX * nextX + b * nextX + c);

  return {
    coefficients: [a, b, c],
    nextValue,
    error: error / n,
  };
}

/**
 * Checks for constant difference pattern.
 */
export function checkConstantDifference(sequence: number[]): {
  isConstant: boolean;
  difference: number | null;
  nextValue: number | null;
} {
  if (sequence.length < 2) {
    return { isConstant: false, difference: null, nextValue: null };
  }

  const differences: number[] = [];
  for (let i = 1; i < sequence.length; i++) {
    differences.push(sequence[i] - sequence[i - 1]);
  }

  const allSame = differences.every((d) => d === differences[0]);
  if (allSame) {
    return {
      isConstant: true,
      difference: differences[0],
      nextValue: sequence[sequence.length - 1] + differences[0],
    };
  }

  return { isConstant: false, difference: null, nextValue: null };
}

/**
 * Checks for constant ratio pattern (geometric sequence).
 */
export function checkConstantRatio(sequence: number[]): {
  isConstant: boolean;
  ratio: number | null;
  nextValue: number | null;
} {
  if (sequence.length < 2 || sequence.some((v) => v === 0)) {
    return { isConstant: false, ratio: null, nextValue: null };
  }

  const ratios: number[] = [];
  for (let i = 1; i < sequence.length; i++) {
    ratios.push(sequence[i] / sequence[i - 1]);
  }

  // Check if all ratios are equal (with some tolerance for floating point)
  const allSame = ratios.every((r) => Math.abs(r - ratios[0]) < 0.0001);
  if (allSame && Number.isInteger(Math.round(ratios[0]))) {
    const ratio = Math.round(ratios[0]);
    return {
      isConstant: true,
      ratio,
      nextValue: sequence[sequence.length - 1] * ratio,
    };
  }

  return { isConstant: false, ratio: null, nextValue: null };
}

/**
 * Checks for alternating +a, -b pattern.
 */
export function checkAlternatingPattern(sequence: number[]): {
  isAlternating: boolean;
  pattern: { addValue: number; subtractValue: number } | null;
  nextValue: number | null;
} {
  if (sequence.length < 4) {
    return { isAlternating: false, pattern: null, nextValue: null };
  }

  const differences: number[] = [];
  for (let i = 1; i < sequence.length; i++) {
    differences.push(sequence[i] - sequence[i - 1]);
  }

  // Check if odd-indexed differences are one value and even-indexed are another
  const evenDiffs = differences.filter((_, i) => i % 2 === 0);
  const oddDiffs = differences.filter((_, i) => i % 2 === 1);

  const evenAllSame = evenDiffs.every((d) => d === evenDiffs[0]);
  const oddAllSame = oddDiffs.every((d) => d === oddDiffs[0]);

  if (evenAllSame && oddAllSame && evenDiffs[0] !== oddDiffs[0]) {
    const nextDiffIndex = differences.length;
    const nextDiff = nextDiffIndex % 2 === 0 ? evenDiffs[0] : oddDiffs[0];
    return {
      isAlternating: true,
      pattern: {
        addValue: Math.max(evenDiffs[0], oddDiffs[0]),
        subtractValue: Math.min(evenDiffs[0], oddDiffs[0]),
      },
      nextValue: sequence[sequence.length - 1] + nextDiff,
    };
  }

  return { isAlternating: false, pattern: null, nextValue: null };
}

/**
 * Difficulty validation: ensures puzzles are not trivially easy.
 */
export function validateDifficulty(puzzle: PuzzleData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const primarySeq = puzzle.sequences[puzzle.primarySequenceIndex];
  const primaryAnswer = puzzle.answers[puzzle.primarySequenceIndex];

  // Check for trivially constant difference
  const constDiff = checkConstantDifference(primarySeq);
  if (constDiff.isConstant) {
    // This is ok if the answer matches - it's the simplest case
    if (constDiff.nextValue === primaryAnswer) {
      warnings.push('Primary sequence has constant difference - may be too easy');
    }
  }

  // Check for constant ratio
  const constRatio = checkConstantRatio(primarySeq);
  if (constRatio.isConstant && constRatio.nextValue === primaryAnswer) {
    warnings.push('Primary sequence has constant ratio - may be too easy');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Ambiguity validation: checks if the puzzle has a unique dominant answer.
 */
export function validateAmbiguity(puzzle: PuzzleData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const primarySeq = puzzle.sequences[puzzle.primarySequenceIndex];
  const intendedAnswer = puzzle.answers[puzzle.primarySequenceIndex];

  // Get alternative predictions from simple patterns
  const alternatives: { method: string; value: number }[] = [];

  // Quadratic fit
  const quadFit = fitQuadratic(primarySeq);
  if (quadFit.error < 0.5 && quadFit.nextValue !== intendedAnswer) {
    alternatives.push({ method: 'quadratic', value: quadFit.nextValue });
  }

  // Constant difference
  const constDiff = checkConstantDifference(primarySeq);
  if (constDiff.isConstant && constDiff.nextValue !== intendedAnswer) {
    alternatives.push({ method: 'constant_diff', value: constDiff.nextValue! });
  }

  // Constant ratio
  const constRatio = checkConstantRatio(primarySeq);
  if (constRatio.isConstant && constRatio.nextValue !== intendedAnswer) {
    alternatives.push({ method: 'constant_ratio', value: constRatio.nextValue! });
  }

  // Alternating pattern
  const altPattern = checkAlternatingPattern(primarySeq);
  if (altPattern.isAlternating && altPattern.nextValue !== intendedAnswer) {
    alternatives.push({ method: 'alternating', value: altPattern.nextValue! });
  }

  // If we have alternatives, check if other sequences disambiguate
  if (alternatives.length > 0) {
    // For each alternative, check if it fits all sequences
    for (const alt of alternatives) {
      let fitsAllSequences = true;

      for (let i = 0; i < puzzle.sequences.length; i++) {
        const seq = puzzle.sequences[i];
        const actualAnswer = puzzle.answers[i];

        // Check if this alternative pattern would predict a different answer
        if (alt.method === 'quadratic') {
          const fit = fitQuadratic(seq);
          if (Math.abs(fit.nextValue - actualAnswer) > 0.5) {
            fitsAllSequences = false;
            break;
          }
        } else if (alt.method === 'constant_diff') {
          const check = checkConstantDifference(seq);
          if (!check.isConstant || check.nextValue !== actualAnswer) {
            fitsAllSequences = false;
            break;
          }
        } else if (alt.method === 'constant_ratio') {
          const check = checkConstantRatio(seq);
          if (!check.isConstant || check.nextValue !== actualAnswer) {
            fitsAllSequences = false;
            break;
          }
        } else if (alt.method === 'alternating') {
          const check = checkAlternatingPattern(seq);
          if (!check.isAlternating || check.nextValue !== actualAnswer) {
            fitsAllSequences = false;
            break;
          }
        }
      }

      if (fitsAllSequences) {
        errors.push(
          `Ambiguous: ${alt.method} pattern predicts ${alt.value} instead of ${intendedAnswer} ` +
            `and fits all sequences`
        );
      } else {
        warnings.push(
          `Alternative ${alt.method} pattern predicts ${alt.value} but is disambiguated by other sequences`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Full validation pipeline for a puzzle.
 */
export function validatePuzzle(puzzle: PuzzleData): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Run all validation checks
  const structureResult = validateStructure(puzzle);
  allErrors.push(...structureResult.errors);
  allWarnings.push(...structureResult.warnings);

  // Only run further checks if structure is valid
  if (structureResult.valid) {
    const difficultyResult = validateDifficulty(puzzle);
    allErrors.push(...difficultyResult.errors);
    allWarnings.push(...difficultyResult.warnings);

    const ambiguityResult = validateAmbiguity(puzzle);
    allErrors.push(...ambiguityResult.errors);
    allWarnings.push(...ambiguityResult.warnings);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}
