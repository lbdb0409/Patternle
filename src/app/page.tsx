import { PuzzleGame } from '@/components/puzzle-game';
import { getSession } from '@/lib/auth';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="space-y-8">
      {/* Hero Logo */}
      <div className="text-center pt-2">
        <div className="inline-block">
          <Image
            src="/logo-light.png"
            alt="Patternle"
            width={375}
            height={119}
            className="h-12 w-auto dark:hidden"
            priority
            unoptimized
          />
          <Image
            src="/logo-dark.png"
            alt="Patternle"
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
      </div>

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
