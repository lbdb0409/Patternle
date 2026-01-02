'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Lightbulb, PenTool, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SequenceDisplay } from './sequence-display';
import { GuessInput } from './guess-input';
import { GuessHistory } from './guess-history';
import { HintModal } from './hint-modal';
import { Scratchpad } from './scratchpad';
import { ResultDisplay } from './result-display';
import { useGameStore, type PuzzleState } from '@/store/game-store';

interface PuzzleGameProps {
  dateKey?: string;
  isPractice?: boolean;
}

export function PuzzleGame({ dateKey, isPractice = false }: PuzzleGameProps) {
  const { data: session } = useSession();
  const {
    currentPuzzle,
    loading,
    error,
    setPuzzle,
    setLoading,
    setError,
    localState,
    updateLocalState,
    showHintModal,
    setShowHintModal,
    revealedHints,
    setRevealedHint,
    showScratchpad,
    setShowScratchpad,
    _hasHydrated,
  } = useGameStore();

  const [lastResult, setLastResult] = useState<'correct' | 'incorrect' | null>(null);
  const hasTriggeredConfetti = useRef(false);

  // Confetti celebration effect
  const triggerConfetti = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();

    // Big burst in the center
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { x: 0.5, y: 0.5 },
        colors: colors,
      });
    }, 250);
  }, []);

  // Trigger confetti when puzzle is solved
  useEffect(() => {
    if (lastResult === 'correct' && !hasTriggeredConfetti.current) {
      hasTriggeredConfetti.current = true;
      triggerConfetti();
    }
  }, [lastResult, triggerConfetti]);

  // Reset confetti flag when puzzle changes
  useEffect(() => {
    hasTriggeredConfetti.current = false;
  }, [currentPuzzle?.id]);

  const fetchPuzzle = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let url: string;
      if (isPractice) {
        url = '/api/practice/random';
      } else if (dateKey) {
        url = `/api/puzzle/${dateKey}`;
      } else {
        url = '/api/puzzle/today';
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load puzzle');
      }

      // Initialize guesses array
      data.guesses = [];

      // Merge with local state if not logged in and playing today's puzzle
      if (!session?.user && !isPractice && data.dateKey) {
        const local = localState[data.dateKey];
        if (local) {
          data.attemptsUsed = local.attemptsUsed;
          data.attemptsRemaining = Math.max(0, 5 - local.attemptsUsed);
          data.hintsUsed = local.hintsUsed || [];
          data.hintsRemaining = Math.max(0, 2 - (local.hintsUsed?.length || 0));
          data.solved = local.solved;
          data.failed = local.failed;
          data.guesses = local.guesses || [];

          // If finished, restore answer and explanation from local state
          if (local.solved || local.failed) {
            if (local.answer !== undefined) {
              data.answer = local.answer;
              data.explanation = local.explanation;
            } else {
              // Fallback: fetch from API if not stored locally
              const fullRes = await fetch(`/api/puzzle/${data.dateKey}?reveal=true`);
              if (fullRes.ok) {
                const fullData = await fullRes.json();
                data.answer = fullData.answer;
                data.explanation = fullData.explanation;
              }
            }
          }
        }
      }

      setPuzzle(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load puzzle');
    } finally {
      setLoading(false);
    }
  }, [dateKey, isPractice, session?.user, localState, setPuzzle, setLoading, setError]);

  useEffect(() => {
    // Wait for zustand to hydrate from localStorage before fetching
    if (_hasHydrated) {
      fetchPuzzle();
    }
  }, [fetchPuzzle, _hasHydrated]);

  const handleGuess = async (guessValue: number) => {
    if (!currentPuzzle) return;

    setLastResult(null);

    try {
      const res = await fetch('/api/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puzzleId: currentPuzzle.id,
          guessValue,
          // Send current attempts for anonymous users
          currentAttempts: currentPuzzle.attemptsUsed,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit guess');
      }

      // Update puzzle state
      const updatedPuzzle: PuzzleState = {
        ...currentPuzzle,
        attemptsUsed: data.attemptsUsed,
        attemptsRemaining: data.attemptsRemaining,
        solved: data.correct,
        failed: data.finished && !data.correct,
        answer: data.answer,
        explanation: data.explanation,
        guesses: [...(currentPuzzle.guesses || []), guessValue],
      };

      setPuzzle(updatedPuzzle);
      setLastResult(data.correct ? 'correct' : 'incorrect');

      // Update local state for anonymous users
      if (!session?.user && currentPuzzle.dateKey) {
        const currentLocal = localState[currentPuzzle.dateKey] || {
          attemptsUsed: 0,
          hintsUsed: [],
          guesses: [],
          solved: false,
          failed: false,
        };

        updateLocalState(currentPuzzle.dateKey, {
          attemptsUsed: data.attemptsUsed,
          guesses: [...currentLocal.guesses, guessValue],
          solved: data.correct,
          failed: data.finished && !data.correct,
          // Store answer and explanation when game finishes
          ...(data.finished ? { answer: data.answer, explanation: data.explanation } : {}),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit guess');
    }
  };

  const handleRevealHint = (hintIndex: number, hint: string) => {
    setRevealedHint(hintIndex, hint);

    // Update puzzle state
    if (currentPuzzle) {
      const newHintsUsed = [...currentPuzzle.hintsUsed, hintIndex].filter(
        (v, i, a) => a.indexOf(v) === i
      );
      setPuzzle({
        ...currentPuzzle,
        hintsUsed: newHintsUsed,
        hintsRemaining: Math.max(0, 2 - newHintsUsed.length),
      });

      // Update local state for anonymous users
      if (!session?.user && currentPuzzle.dateKey) {
        updateLocalState(currentPuzzle.dateKey, {
          hintsUsed: newHintsUsed,
        });
      }
    }
  };

  if (loading || !_hasHydrated) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchPuzzle}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!currentPuzzle) {
    return (
      <div className="text-center py-12 text-gray-500">
        No puzzle available
      </div>
    );
  }

  const isFinished = currentPuzzle.solved || currentPuzzle.failed;

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="text-center space-y-0.5">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {isPractice ? 'Practice Mode' : `Puzzle #${currentPuzzle.puzzleNumber}`}
        </div>
        {!isPractice && (
          <div className="text-base font-medium text-slate-600 dark:text-slate-300">{currentPuzzle.formattedDate}</div>
        )}
      </div>

      {/* Sequence */}
      <SequenceDisplay
        sequence={currentPuzzle.sequences[currentPuzzle.primarySequenceIndex] || currentPuzzle.sequences[0]}
        solved={currentPuzzle.solved}
        failed={currentPuzzle.failed}
        answer={currentPuzzle.answer}
      />

      {/* Previous guesses */}
      {currentPuzzle.guesses && currentPuzzle.guesses.length > 0 && (
        <GuessHistory
          guesses={currentPuzzle.guesses}
          correctAnswer={currentPuzzle.answer}
          isFinished={isFinished}
        />
      )}

      {/* Result (if finished) */}
      {isFinished && currentPuzzle.answer !== undefined && (
        <ResultDisplay
          solved={currentPuzzle.solved}
          failed={currentPuzzle.failed}
          answer={currentPuzzle.answer}
          explanation={currentPuzzle.explanation || ''}
          attemptsUsed={currentPuzzle.attemptsUsed}
          hintsUsed={currentPuzzle.hintsUsed}
          puzzleNumber={currentPuzzle.puzzleNumber}
          dateKey={currentPuzzle.dateKey}
        />
      )}

      {/* Input and actions (if not finished) */}
      {!isFinished ? (
        <>
          <GuessInput
            onSubmit={handleGuess}
            disabled={isFinished}
            attemptsRemaining={currentPuzzle.attemptsRemaining}
            lastResult={lastResult}
          />

          {/* Action buttons */}
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setShowHintModal(true)}
              disabled={currentPuzzle.hintsRemaining === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium border border-amber-200/50 dark:border-amber-800/50 shadow-sm"
            >
              <Lightbulb size={18} />
              Hints ({currentPuzzle.hintsRemaining})
            </button>

            <button
              onClick={() => setShowScratchpad(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-medium border border-slate-200/50 dark:border-slate-700/50 shadow-sm"
            >
              <PenTool size={18} />
              Scratchpad
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-4 text-gray-500">
          <p>Come back tomorrow for a new puzzle!</p>
        </div>
      )}

      {/* Modals */}
      <HintModal
        isOpen={showHintModal}
        onClose={() => setShowHintModal(false)}
        puzzleId={currentPuzzle.id}
        hintsUsed={currentPuzzle.hintsUsed}
        hintsRemaining={currentPuzzle.hintsRemaining}
        revealedHints={revealedHints}
        onRevealHint={handleRevealHint}
      />

      <Scratchpad
        isOpen={showScratchpad}
        onClose={() => setShowScratchpad(false)}
        sequence={currentPuzzle.sequences[currentPuzzle.primarySequenceIndex] || currentPuzzle.sequences[0]}
      />
    </div>
  );
}
