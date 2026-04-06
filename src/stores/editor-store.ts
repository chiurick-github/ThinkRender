import { create } from 'zustand'

export type Tool =
  | 'select'
  | 'rect'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'triangle'
  | 'polygon'
  | 'star'
  | 'text'
  | 'freehand'

export interface SelectedObject {
  id: string
  type: string
  left: number
  top: number
  width: number
  height: number
  angle: number
  fill: string
  stroke: string
  strokeWidth: number
  opacity: number
  rx?: number
  ry?: number
}

export interface LogicalLayer {
  id: string
  name: string
  visible: boolean
  locked: boolean
}

export interface EditorState {
  activeTool: Tool
  selectedObjects: SelectedObject[]
  zoom: number
  showCodeEditor: boolean
  showPropertyPanel: boolean
  showAssetPanel: boolean
  canvasWidth: number
  canvasHeight: number

  layers: LogicalLayer[]
  activeLayerId: string

  setActiveTool: (tool: Tool) => void
  setSelectedObjects: (objects: SelectedObject[]) => void
  setZoom: (zoom: number) => void
  toggleCodeEditor: () => void
  togglePropertyPanel: () => void
  toggleAssetPanel: () => void
  setCanvasSize: (width: number, height: number) => void

  addLayer: () => void
  removeLayer: (id: string) => void
  setActiveLayer: (id: string) => void
  renameLayer: (id: string, name: string) => void
  toggleLayerVisibility: (id: string) => void
  toggleLayerLock: (id: string) => void
  reorderLayers: (startIndex: number, endIndex: number) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  activeTool: 'select',
  selectedObjects: [],
  zoom: 100,
  showCodeEditor: false,
  showPropertyPanel: true,
  showAssetPanel: false,
  canvasWidth: 1920,
  canvasHeight: 1080,
  layers: [{ id: 'layer-1', name: 'Layer 1', visible: true, locked: false }],
  activeLayerId: 'layer-1',

  setActiveTool: (tool) => set({ activeTool: tool }),
  setSelectedObjects: (objects) => set({ selectedObjects: objects }),
  setZoom: (zoom) => set({ zoom: Math.max(10, Math.min(500, zoom)) }),
  toggleCodeEditor: () => set((s) => ({ showCodeEditor: !s.showCodeEditor })),
  togglePropertyPanel: () => set((s) => ({ showPropertyPanel: !s.showPropertyPanel })),
  toggleAssetPanel: () => set((s) => ({ showAssetPanel: !s.showAssetPanel })),
  setCanvasSize: (width, height) => set({ canvasWidth: width, canvasHeight: height }),

  addLayer: () => set((s) => {
    const newId = `layer-${Date.now()}`
    const newLayer = { id: newId, name: `Layer ${s.layers.length + 1}`, visible: true, locked: false }
    return {
      layers: [...s.layers, newLayer], // Add to top (end of array)
      activeLayerId: newId
    }
  }),
  removeLayer: (id) => set((s) => {
    if (s.layers.length <= 1) return s // Minimum 1 layer
    const filtered = s.layers.filter(l => l.id !== id)
    return {
      layers: filtered,
      activeLayerId: s.activeLayerId === id ? filtered[0].id : s.activeLayerId
    }
  }),
  setActiveLayer: (id) => set({ activeLayerId: id }),
  renameLayer: (id, name) => set((s) => ({
    layers: s.layers.map(l => l.id === id ? { ...l, name } : l)
  })),
  toggleLayerVisibility: (id) => set((s) => ({
    layers: s.layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l)
  })),
  toggleLayerLock: (id) => set((s) => ({
    layers: s.layers.map(l => l.id === id ? { ...l, locked: !l.locked } : l)
  })),
  reorderLayers: (startIndex, endIndex) => set((s) => {
    const result = Array.from(s.layers)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)
    return { layers: result }
  })
}))
