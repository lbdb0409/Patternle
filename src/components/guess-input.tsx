'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Send, Loader2 } from 'lucide-react';

interface GuessInputProps {
  onSubmit: (value: number) => Promise<void>;
  disabled: boolean;
  attemptsRemaining: number;
  lastResult?: 'correct' | 'incorrect' | null;
}

export function GuessInput({
  onSubmit,
  disabled,
  attemptsRemaining,
  lastResult,
}: GuessInputProps) {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (lastResult === 'incorrect') {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setValue('');
      inputRef.current?.focus();
    } else if (lastResult === 'correct') {
      setValue('');
    }
  }, [lastResult]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseInt(value, 10);

    if (isNaN(numValue)) {
      inputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(numValue);
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = disabled || submitting;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            pattern="-?[0-9]*"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isDisabled}
            placeholder="Your answer..."
            className={cn(
              'w-full px-5 py-4 text-xl font-mono rounded-xl border-2 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm',
              isDisabled
                ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-not-allowed text-slate-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
              shake && 'animate-shake'
            )}
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          disabled={isDisabled || !value}
          className={cn(
            'px-6 py-4 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm',
            isDisabled || !value
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-b from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40'
          )}
        >
          {submitting ? (
            <Loader2 size={22} className="animate-spin" />
          ) : (
            <Send size={22} />
          )}
          <span className="hidden sm:inline">Guess</span>
        </button>
      </form>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {attemptsRemaining} {attemptsRemaining === 1 ? 'attempt' : 'attempts'} left
        </span>
        <div className="flex gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-all',
                i < 5 - attemptsRemaining
                  ? 'bg-red-400 dark:bg-red-500'
                  : 'bg-slate-200 dark:bg-slate-700'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
