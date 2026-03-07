import { create } from 'zustand'
import type { MoveResource } from '../components/game/match-types'

export type SelectedDie = Exclude<MoveResource, 'bonus'> | null

export type ToastTone = 'info' | 'success' | 'warning'

export type UiToast = {
  id: string
  message: string
  tone: ToastTone
}

export type TurnActionItem = {
  id: string
  resource: MoveResource
  value: number
  tokenId: string
  tokenLabel: string
  origin: number
  destination: number
}

type GameUiState = {
  selectedDie: SelectedDie
  highlightedSquares: number[]
  highlightedTokenIds: string[]
  animatingTokenIds: string[]
  toasts: UiToast[]
  turnActionStack: TurnActionItem[]
  isLogOpen: boolean
  setSelectedDie: (die: SelectedDie) => void
  setHighlightedSquares: (squares: number[]) => void
  setHighlightedTokenIds: (tokenIds: string[]) => void
  setAnimatingTokenIds: (tokenIds: string[]) => void
  pushToast: (toast: UiToast) => void
  removeToast: (toastId: string) => void
  pushTurnAction: (action: TurnActionItem) => void
  popTurnAction: () => TurnActionItem | null
  setIsLogOpen: (open: boolean) => void
  setMoveHints: (tokenIds: string[], targetSquares: number[]) => void
  resetTurnVisuals: () => void
}

export const useGameUiStore = create<GameUiState>((set, get) => ({
  selectedDie: null,
  highlightedSquares: [],
  highlightedTokenIds: [],
  animatingTokenIds: [],
  toasts: [],
  turnActionStack: [],
  isLogOpen: false,
  setSelectedDie: (die) => set({ selectedDie: die }),
  setHighlightedSquares: (squares) => set({ highlightedSquares: squares }),
  setHighlightedTokenIds: (tokenIds) => set({ highlightedTokenIds: tokenIds }),
  setAnimatingTokenIds: (tokenIds) => set({ animatingTokenIds: tokenIds }),
  pushToast: (toast) =>
    set((current) => ({
      toasts: [...current.toasts, toast],
    })),
  removeToast: (toastId) =>
    set((current) => ({
      toasts: current.toasts.filter((toast) => toast.id !== toastId),
    })),
  pushTurnAction: (action) =>
    set((current) => ({
      turnActionStack: [...current.turnActionStack, action],
    })),
  popTurnAction: () => {
    const current = get().turnActionStack

    if (current.length === 0) {
      return null
    }

    const next = [...current]
    const last = next.pop() || null
    set({ turnActionStack: next })
    return last
  },
  setIsLogOpen: (open) => set({ isLogOpen: open }),
  setMoveHints: (tokenIds, targetSquares) =>
    set({
      highlightedTokenIds: tokenIds,
      highlightedSquares: targetSquares,
    }),
  resetTurnVisuals: () =>
    set({
      selectedDie: null,
      highlightedSquares: [],
      highlightedTokenIds: [],
      animatingTokenIds: [],
      turnActionStack: [],
    }),
}))
