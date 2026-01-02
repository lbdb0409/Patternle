import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Patternle - Daily Number Sequence Puzzle Game | Like Wordle for Math',
  description: 'Play Patternle, the free daily number sequence puzzle game. Similar to Wordle but for math lovers! Figure out the pattern, guess what comes next. New puzzle every day. Challenge your brain with number sequences, arithmetic progressions, and mathematical patterns.',
  keywords: [
    'patternle',
    'daily puzzle',
    'number game',
    'sequence game',
    'pattern game',
    'math puzzle',
    'wordle',
    'wordle alternative',
    'number wordle',
    'math wordle',
    'daily brain game',
    'number sequence',
    'what comes next',
    'pattern recognition',
    'logic puzzle',
    'brain teaser',
    'free puzzle game',
    'online puzzle',
    'daily challenge',
    'nerdle',
    'mathler',
    'number puzzle',
    'sequence puzzle',
    'arithmetic sequence',
    'fibonacci',
    'prime numbers',
    'mental math',
    'brain training',
    'puzzle game online',
    'daily word game',
    'guess the number',
    'number guessing game',
  ],
  icons: {
    icon: '/favicon.jpg',
    apple: '/favicon.jpg',
  },
  metadataBase: new URL('https://www.patternle.net'),
  alternates: {
    canonical: 'https://www.patternle.net',
  },
  openGraph: {
    title: 'Patternle - Daily Number Sequence Puzzle Game',
    description: 'A daily number sequence puzzle like Wordle for math! Figure out the pattern and guess what comes next. Free to play, new puzzle every day.',
    url: 'https://www.patternle.net',
    siteName: 'Patternle',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'Patternle - Daily Number Puzzle',
    description: 'Like Wordle but for numbers! A daily pattern puzzle game. Figure out the sequence and guess what comes next.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  category: 'games',
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
        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Patternle',
              alternateName: ['Pattern Game', 'Number Wordle', 'Math Puzzle Game', 'Sequence Game'],
              description: 'A daily number sequence puzzle game similar to Wordle. Figure out the pattern and guess what comes next. Free brain training game with new puzzles every day.',
              url: 'https://www.patternle.net',
              applicationCategory: 'GameApplication',
              genre: ['Puzzle', 'Educational', 'Brain Training', 'Math Game'],
              operatingSystem: 'Any',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                description: 'Free daily puzzle with optional premium archive access',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '150',
                bestRating: '5',
                worstRating: '1',
              },
              keywords: 'patternle, wordle, nerdle, mathler, number puzzle, sequence game, daily puzzle, brain game, pattern recognition, math game, logic puzzle, free online game',
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'What is Patternle?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Patternle is a free daily number sequence puzzle game, similar to Wordle but for math lovers. Each day features a new number pattern to solve.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How do you play Patternle?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Look at the number sequence, figure out the pattern, and guess what number comes next. You have 5 attempts to solve each puzzle.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Is Patternle like Wordle?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes! Patternle is inspired by Wordle but focuses on number sequences instead of words. Like Wordle, there is one puzzle per day.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Is Patternle free to play?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes, the daily puzzle is completely free. Premium subscribers can access the puzzle archive to play past puzzles.',
                  },
                },
              ],
            }),
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
        <Analytics />
      </body>
    </html>
  );
}
