'use client';

import { cn } from '@/lib/utils';

interface SequenceDisplayProps {
  sequence: number[];
  solved: boolean;
  failed: boolean;
  answer?: number;
}

export function SequenceDisplay({
  sequence,
  solved,
  failed,
  answer,
}: SequenceDisplayProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 p-4 sm:p-6 border border-slate-200/50 dark:border-slate-700/50 overflow-x-auto">
      <div className="flex items-center justify-center gap-1 sm:gap-2 min-w-max mx-auto">
        {sequence.map((num, index) => (
          <div key={index} className="flex items-center gap-1 sm:gap-2">
            <span className="inline-flex items-center justify-center min-w-[2.25rem] sm:min-w-[3rem] h-10 sm:h-12 px-2 sm:px-3 rounded-lg sm:rounded-xl font-mono text-base sm:text-xl font-bold bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-300/50 dark:border-slate-600/50">
              {num}
            </span>
            {index < sequence.length - 1 && (
              <span className="text-slate-300 dark:text-slate-600 text-base sm:text-xl font-light">,</span>
            )}
          </div>
        ))}

        <span className="text-slate-300 dark:text-slate-600 text-base sm:text-xl font-light">,</span>

        {/* The mystery slot */}
        <span
          className={cn(
            'inline-flex items-center justify-center min-w-[2.25rem] sm:min-w-[3rem] h-10 sm:h-12 px-2 sm:px-3 rounded-lg sm:rounded-xl font-mono text-base sm:text-xl font-bold border-2 transition-all duration-300',
            solved
              ? 'bg-gradient-to-b from-emerald-400 to-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30'
              : failed
              ? 'bg-gradient-to-b from-red-400 to-red-500 border-red-400 text-white shadow-lg shadow-red-500/30'
              : 'border-dashed border-primary-400 dark:border-primary-500 text-primary-500 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
          )}
        >
          {solved || failed ? answer : '?'}
        </span>
      </div>
    </div>
  );
}
