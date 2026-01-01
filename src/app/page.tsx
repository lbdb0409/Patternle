import { PuzzleGame } from '@/components/puzzle-game';
import { getSession } from '@/lib/auth';
import Image from 'next/image';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Patternle - Free Daily Number Puzzle Game | Like Wordle for Numbers',
  description: 'Play Patternle free! A daily number sequence puzzle game like Wordle, Nerdle, and Mathler. Guess the pattern, solve the sequence. New brain teaser every day!',
  alternates: {
    canonical: 'https://www.patternle.net',
  },
};

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="space-y-8">
      {/* Hidden SEO content - visually hidden but readable by search engines */}
      <div className="sr-only" aria-hidden="true">
        <h1>Patternle - Daily Number Sequence Puzzle Game</h1>
        <p>
          Welcome to Patternle, the free daily number puzzle game similar to Wordle, Nerdle, and Mathler.
          If you love Wordle, word games, or brain teasers, you will enjoy Patternle.
          This number sequence game challenges you to find the pattern and guess what comes next.
        </p>
        <h2>How to Play Patternle</h2>
        <p>
          Look at the number sequence and figure out the mathematical pattern.
          Like Wordle gives you 6 guesses for words, Patternle gives you 5 attempts to guess the next number.
          Patterns include arithmetic sequences, geometric sequences, Fibonacci-like patterns, prime numbers, and more.
        </p>
        <h2>Similar Games</h2>
        <ul>
          <li>Wordle - Daily word puzzle game</li>
          <li>Nerdle - Math equation puzzle</li>
          <li>Mathler - Find the hidden calculation</li>
          <li>Quordle - Four Wordles at once</li>
          <li>Connections - NYT word grouping game</li>
          <li>Sudoku - Number placement puzzle</li>
          <li>2048 - Number sliding puzzle</li>
          <li>Number sequence puzzles</li>
          <li>Pattern recognition games</li>
          <li>Brain training games</li>
          <li>Daily brain teasers</li>
          <li>Math puzzle games</li>
          <li>Logic puzzles online</li>
          <li>Free puzzle games</li>
        </ul>
        <h2>Why Play Patternle?</h2>
        <p>
          Patternle is a free online puzzle game that trains your brain with number sequences and pattern recognition.
          Perfect for fans of Wordle, math games, brain training apps, and daily puzzle challenges.
          New puzzle every day at midnight. Practice mode available for unlimited puzzles.
          Subscribe to access the puzzle archive and play past daily puzzles.
        </p>
        <p>
          Keywords: patternle, wordle, nerdle, mathler, number puzzle, sequence game, pattern game,
          math wordle, number wordle, daily puzzle, brain game, logic puzzle, what comes next,
          number sequence, arithmetic progression, geometric sequence, fibonacci, prime numbers,
          brain teaser, puzzle game online, free games, daily challenge, mental math, IQ test,
          pattern recognition, mathematical patterns, guess the number, number guessing game
        </p>
      </div>

      {/* Hero Logo */}
      <header className="text-center pt-2">
        <div className="inline-block">
          <Image
            src="/logo-light.png"
            alt="Patternle - Daily Number Sequence Puzzle Game like Wordle for Math"
            width={375}
            height={119}
            className="h-12 w-auto dark:hidden"
            priority
            unoptimized
          />
          <Image
            src="/logo-dark.png"
            alt="Patternle - Free Daily Pattern Puzzle similar to Nerdle and Mathler"
            width={369}
            height={114}
            className="h-12 w-auto hidden dark:block"
            priority
            unoptimized
          />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Find the pattern. Guess what comes next.
        </p>
      </header>

      <PuzzleGame />

      {/* Sign in prompt for anonymous users */}
      {!session?.user && (
        <div className="text-center text-sm text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50">
          <p>
            Sign in to save your progress and access the puzzle archive.
          </p>
        </div>
      )}
    </div>
  );
}
