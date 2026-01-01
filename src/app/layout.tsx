import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Patternle - Daily Number Puzzle',
  description: 'A daily number sequence puzzle game. Figure out the pattern and guess what comes next!',
  keywords: ['puzzle', 'number game', 'sequence', 'pattern', 'daily puzzle', 'math game', 'patternle'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8 max-w-xl">
              {children}
            </main>
            <footer className="border-t border-slate-200/50 dark:border-slate-800/50 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              <p className="font-medium">Patternle</p>
              <p className="text-xs mt-1 text-slate-400 dark:text-slate-500">A daily pattern puzzle</p>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
