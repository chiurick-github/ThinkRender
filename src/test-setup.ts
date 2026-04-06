import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock window.electronAPI for renderer tests
const mockElectronAPI = {
  window: {
    minimize: vi.fn(),
    maximize: vi.fn(),
    close: vi.fn(),
    isMaximized: vi.fn().mockResolvedValue(false)
  },
  file: {
    open: vi.fn(),
    save: vi.fn().mockResolvedValue({ success: true, filePath: '/test/file.svg' }),
    saveAs: vi.fn().mockResolvedValue({ success: true, filePath: '/test/file.svg' })
  },
  on: vi.fn().mockReturnValue(() => {})
}

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true
})
