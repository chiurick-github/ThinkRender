import { describe, it, expect, beforeEach } from 'vitest'
import { useHistoryStore } from '../history-store'

describe('HistoryStore', () => {
  beforeEach(() => {
    useHistoryStore.getState().clear()
  })

  describe('initial state', () => {
    it('should have empty undo stack', () => {
      expect(useHistoryStore.getState().undoStack).toEqual([])
    })

    it('should have empty redo stack', () => {
      expect(useHistoryStore.getState().redoStack).toEqual([])
    })

    it('should not be undoable', () => {
      expect(useHistoryStore.getState().canUndo()).toBe(false)
    })

    it('should not be redoable', () => {
      expect(useHistoryStore.getState().canRedo()).toBe(false)
    })
  })

  describe('pushState', () => {
    it('should add entry to undo stack', () => {
      useHistoryStore.getState().pushState('Draw rect', '<svg><rect/></svg>')
      expect(useHistoryStore.getState().undoStack).toHaveLength(1)
    })

    it('should store label and snapshot', () => {
      useHistoryStore.getState().pushState('Draw rect', '<svg><rect/></svg>')
      const entry = useHistoryStore.getState().undoStack[0]
      expect(entry.label).toBe('Draw rect')
      expect(entry.canvasSnapshot).toBe('<svg><rect/></svg>')
    })

    it('should add timestamp', () => {
      const before = Date.now()
      useHistoryStore.getState().pushState('test', '<svg/>')
      const entry = useHistoryStore.getState().undoStack[0]
      expect(entry.timestamp).toBeGreaterThanOrEqual(before)
    })

    it('should clear redo stack on new push', () => {
      // Build up undo/redo state
      useHistoryStore.getState().pushState('s1', '<svg>1</svg>')
      useHistoryStore.getState().pushState('s2', '<svg>2</svg>')
      useHistoryStore.getState().pushState('s3', '<svg>3</svg>')
      useHistoryStore.getState().undo()

      expect(useHistoryStore.getState().canRedo()).toBe(true)

      // New push should clear redo
      useHistoryStore.getState().pushState('s4', '<svg>4</svg>')
      expect(useHistoryStore.getState().redoStack).toEqual([])
      expect(useHistoryStore.getState().canRedo()).toBe(false)
    })

    it('should enforce maxSteps limit', () => {
      for (let i = 0; i < 55; i++) {
        useHistoryStore.getState().pushState(`step-${i}`, `<svg>${i}</svg>`)
      }
      expect(useHistoryStore.getState().undoStack.length).toBeLessThanOrEqual(50)
    })

    it('should remove oldest entry when exceeding maxSteps', () => {
      for (let i = 0; i < 55; i++) {
        useHistoryStore.getState().pushState(`step-${i}`, `<svg>${i}</svg>`)
      }
      const first = useHistoryStore.getState().undoStack[0]
      expect(first.label).not.toBe('step-0')
    })
  })

  describe('undo', () => {
    it('should return null when stack has less than 2 entries', () => {
      useHistoryStore.getState().pushState('s1', '<svg>1</svg>')
      const result = useHistoryStore.getState().undo()
      expect(result).toBeNull()
    })

    it('should return previous state', () => {
      useHistoryStore.getState().pushState('s1', '<svg>1</svg>')
      useHistoryStore.getState().pushState('s2', '<svg>2</svg>')
      const result = useHistoryStore.getState().undo()
      expect(result?.canvasSnapshot).toBe('<svg>1</svg>')
    })

    it('should move current state to redo stack', () => {
      useHistoryStore.getState().pushState('s1', '<svg>1</svg>')
      useHistoryStore.getState().pushState('s2', '<svg>2</svg>')
      useHistoryStore.getState().undo()
      expect(useHistoryStore.getState().redoStack).toHaveLength(1)
      expect(useHistoryStore.getState().redoStack[0].canvasSnapshot).toBe('<svg>2</svg>')
    })

    it('should shrink undo stack', () => {
      useHistoryStore.getState().pushState('s1', '<svg>1</svg>')
      useHistoryStore.getState().pushState('s2', '<svg>2</svg>')
      useHistoryStore.getState().pushState('s3', '<svg>3</svg>')
      useHistoryStore.getState().undo()
      expect(useHistoryStore.getState().undoStack).toHaveLength(2)
    })

    it('should support multiple undos', () => {
      useHistoryStore.getState().pushState('s1', '<svg>1</svg>')
      useHistoryStore.getState().pushState('s2', '<svg>2</svg>')
      useHistoryStore.getState().pushState('s3', '<svg>3</svg>')
      useHistoryStore.getState().undo()
      const result = useHistoryStore.getState().undo()
      expect(result?.canvasSnapshot).toBe('<svg>1</svg>')
    })
  })

  describe('redo', () => {
    it('should return null when redo stack is empty', () => {
      const result = useHistoryStore.getState().redo()
      expect(result).toBeNull()
    })

    it('should return previously undone state', () => {
      useHistoryStore.getState().pushState('s1', '<svg>1</svg>')
      useHistoryStore.getState().pushState('s2', '<svg>2</svg>')
      useHistoryStore.getState().undo()
      const result = useHistoryStore.getState().redo()
      expect(result?.canvasSnapshot).toBe('<svg>2</svg>')
    })

    it('should move entry back to undo stack', () => {
      useHistoryStore.getState().pushState('s1', '<svg>1</svg>')
      useHistoryStore.getState().pushState('s2', '<svg>2</svg>')
      useHistoryStore.getState().undo()
      useHistoryStore.getState().redo()
      expect(useHistoryStore.getState().undoStack).toHaveLength(2)
      expect(useHistoryStore.getState().redoStack).toHaveLength(0)
    })
  })

  describe('canUndo / canRedo', () => {
    it('canUndo should be false with 0 entries', () => {
      expect(useHistoryStore.getState().canUndo()).toBe(false)
    })

    it('canUndo should be false with 1 entry', () => {
      useHistoryStore.getState().pushState('s1', '<svg/>')
      expect(useHistoryStore.getState().canUndo()).toBe(false)
    })

    it('canUndo should be true with 2+ entries', () => {
      useHistoryStore.getState().pushState('s1', '<svg>1</svg>')
      useHistoryStore.getState().pushState('s2', '<svg>2</svg>')
      expect(useHistoryStore.getState().canUndo()).toBe(true)
    })

    it('canRedo should be true after undo', () => {
      useHistoryStore.getState().pushState('s1', '<svg>1</svg>')
      useHistoryStore.getState().pushState('s2', '<svg>2</svg>')
      useHistoryStore.getState().undo()
      expect(useHistoryStore.getState().canRedo()).toBe(true)
    })
  })

  describe('clear', () => {
    it('should empty both stacks', () => {
      useHistoryStore.getState().pushState('s1', '<svg/>')
      useHistoryStore.getState().pushState('s2', '<svg/>')
      useHistoryStore.getState().clear()
      expect(useHistoryStore.getState().undoStack).toEqual([])
      expect(useHistoryStore.getState().redoStack).toEqual([])
    })
  })
})
