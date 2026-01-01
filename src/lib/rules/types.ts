/**
 * Supported rule program types for puzzle generation.
 * Each type defines a deterministic way to generate number sequences.
 */
export enum RuleProgramType {
  // Basic arithmetic patterns
  ARITHMETIC_SEQUENCE = 'ARITHMETIC_SEQUENCE', // constant difference: a, a+d, a+2d, ...
  GEOMETRIC_SEQUENCE = 'GEOMETRIC_SEQUENCE', // constant ratio: a, a*r, a*r^2, ...

  // Difference-based patterns
  LINEAR_DIFF = 'LINEAR_DIFF', // differences increase/decrease linearly
  SECOND_ORDER_CONSTANT = 'SECOND_ORDER_CONSTANT', // second differences are constant

  // Alternating patterns
  ALTERNATING_OPS = 'ALTERNATING_OPS', // alternating operations like +a, -b, +a, -b
  ALTERNATING_PARITY = 'ALTERNATING_PARITY', // different rules for odd/even positions

  // Positional/polynomial patterns
  POSITIONAL_FORMULA = 'POSITIONAL_FORMULA', // a*n^2 + b*n + c
  CUBIC_POSITIONAL = 'CUBIC_POSITIONAL', // a*n^3 + b*n^2 + c*n + d

  // Recursive patterns
  RECURSIVE_LINEAR = 'RECURSIVE_LINEAR', // next = a*prev + b
  FIBONACCI_LIKE = 'FIBONACCI_LIKE', // next = a*prev + b*prev2
  TRIBONACCI_LIKE = 'TRIBONACCI_LIKE', // next = prev + prev2 + prev3

  // Special patterns
  DIGIT_SUM_BASED = 'DIGIT_SUM_BASED', // involves digit sums
  MULTIPLY_THEN_ADD = 'MULTIPLY_THEN_ADD', // next = prev * a + b
  POWER_BASED = 'POWER_BASED', // involves powers: n^k or k^n patterns
}

/**
 * Parameters for each rule program type.
 */
export type RuleProgramParams = {
  // For ARITHMETIC_SEQUENCE
  difference?: number;

  // For GEOMETRIC_SEQUENCE
  ratio?: number;

  // For LINEAR_DIFF
  initialDiff?: number;
  diffIncrement?: number;

  // For SECOND_ORDER_CONSTANT
  secondDifference?: number;

  // For ALTERNATING_OPS
  operations?: Array<{ op: 'add' | 'subtract' | 'multiply'; value: number }>;

  // For ALTERNATING_PARITY
  oddMultiplier?: number;
  oddAddend?: number;
  evenMultiplier?: number;
  evenAddend?: number;

  // For POSITIONAL_FORMULA
  a?: number; // coefficient for n^2
  b?: number; // coefficient for n
  c?: number; // constant

  // For CUBIC_POSITIONAL
  cubicA?: number; // coefficient for n^3
  cubicB?: number; // coefficient for n^2
  cubicC?: number; // coefficient for n
  cubicD?: number; // constant

  // For RECURSIVE_LINEAR
  multiplier?: number;
  addend?: number;

  // For FIBONACCI_LIKE
  prevMultiplier?: number;
  prev2Multiplier?: number;

  // For DIGIT_SUM_BASED
  digitSumMultiplier?: number;
  digitSumAddend?: number;

  // For MULTIPLY_THEN_ADD
  multiplyFactor?: number;
  addFactor?: number;

  // For POWER_BASED
  base?: number;
  exponent?: number;
  powerType?: 'n_to_k' | 'k_to_n' | 'n_squared_plus';

  // Starting values for sequences that need initial terms
  startingValues?: number[];
};

export interface RuleProgram {
  type: RuleProgramType;
  params: RuleProgramParams;
}

export interface GeneratedSequence {
  sequence: number[];
  nextValue: number;
}

export interface PuzzleData {
  ruleProgramType: RuleProgramType;
  ruleProgramParams: RuleProgramParams;
  tags: string[];
  sequences: number[][];
  answers: number[];
  primarySequenceIndex: number;
  hints: [string, string];
  explanation: string;
}

export const RULE_CATEGORY_TAGS = [
  'ARITHMETIC',
  'GEOMETRIC',
  'DIFFERENCES',
  'SECOND_ORDER',
  'ALTERNATING',
  'POLYNOMIAL',
  'RECURSIVE',
  'FIBONACCI',
  'INCREASING',
  'DECREASING',
  'MIXED_SIGNS',
  'DIGIT_BASED',
  'POWERS',
  'POSITIONAL',
] as const;

export type RuleCategoryTag = typeof RULE_CATEGORY_TAGS[number];
