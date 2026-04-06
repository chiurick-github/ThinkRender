import { create } from 'zustand'

interface HistoryEntry {
  label: string
  canvasSnapshot: string
  timestamp: number
}

interface HistoryState {
  undoStack: HistoryEntry[]
  redoStack: HistoryEntry[]
  maxSteps: number

  pushState: (label: string, data: string) => void
  undo: () => HistoryEntry | null
  redo: () => HistoryEntry | null
  canUndo: () => boolean
  canRedo: () => boolean
  clear: () => void
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  undoStack: [],
  redoStack: [],
  maxSteps: 50,

  pushState: (label, data) =>
    set((s) => {
      const entry: HistoryEntry = { label, canvasSnapshot: data, timestamp: Date.now() }
      const stack = [...s.undoStack, entry]
      if (stack.length > s.maxSteps) stack.shift()
      return { undoStack: stack, redoStack: [] }
    }),

  undo: () => {
    const { undoStack, redoStack } = get()
    if (undoStack.length < 2) return null
    const current = undoStack[undoStack.length - 1]
    const previous = undoStack[undoStack.length - 2]
    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, current]
    })
    return previous
  },

  redo: () => {
    const { undoStack, redoStack } = get()
    if (redoStack.length === 0) return null
    const entry = redoStack[redoStack.length - 1]
    set({
      undoStack: [...undoStack, entry],
      redoStack: redoStack.slice(0, -1)
    })
    return entry
  },

  canUndo: () => get().undoStack.length >= 2,
  canRedo: () => get().redoStack.length > 0,
  clear: () => set({ undoStack: [], redoStack: [] })
}))
