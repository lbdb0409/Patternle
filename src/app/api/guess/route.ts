import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getTodayDateKey, isPast } from '@/lib/date-utils';

const GuessSchema = z.object({
  puzzleId: z.string(),
  guessValue: z.number().int(),
  // For anonymous users, frontend sends current attempts
  currentAttempts: z.number().int().min(0).max(5).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { puzzleId, guessValue, currentAttempts: clientAttempts } = GuessSchema.parse(body);

    // Get the puzzle
    const puzzle = await db.puzzle.findUnique({
      where: { id: puzzleId },
    });

    if (!puzzle) {
      return NextResponse.json(
        { error: 'Puzzle not found' },
        { status: 404 }
      );
    }

    const session = await getSession();
    const userId = session?.user?.id;

    // Get current progress
    let progress = null;
    if (userId) {
      progress = await db.progress.findUnique({
        where: {
          userId_puzzleId: {
            userId,
            puzzleId,
          },
        },
      });
    }

    // For logged-in users, use DB progress; for anonymous, use client-provided attempts
    const currentAttempts = userId
      ? (progress?.attemptsUsed || 0)
      : (clientAttempts || 0);

    // Check if already finished
    if (progress?.solved) {
      return NextResponse.json(
        { error: 'Puzzle already solved' },
        { status: 400 }
      );
    }

    if (currentAttempts >= 5) {
      return NextResponse.json(
        { error: 'No attempts remaining' },
        { status: 400 }
      );
    }

    // Get the correct answer
    const answers = JSON.parse(puzzle.answers);
    const correctAnswer = answers[0]; // Primary sequence answer
    const isCorrect = guessValue === correctAnswer;

    const newAttemptNumber = currentAttempts + 1;

    // Update database if logged in
    if (userId) {
      // Create attempt record
      await db.attempt.create({
        data: {
          userId,
          puzzleId,
          attemptNumber: newAttemptNumber,
          guessValue,
          correct: isCorrect,
        },
      });

      // Update progress
      await db.progress.upsert({
        where: {
          userId_puzzleId: {
            userId,
            puzzleId,
          },
        },
        create: {
          userId,
          puzzleId,
          attemptsUsed: 1,
          solved: isCorrect,
          finishedAt: isCorrect || newAttemptNumber >= 5 ? new Date() : null,
        },
        update: {
          attemptsUsed: newAttemptNumber,
          solved: isCorrect,
          finishedAt: isCorrect || newAttemptNumber >= 5 ? new Date() : null,
        },
      });

      // Update streak if solved today's puzzle
      if (isCorrect && puzzle.dateKey === getTodayDateKey()) {
        const user = await db.user.findUnique({ where: { id: userId } });
        if (user) {
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          // Check if last played was yesterday (continuing streak) or today (same day)
          let newStreak = 1;
          if (user.lastPlayedAt) {
            const lastPlayed = new Date(user.lastPlayedAt);
            const lastPlayedDate = lastPlayed.toDateString();
            const yesterdayDate = yesterday.toDateString();
            const todayDate = today.toDateString();

            if (lastPlayedDate === yesterdayDate) {
              newStreak = user.currentStreak + 1;
            } else if (lastPlayedDate === todayDate) {
              newStreak = user.currentStreak;
            }
          }

          await db.user.update({
            where: { id: userId },
            data: {
              currentStreak: newStreak,
              longestStreak: Math.max(newStreak, user.longestStreak),
              lastPlayedAt: today,
            },
          });
        }
      }
    }

    // Prepare response
    const isFinished = isCorrect || newAttemptNumber >= 5;

    const response: {
      correct: boolean;
      attemptNumber: number;
      attemptsUsed: number;
      attemptsRemaining: number;
      finished: boolean;
      answer?: number;
      explanation?: string;
    } = {
      correct: isCorrect,
      attemptNumber: newAttemptNumber,
      attemptsUsed: newAttemptNumber,
      attemptsRemaining: Math.max(0, 5 - newAttemptNumber),
      finished: isFinished,
    };

    if (isFinished) {
      response.answer = correctAnswer;
      response.explanation = puzzle.explanation;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing guess:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to process guess' },
      { status: 500 }
    );
  }
}
