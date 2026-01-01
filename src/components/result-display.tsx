'use client';

import { Share2, Trophy, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResultDisplayProps {
  solved: boolean;
  failed: boolean;
  answer: number;
  explanation: string;
  attemptsUsed: number;
  hintsUsed: number[];
  puzzleNumber: number;
  dateKey: string;
}

export function ResultDisplay({
  solved,
  failed,
  answer,
  explanation,
  attemptsUsed,
  hintsUsed,
  puzzleNumber,
  dateKey,
}: ResultDisplayProps) {
  const generateShareText = () => {
    const emoji = solved ? '🎉' : '😔';
    const attempts = solved ? `${attemptsUsed}/5` : 'X/5';
    const hints = hintsUsed.length > 0 ? ` (${hintsUsed.length} hints)` : '';

    const squares = Array.from({ length: 5 })
      .map((_, i) => {
        if (i < attemptsUsed - 1) return '🟥';
        if (i === attemptsUsed - 1 && solved) return '🟩';
        if (i === attemptsUsed - 1 && failed) return '🟥';
        return '⬜';
      })
      .join('');

    return `Patternle #${puzzleNumber} ${emoji}
${attempts}${hints}
${squares}

Play at: patternle.app`;
  };

  const handleShare = async () => {
    const text = generateShareText();

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        await navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
      }
    } else {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    }
  };

  if (!solved && !failed) return null;

  return (
    <div
      className={cn(
        'rounded-2xl border overflow-hidden shadow-lg',
        solved
          ? 'bg-gradient-to-b from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-900/10 border-emerald-200 dark:border-emerald-800/50 shadow-emerald-500/10'
          : 'bg-gradient-to-b from-red-50 to-red-100/50 dark:from-red-900/30 dark:to-red-900/10 border-red-200 dark:border-red-800/50 shadow-red-500/10'
      )}
    >
      <div className="p-6">
        <div className="flex items-center gap-4 mb-5">
          {solved ? (
            <>
              <div className="w-14 h-14 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Trophy className="text-white" size={28} />
              </div>
              <div>
                <h3 className="font-bold text-xl text-emerald-800 dark:text-emerald-200">
                  Brilliant!
                </h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  Solved in {attemptsUsed} {attemptsUsed === 1 ? 'attempt' : 'attempts'}
                  {hintsUsed.length > 0 && ` with ${hintsUsed.length} hint${hintsUsed.length > 1 ? 's' : ''}`}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-gradient-to-b from-red-400 to-red-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                <Target className="text-white" size={28} />
              </div>
              <div>
                <h3 className="font-bold text-xl text-red-800 dark:text-red-200">
                  So Close!
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  The answer was <span className="font-mono font-bold text-base">{answer}</span>
                </p>
              </div>
            </>
          )}
        </div>

        <div className="bg-white/70 dark:bg-slate-800/70 rounded-xl p-4 mb-5 border border-slate-200/50 dark:border-slate-700/50">
          <h4 className="font-semibold text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">The Pattern</h4>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{explanation}</p>
        </div>

        <button
          onClick={handleShare}
          className={cn(
            'flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold transition-all shadow-sm',
            solved
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25'
              : 'bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white'
          )}
        >
          <Share2 size={18} />
          Share Result
        </button>
      </div>
    </div>
  );
}
