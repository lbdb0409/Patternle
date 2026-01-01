import { z } from 'zod';
import { RuleProgramType } from './rules/types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Schema for the AI-generated puzzle parameters.
 */
export const PuzzleGenerationSchema = z.object({
  ruleProgramType: z.nativeEnum(RuleProgramType),
  ruleProgramParams: z.object({
    // Optional params based on rule type
    difference: z.number().optional(),
    ratio: z.number().optional(),
    initialDiff: z.number().optional(),
    diffIncrement: z.number().optional(),
    secondDifference: z.number().optional(),
    operations: z.array(z.object({
      op: z.enum(['add', 'subtract', 'multiply']),
      value: z.number(),
    })).optional(),
    oddMultiplier: z.number().optional(),
    oddAddend: z.number().optional(),
    evenMultiplier: z.number().optional(),
    evenAddend: z.number().optional(),
    a: z.number().optional(),
    b: z.number().optional(),
    c: z.number().optional(),
    cubicA: z.number().optional(),
    cubicB: z.number().optional(),
    cubicC: z.number().optional(),
    cubicD: z.number().optional(),
    multiplier: z.number().optional(),
    addend: z.number().optional(),
    prevMultiplier: z.number().optional(),
    prev2Multiplier: z.number().optional(),
    digitSumMultiplier: z.number().optional(),
    digitSumAddend: z.number().optional(),
    multiplyFactor: z.number().optional(),
    addFactor: z.number().optional(),
    base: z.number().optional(),
    exponent: z.number().optional(),
    powerType: z.enum(['n_to_k', 'k_to_n', 'n_squared_plus']).optional(),
    startingValues: z.array(z.number()).optional(),
  }),
  tags: z.array(z.string()),
  hints: z.tuple([z.string(), z.string()]),
  explanation: z.string(),
  suggestedStartingValues: z.array(z.array(z.number())).optional(),
});

export type PuzzleGenerationResponse = z.infer<typeof PuzzleGenerationSchema>;

/**
 * Calls OpenRouter API with a prompt and returns the response.
 */
export async function callOpenRouter<T>(
  prompt: string,
  systemPrompt: string,
  schema?: z.ZodSchema<T>
): Promise<T> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Patternle',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response from OpenRouter API');
  }

  const content = data.choices[0].message.content;

  // Extract JSON from the response
  const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : content;

  try {
    const parsed = JSON.parse(jsonStr.trim());
    if (schema) {
      return schema.parse(parsed);
    }
    return parsed as T;
  } catch (e) {
    console.error('Failed to parse OpenRouter response:', content);
    throw new Error(`Failed to parse AI response as JSON: ${e}`);
  }
}

/**
 * System prompt for puzzle generation.
 */
export const PUZZLE_GENERATION_SYSTEM_PROMPT = `You are a puzzle generator for "Patternle", a daily number sequence puzzle game.

Your task is to select a rule type and parameters that will create an interesting, challenging puzzle.

AVAILABLE RULE TYPES:
1. ARITHMETIC_SEQUENCE - constant difference (params: difference)
2. GEOMETRIC_SEQUENCE - constant ratio (params: ratio)
3. LINEAR_DIFF - differences increase linearly (params: initialDiff, diffIncrement)
4. SECOND_ORDER_CONSTANT - second differences are constant (params: secondDifference)
5. ALTERNATING_OPS - alternating operations (params: operations array)
6. ALTERNATING_PARITY - different rules for odd/even positions (params: oddMultiplier, oddAddend, evenMultiplier, evenAddend)
7. POSITIONAL_FORMULA - quadratic: a*n^2 + b*n + c (params: a, b, c)
8. CUBIC_POSITIONAL - cubic formula (params: cubicA, cubicB, cubicC, cubicD)
9. RECURSIVE_LINEAR - next = multiplier * prev + addend (params: multiplier, addend, startingValues)
10. FIBONACCI_LIKE - next = a*prev + b*prev2 (params: prevMultiplier, prev2Multiplier, startingValues)
11. TRIBONACCI_LIKE - next = prev + prev2 + prev3 (params: startingValues)
12. DIGIT_SUM_BASED - involves digit sums (params: digitSumMultiplier, digitSumAddend, startingValues)
13. MULTIPLY_THEN_ADD - next = prev * factor + addend (params: multiplyFactor, addFactor, startingValues)
14. POWER_BASED - power patterns (params: base, exponent, powerType: 'n_to_k' | 'k_to_n' | 'n_squared_plus')

CONSTRAINTS:
- All numbers must be integers between -999 and 999
- For recursive rules, provide startingValues (2-3 initial values)
- For positional rules, the sequence will be generated from position 1
- Choose parameters that create "hard" but fair puzzles
- Avoid trivially simple patterns (like difference of 1 or 2)
- Avoid obscure mathematical knowledge - keep it logical and fair

HINTS GUIDELINES:
- Hint 1: Describe what operations are involved without giving the exact rule. Examples:
  - "This pattern only uses addition, but the amount added changes each time."
  - "This uses both multiplication and addition, alternating between them."
  - "Each term is calculated from the two previous terms."
- Hint 2: Give a more specific nudge about the structure. Examples:
  - "The amount you add increases by the same number each step."
  - "First multiply by 2, then add 3, then multiply by 2, then add 3..."
  - "Try adding the previous two terms together, then adding something extra."
- NEVER reveal the exact formula or answer
- Hints should explicitly mention operations (addition, subtraction, multiplication, division, squaring, etc.)

OUTPUT FORMAT:
Return ONLY valid JSON with this structure:
\`\`\`json
{
  "ruleProgramType": "RULE_TYPE_HERE",
  "ruleProgramParams": { ... params based on rule type ... },
  "tags": ["TAG1", "TAG2"],
  "hints": ["Hint 1 text", "Hint 2 text"],
  "explanation": "Clear explanation of the rule for post-solve",
  "suggestedStartingValues": [[1, 3, 7], [2, 5, 11]] // Optional: for recursive rules, suggest 3-5 different starting value sets
}
\`\`\`

TAGS can include: ARITHMETIC, GEOMETRIC, DIFFERENCES, SECOND_ORDER, ALTERNATING, POLYNOMIAL, RECURSIVE, FIBONACCI, INCREASING, DECREASING, MIXED_SIGNS, DIGIT_BASED, POWERS, POSITIONAL`;

/**
 * Generates puzzle parameters using OpenRouter.
 */
export async function generatePuzzleWithAI(): Promise<PuzzleGenerationResponse> {
  const prompt = `Generate a "hard" difficulty number sequence puzzle.

Choose an interesting rule type that:
1. Is not immediately obvious from the first 4-5 terms
2. Requires some analysis to discover
3. Has a clear, logical pattern (not arbitrary)
4. Uses numbers that are reasonably sized (avoid huge numbers)

For recursive rules, suggest 3-5 different sets of starting values that would work well.
Make sure the hints are helpful but don't give away the answer.`;

  return callOpenRouter(prompt, PUZZLE_GENERATION_SYSTEM_PROMPT, PuzzleGenerationSchema);
}
