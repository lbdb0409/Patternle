'use client';

import { PuzzleGame } from './puzzle-game';
import { RefreshCw } from 'lucide-react';

export function PracticeContent() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Practice Mode</h1>
        <p className="text-gray-500">
          Sharpen your skills with random puzzles from the archive.
        </p>
      </div>

      <PuzzleGame isPractice />

      <div className="text-center">
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <RefreshCw size={18} />
          New Puzzle
        </button>
      </div>
    </div>
  );
}
