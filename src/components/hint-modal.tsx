'use client';

import { useState, useEffect } from 'react';
import { X, Lightbulb, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HintModalProps {
  isOpen: boolean;
  onClose: () => void;
  puzzleId: string;
  hintsUsed: number[];
  hintsRemaining: number;
  revealedHints: { [key: number]: string };
  onRevealHint: (hintIndex: number, hint: string) => void;
}

export function HintModal({
  isOpen,
  onClose,
  puzzleId,
  hintsUsed,
  hintsRemaining,
  revealedHints,
  onRevealHint,
}: HintModalProps) {
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Initialize with revealedHints from props so hints persist when reopening
  const [localHints, setLocalHints] = useState<{ [key: number]: string }>(revealedHints);

  // Sync hints when modal opens or revealedHints changes
  useEffect(() => {
    if (isOpen) {
      setLocalHints(prev => ({ ...prev, ...revealedHints }));
    }
  }, [isOpen, revealedHints]);

  if (!isOpen) return null;

  const requestHint = async (hintIndex: number) => {
    if (hintsUsed.includes(hintIndex) || localHints[hintIndex]) {
      return;
    }

    setLoading(hintIndex);
    setError(null);

    try {
      const res = await fetch('/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puzzleId, hintIndex }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get hint');
      }

      // Update local state immediately for display
      setLocalHints(prev => ({ ...prev, [hintIndex]: data.hint }));
      onRevealHint(hintIndex, data.hint);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get hint');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb size={20} className="text-yellow-500" />
            Hints
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          {hintsRemaining} of 2 hints remaining. Hints provide nudges without revealing the answer.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {[1, 2].map((hintIndex) => {
            const isUsed = hintsUsed.includes(hintIndex);
            const isRevealed = !!localHints[hintIndex];
            const isLoading = loading === hintIndex;
            const canReveal = hintsRemaining > 0 && !isUsed && !isRevealed;

            return (
              <div
                key={hintIndex}
                className={cn(
                  'p-4 rounded-lg border-2',
                  isRevealed
                    ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Hint {hintIndex}</span>
                  {!isRevealed && (
                    <button
                      onClick={() => requestHint(hintIndex)}
                      disabled={!canReveal || isLoading}
                      className={cn(
                        'px-3 py-1 rounded text-sm font-medium transition-colors',
                        canReveal && !isLoading
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                      )}
                    >
                      {isLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : isUsed ? (
                        'Used'
                      ) : (
                        'Reveal'
                      )}
                    </button>
                  )}
                </div>
                {isRevealed && (
                  <p className="text-gray-700 dark:text-gray-300">{localHints[hintIndex]}</p>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
