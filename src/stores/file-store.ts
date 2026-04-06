import { create } from 'zustand'

export interface Page {
  id: string
  name: string
  canvasData: string
}

export interface FileState {
  filePath: string | null
  fileName: string
  isModified: boolean
  pages: Page[]
  activePageId: string

  setFilePath: (path: string | null) => void
  setFileName: (name: string) => void
  setModified: (modified: boolean) => void
  setPages: (pages: Page[]) => void
  addPage: () => void
  removePage: (id: string) => void
  setActivePageId: (id: string) => void
  renamePage: (id: string, name: string) => void
  updatePageData: (id: string, data: string) => void
  resetFile: () => void
}

let pageCounter = 1

function createPage(name?: string): Page {
  const id = `page-${Date.now()}-${pageCounter++}`
  return {
    id,
    name: name || `Page ${pageCounter - 1}`,
    canvasData: ''
  }
}

const initialPage = createPage('Page 1')

export const useFileStore = create<FileState>((set, get) => ({
  filePath: null,
  fileName: 'Untitled',
  isModified: false,
  pages: [initialPage],
  activePageId: initialPage.id,

  setFilePath: (path) => set({ filePath: path }),
  setFileName: (name) => set({ fileName: name }),
  setModified: (modified) => set({ isModified: modified }),
  setPages: (pages) => set({ pages }),

  addPage: () => {
    const page = createPage()
    set((s) => ({
      pages: [...s.pages, page],
      activePageId: page.id,
      isModified: true
    }))
  },

  removePage: (id) => {
    const { pages, activePageId } = get()
    if (pages.length <= 1) return
    const filtered = pages.filter((p) => p.id !== id)
    const newActive = activePageId === id ? filtered[0].id : activePageId
    set({ pages: filtered, activePageId: newActive, isModified: true })
  },

  setActivePageId: (id) => set({ activePageId: id }),

  renamePage: (id, name) =>
    set((s) => ({
      pages: s.pages.map((p) => (p.id === id ? { ...p, name } : p)),
      isModified: true
    })),

  updatePageData: (id, data) =>
    set((s) => ({
      pages: s.pages.map((p) => (p.id === id ? { ...p, canvasData: data } : p)),
      isModified: true
    })),

  resetFile: () => {
    pageCounter = 1
    const page = createPage('Page 1')
    set({
      filePath: null,
      fileName: 'Untitled',
      isModified: false,
      pages: [page],
      activePageId: page.id
    })
  }
}))
