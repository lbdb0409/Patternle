import { RuleProgramType, RuleProgramParams, GeneratedSequence } from './types';

/**
 * Computes the digit sum of a number.
 */
export function digitSum(n: number): number {
  return Math.abs(n)
    .toString()
    .split('')
    .reduce((sum, digit) => sum + parseInt(digit, 10), 0);
}

/**
 * Generates the next value in a sequence based on the rule program.
 * @param sequence - The current sequence (at least the necessary terms for the rule)
 * @param ruleType - The type of rule to apply
 * @param params - Parameters for the rule
 * @param position - The position (1-indexed) of the next value to generate
 * @returns The next value in the sequence
 */
export function evaluateNextValue(
  sequence: number[],
  ruleType: RuleProgramType,
  params: RuleProgramParams,
  position: number
): number {
  const prev = sequence[sequence.length - 1];
  const prev2 = sequence.length >= 2 ? sequence[sequence.length - 2] : 0;
  const prev3 = sequence.length >= 3 ? sequence[sequence.length - 3] : 0;

  switch (ruleType) {
    case RuleProgramType.ARITHMETIC_SEQUENCE: {
      const diff = params.difference ?? 0;
      return prev + diff;
    }

    case RuleProgramType.GEOMETRIC_SEQUENCE: {
      const ratio = params.ratio ?? 1;
      return prev * ratio;
    }

    case RuleProgramType.LINEAR_DIFF: {
      // Differences increase linearly
      // If sequence is [a, a+d1, a+d1+d2, ...] where d_n = initialDiff + (n-1)*diffIncrement
      const initialDiff = params.initialDiff ?? 1;
      const diffIncrement = params.diffIncrement ?? 1;
      const n = sequence.length; // number of terms so far
      const nextDiff = initialDiff + (n - 1) * diffIncrement;
      return prev + nextDiff;
    }

    case RuleProgramType.SECOND_ORDER_CONSTANT: {
      // Second differences are constant
      // diff[i] = seq[i+1] - seq[i]
      // diff2 = diff[i+1] - diff[i] = constant
      const secondDiff = params.secondDifference ?? 2;
      if (sequence.length < 2) {
        return prev + secondDiff;
      }
      const lastDiff = prev - prev2;
      const nextDiff = lastDiff + secondDiff;
      return prev + nextDiff;
    }

    case RuleProgramType.ALTERNATING_OPS: {
      const operations = params.operations ?? [
        { op: 'add' as const, value: 2 },
        { op: 'subtract' as const, value: 1 },
      ];
      const opIndex = (sequence.length - 1) % operations.length;
      const operation = operations[opIndex];
      switch (operation.op) {
        case 'add':
          return prev + operation.value;
        case 'subtract':
          return prev - operation.value;
        case 'multiply':
          return prev * operation.value;
        default:
          return prev;
      }
    }

    case RuleProgramType.ALTERNATING_PARITY: {
      // Different rules for odd/even positions (1-indexed)
      const isOddPosition = position % 2 === 1;
      if (isOddPosition) {
        const mult = params.oddMultiplier ?? 1;
        const add = params.oddAddend ?? 1;
        return prev * mult + add;
      } else {
        const mult = params.evenMultiplier ?? 1;
        const add = params.evenAddend ?? 2;
        return prev * mult + add;
      }
    }

    case RuleProgramType.POSITIONAL_FORMULA: {
      // nth term = a*n^2 + b*n + c
      const a = params.a ?? 0;
      const b = params.b ?? 1;
      const c = params.c ?? 0;
      return a * position * position + b * position + c;
    }

    case RuleProgramType.CUBIC_POSITIONAL: {
      // nth term = a*n^3 + b*n^2 + c*n + d
      const a = params.cubicA ?? 0;
      const b = params.cubicB ?? 0;
      const c = params.cubicC ?? 1;
      const d = params.cubicD ?? 0;
      return a * position ** 3 + b * position ** 2 + c * position + d;
    }

    case RuleProgramType.RECURSIVE_LINEAR: {
      // next = multiplier * prev + addend
      const multiplier = params.multiplier ?? 2;
      const addend = params.addend ?? 0;
      return multiplier * prev + addend;
    }

    case RuleProgramType.FIBONACCI_LIKE: {
      // next = prevMultiplier * prev + prev2Multiplier * prev2
      const prevMult = params.prevMultiplier ?? 1;
      const prev2Mult = params.prev2Multiplier ?? 1;
      return prevMult * prev + prev2Mult * prev2;
    }

    case RuleProgramType.TRIBONACCI_LIKE: {
      // next = prev + prev2 + prev3
      return prev + prev2 + prev3;
    }

    case RuleProgramType.DIGIT_SUM_BASED: {
      // next = prev + (digitSum(prev) * multiplier + addend)
      const mult = params.digitSumMultiplier ?? 1;
      const add = params.digitSumAddend ?? 0;
      return prev + (digitSum(prev) * mult + add);
    }

    case RuleProgramType.MULTIPLY_THEN_ADD: {
      // next = prev * multiplyFactor + addFactor
      const multFactor = params.multiplyFactor ?? 2;
      const addFactor = params.addFactor ?? 1;
      return prev * multFactor + addFactor;
    }

    case RuleProgramType.POWER_BASED: {
      const base = params.base ?? 2;
      const exp = params.exponent ?? 2;
      const powerType = params.powerType ?? 'n_squared_plus';

      switch (powerType) {
        case 'n_to_k':
          // sequence is n^k for n = 1, 2, 3, ...
          return position ** exp;
        case 'k_to_n':
          // sequence is base^n
          return base ** position;
        case 'n_squared_plus':
          // sequence is n^2 + base
          return position ** 2 + base;
        default:
          return position ** 2;
      }
    }

    default:
      throw new Error(`Unknown rule type: ${ruleType}`);
  }
}

/**
 * Generates a complete sequence using a rule program.
 * @param ruleType - The rule type to use
 * @param params - Parameters for the rule
 * @param length - Number of terms to generate (excluding the answer)
 * @param startingValues - Initial values to start the sequence (for recursive rules)
 * @returns The generated sequence and its next value
 */
export function generateSequence(
  ruleType: RuleProgramType,
  params: RuleProgramParams,
  length: number,
  startingValues?: number[]
): GeneratedSequence {
  const sequence: number[] = [];

  // Handle positional formulas - they generate values based on position
  if (
    ruleType === RuleProgramType.POSITIONAL_FORMULA ||
    ruleType === RuleProgramType.CUBIC_POSITIONAL ||
    ruleType === RuleProgramType.POWER_BASED
  ) {
    for (let i = 1; i <= length; i++) {
      sequence.push(evaluateNextValue(sequence, ruleType, params, i));
    }
    const nextValue = evaluateNextValue(sequence, ruleType, params, length + 1);
    return { sequence, nextValue };
  }

  // For other rules, we need starting values
  const startVals = startingValues ?? params.startingValues ?? [1];

  // Initialize with starting values
  for (let i = 0; i < Math.min(startVals.length, length); i++) {
    sequence.push(startVals[i]);
  }

  // Generate remaining values
  while (sequence.length < length) {
    const position = sequence.length + 1;
    const nextVal = evaluateNextValue(sequence, ruleType, params, position);
    sequence.push(nextVal);
  }

  // Calculate the answer (next value after the sequence)
  const nextValue = evaluateNextValue(sequence, ruleType, params, length + 1);

  return { sequence, nextValue };
}

/**
 * Generates multiple sequences that all follow the same rule.
 * Each sequence starts with different values but follows the same pattern.
 */
export function generateMultipleSequences(
  ruleType: RuleProgramType,
  params: RuleProgramParams,
  count: number,
  length: number
): GeneratedSequence[] {
  const sequences: GeneratedSequence[] = [];

  // For positional/power based, we vary the constant term or base
  if (
    ruleType === RuleProgramType.POSITIONAL_FORMULA ||
    ruleType === RuleProgramType.CUBIC_POSITIONAL
  ) {
    for (let i = 0; i < count; i++) {
      const modifiedParams = { ...params };
      if (ruleType === RuleProgramType.POSITIONAL_FORMULA) {
        modifiedParams.c = (params.c ?? 0) + i * 3;
      } else {
        modifiedParams.cubicD = (params.cubicD ?? 0) + i * 5;
      }
      sequences.push(generateSequence(ruleType, modifiedParams, length));
    }
    return sequences;
  }

  if (ruleType === RuleProgramType.POWER_BASED) {
    for (let i = 0; i < count; i++) {
      const modifiedParams = { ...params };
      if (params.powerType === 'n_squared_plus') {
        modifiedParams.base = (params.base ?? 0) + i * 2;
      } else {
        modifiedParams.base = (params.base ?? 2) + i;
      }
      sequences.push(generateSequence(ruleType, modifiedParams, length));
    }
    return sequences;
  }

  // For other rules, we vary starting values
  const baseStartValues = params.startingValues ?? [1];

  for (let i = 0; i < count; i++) {
    const variedStart = baseStartValues.map((v, idx) => {
      // Vary each starting value slightly
      return v + (i * (idx + 1) * 2);
    });
    const seq = generateSequence(ruleType, params, length, variedStart);
    sequences.push(seq);
  }

  return sequences;
}

/**
 * Verifies that a sequence follows the expected rule.
 */
export function verifySequence(
  sequence: number[],
  expectedNext: number,
  ruleType: RuleProgramType,
  params: RuleProgramParams
): boolean {
  const length = sequence.length;
  const generated = generateSequence(ruleType, params, length, sequence.slice(0, 3));

  // Check if sequence matches
  const sequenceMatches = sequence.every((val, idx) => generated.sequence[idx] === val);
  const nextMatches = generated.nextValue === expectedNext;

  return sequenceMatches && nextMatches;
}
