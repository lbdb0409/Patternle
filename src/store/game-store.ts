import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface PuzzleState {
  id: string;
  dateKey: string;
  puzzleNumber: number;
  formattedDate: string;
  difficulty: string;
  tags: string[];
  sequences: number[][];
  primarySequenceIndex: number;
  attemptsUsed: number;
  attemptsRemaining: number;
  hintsUsed: number[];
  hintsRemaining: number;
  solved: boolean;
  failed: boolean;
  answer?: number;
  explanation?: string;
  isArchive?: boolean;
  isPractice?: boolean;
  guesses: number[]; // Track all guesses made
}

interface LocalGameState {
  [dateKey: string]: {
    attemptsUsed: number;
    hintsUsed: number[];
    guesses: number[];
    solved: boolean;
    failed: boolean;
    answer?: number;
    explanation?: string;
  };
}

interface GameStore {
  currentPuzzle: PuzzleState | null;
  loading: boolean;
  error: string | null;
  localState: LocalGameState;
  showHintModal: boolean;
  revealedHints: { [key: number]: string };
  showScratchpad: boolean;
  _hasHydrated: boolean;

  // Actions
  setPuzzle: (puzzle: PuzzleState) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateLocalState: (dateKey: string, update: Partial<LocalGameState[string]>) => void;
  getLocalState: (dateKey: string) => LocalGameState[string] | null;
  setShowHintModal: (show: boolean) => void;
  setRevealedHint: (index: number, hint: string) => void;
  setShowScratchpad: (show: boolean) => void;
  resetPuzzleState: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      currentPuzzle: null,
      loading: false,
      error: null,
      localState: {},
      showHintModal: false,
      revealedHints: {},
      showScratchpad: false,
      _hasHydrated: false,

      setPuzzle: (puzzle) =>
        set((state) => ({
          currentPuzzle: puzzle,
          error: null,
          // Only reset hints when loading a different puzzle
          revealedHints: state.currentPuzzle?.id === puzzle.id ? state.revealedHints : {},
        })),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      updateLocalState: (dateKey, update) =>
        set((state) => ({
          localState: {
            ...state.localState,
            [dateKey]: {
              ...state.localState[dateKey],
              attemptsUsed: state.localState[dateKey]?.attemptsUsed ?? 0,
              hintsUsed: state.localState[dateKey]?.hintsUsed ?? [],
              guesses: state.localState[dateKey]?.guesses ?? [],
              solved: state.localState[dateKey]?.solved ?? false,
              failed: state.localState[dateKey]?.failed ?? false,
              ...update,
            },
          },
        })),

      getLocalState: (dateKey) => get().localState[dateKey] || null,

      setShowHintModal: (show) => set({ showHintModal: show }),

      setRevealedHint: (index, hint) =>
        set((state) => ({
          revealedHints: {
            ...state.revealedHints,
            [index]: hint,
          },
        })),

      setShowScratchpad: (show) => set({ showScratchpad: show }),

      resetPuzzleState: () =>
        set({
          currentPuzzle: null,
          error: null,
          revealedHints: {},
          showHintModal: false,
          showScratchpad: false,
        }),

      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'patternle-game-state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ localState: state.localState }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
