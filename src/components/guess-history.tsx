'use client';

import { cn } from '@/lib/utils';
import { X, Check } from 'lucide-react';

interface GuessHistoryProps {
  guesses: number[];
  correctAnswer?: number;
  isFinished: boolean;
}

export function GuessHistory({ guesses, correctAnswer, isFinished }: GuessHistoryProps) {
  if (guesses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">Your Guesses</div>
      <div className="flex flex-wrap justify-center gap-2">
        {guesses.map((guess, index) => {
          const isCorrect = isFinished && guess === correctAnswer;

          return (
            <div
              key={index}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-mono text-sm font-bold shadow-sm transition-all',
                isCorrect
                  ? 'bg-gradient-to-b from-emerald-400 to-emerald-500 text-white shadow-emerald-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              )}
            >
              {isCorrect ? (
                <Check size={14} className="text-white" />
              ) : (
                <X size={14} className="text-slate-400 dark:text-slate-500" />
              )}
              {guess}
            </div>
          );
        })}
      </div>
    </div>
  );
}
