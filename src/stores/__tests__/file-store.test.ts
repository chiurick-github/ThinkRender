import { describe, it, expect, beforeEach } from 'vitest'
import { useFileStore } from '../file-store'

describe('FileStore', () => {
  beforeEach(() => {
    useFileStore.getState().resetFile()
  })

  describe('initial state', () => {
    it('should have null filePath', () => {
      expect(useFileStore.getState().filePath).toBeNull()
    })

    it('should have fileName as Untitled', () => {
      expect(useFileStore.getState().fileName).toBe('Untitled')
    })

    it('should not be modified', () => {
      expect(useFileStore.getState().isModified).toBe(false)
    })

    it('should have exactly 1 page', () => {
      expect(useFileStore.getState().pages).toHaveLength(1)
    })

    it('should have first page named Page 1', () => {
      expect(useFileStore.getState().pages[0].name).toBe('Page 1')
    })

    it('should have activePageId matching first page', () => {
      const { pages, activePageId } = useFileStore.getState()
      expect(activePageId).toBe(pages[0].id)
    })
  })

  describe('setFilePath', () => {
    it('should set file path', () => {
      useFileStore.getState().setFilePath('/test/file.svg')
      expect(useFileStore.getState().filePath).toBe('/test/file.svg')
    })

    it('should set null path', () => {
      useFileStore.getState().setFilePath('/test/file.svg')
      useFileStore.getState().setFilePath(null)
      expect(useFileStore.getState().filePath).toBeNull()
    })
  })

  describe('setFileName', () => {
    it('should update file name', () => {
      useFileStore.getState().setFileName('myfile.svg')
      expect(useFileStore.getState().fileName).toBe('myfile.svg')
    })
  })

  describe('setModified', () => {
    it('should set modified flag', () => {
      useFileStore.getState().setModified(true)
      expect(useFileStore.getState().isModified).toBe(true)
    })

    it('should clear modified flag', () => {
      useFileStore.getState().setModified(true)
      useFileStore.getState().setModified(false)
      expect(useFileStore.getState().isModified).toBe(false)
    })
  })

  describe('addPage', () => {
    it('should add a new page', () => {
      useFileStore.getState().addPage()
      expect(useFileStore.getState().pages).toHaveLength(2)
    })

    it('should switch activePageId to new page', () => {
      const initialId = useFileStore.getState().activePageId
      useFileStore.getState().addPage()
      expect(useFileStore.getState().activePageId).not.toBe(initialId)
    })

    it('should mark file as modified', () => {
      useFileStore.getState().addPage()
      expect(useFileStore.getState().isModified).toBe(true)
    })

    it('should add multiple pages', () => {
      useFileStore.getState().addPage()
      useFileStore.getState().addPage()
      useFileStore.getState().addPage()
      expect(useFileStore.getState().pages).toHaveLength(4)
    })
  })

  describe('removePage', () => {
    it('should remove a page when more than 1 exists', () => {
      useFileStore.getState().addPage()
      const pages = useFileStore.getState().pages
      useFileStore.getState().removePage(pages[0].id)
      expect(useFileStore.getState().pages).toHaveLength(1)
    })

    it('should NOT remove the last page', () => {
      const { pages } = useFileStore.getState()
      useFileStore.getState().removePage(pages[0].id)
      expect(useFileStore.getState().pages).toHaveLength(1)
    })

    it('should switch active page if removed page was active', () => {
      useFileStore.getState().addPage()
      const activeId = useFileStore.getState().activePageId
      useFileStore.getState().removePage(activeId)
      expect(useFileStore.getState().activePageId).not.toBe(activeId)
    })

    it('should keep active page if non-active page removed', () => {
      useFileStore.getState().addPage()
      const { pages, activePageId } = useFileStore.getState()
      const otherPage = pages.find((p) => p.id !== activePageId)!
      useFileStore.getState().removePage(otherPage.id)
      expect(useFileStore.getState().activePageId).toBe(activePageId)
    })

    it('should mark file as modified', () => {
      useFileStore.getState().setModified(false)
      useFileStore.getState().addPage()
      useFileStore.getState().setModified(false)
      const pages = useFileStore.getState().pages
      useFileStore.getState().removePage(pages[0].id)
      expect(useFileStore.getState().isModified).toBe(true)
    })
  })

  describe('setActivePageId', () => {
    it('should change active page', () => {
      useFileStore.getState().addPage()
      const pages = useFileStore.getState().pages
      useFileStore.getState().setActivePageId(pages[0].id)
      expect(useFileStore.getState().activePageId).toBe(pages[0].id)
    })
  })

  describe('renamePage', () => {
    it('should rename a page', () => {
      const { pages } = useFileStore.getState()
      useFileStore.getState().renamePage(pages[0].id, 'Cover')
      expect(useFileStore.getState().pages[0].name).toBe('Cover')
    })

    it('should mark file as modified', () => {
      const { pages } = useFileStore.getState()
      useFileStore.getState().renamePage(pages[0].id, 'Cover')
      expect(useFileStore.getState().isModified).toBe(true)
    })
  })

  describe('updatePageData', () => {
    it('should update SVG content of a page', () => {
      const { pages } = useFileStore.getState()
      const svg = '<svg><rect/></svg>'
      useFileStore.getState().updatePageData(pages[0].id, svg)
      expect(useFileStore.getState().pages[0].canvasData).toBe(svg)
    })

    it('should mark file as modified', () => {
      const { pages } = useFileStore.getState()
      useFileStore.getState().updatePageData(pages[0].id, '<svg/>')
      expect(useFileStore.getState().isModified).toBe(true)
    })
  })

  describe('resetFile', () => {
    it('should reset all state', () => {
      useFileStore.getState().setFilePath('/test.svg')
      useFileStore.getState().setFileName('test.svg')
      useFileStore.getState().setModified(true)
      useFileStore.getState().addPage()
      useFileStore.getState().addPage()

      useFileStore.getState().resetFile()

      const state = useFileStore.getState()
      expect(state.filePath).toBeNull()
      expect(state.fileName).toBe('Untitled')
      expect(state.isModified).toBe(false)
      expect(state.pages).toHaveLength(1)
      expect(state.pages[0].name).toBe('Page 1')
    })
  })
})
