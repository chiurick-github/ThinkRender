import { useRef, useEffect, useState, useCallback } from 'react'
import { useEditorStore } from '../../stores/editor-store'
import { useFileStore } from '../../stores/file-store'
import { useHistoryStore } from '../../stores/history-store'

import * as fabric from 'fabric'
import ContextMenu from './ContextMenu'

export default function CanvasEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)

  const { activeTool, setActiveTool, zoom, setZoom, setSelectedObjects, layers } = useEditorStore()
  const { activePageId, updatePageData, pages } = useFileStore()
  const { pushState } = useHistoryStore()

  const isDrawing = useRef(false)
  const startPoint = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const currentShape = useRef<fabric.FabricObject | null>(null)
  
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean; target: any } | null>(null)

  function getArrowPoints(dx: number, dy: number) {
    const angle = Math.atan2(dy, dx)
    const headLen = 15
    const headAngle = Math.PI / 6
    
    const x1 = dx - headLen * Math.cos(angle - headAngle)
    const y1 = dy - headLen * Math.sin(angle - headAngle)
    const x2 = dx - headLen * Math.cos(angle + headAngle)
    const y2 = dy - headLen * Math.sin(angle + headAngle)
    
    return [
      ['M', 0, 0],
      ['L', dx, dy],
      ['M', dx, dy],
      ['L', x1, y1],
      ['M', dx, dy],
      ['L', x2, y2]
    ]
  }

  function getStarPoints(w: number, h: number) {
    const points = []
    const cx = w / 2
    const cy = h / 2
    const outerRadius = Math.min(w, h) / 2
    const innerRadius = outerRadius * 0.4
    const spikes = 5
    let rot = Math.PI / 2 * 3
    const step = Math.PI / spikes

    for (let i = 0; i < spikes; i++) {
      points.push({ x: cx + Math.cos(rot) * outerRadius, y: cy + Math.sin(rot) * outerRadius })
      rot += step
      points.push({ x: cx + Math.cos(rot) * innerRadius, y: cy + Math.sin(rot) * innerRadius })
      rot += step
    }
    return points
  }

  function getArrowPath(p1: { x: number, y: number }, p2: { x: number, y: number }) {
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
    const headLen = 15
    const x = p2.x - headLen * Math.cos(angle - Math.PI / 6)
    const y = p2.y - headLen * Math.sin(angle - Math.PI / 6)
    const x2 = p2.x - headLen * Math.cos(angle + Math.PI / 6)
    const y2 = p2.y - headLen * Math.sin(angle + Math.PI / 6)
    
    return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} M ${p2.x} ${p2.y} L ${x} ${y} M ${p2.x} ${p2.y} L ${x2} ${y2}`
  }

  function updateSelection(canvas: fabric.Canvas) {
    const active = canvas.getActiveObjects()
    const objs = active.map((obj) => ({
      id: (obj as any).id || String(canvas.getObjects().indexOf(obj)),
      type: obj.type || 'object',
      left: Math.round(obj.left || 0),
      top: Math.round(obj.top || 0),
      width: Math.round((obj.width || 0) * (obj.scaleX || 1)),
      height: Math.round((obj.height || 0) * (obj.scaleY || 1)),
      angle: Math.round(obj.angle || 0),
      fill: typeof obj.fill === 'string' ? obj.fill : '#000000',
      stroke: typeof obj.stroke === 'string' ? obj.stroke : 'none',
      strokeWidth: obj.strokeWidth || 0,
      opacity: obj.opacity ?? 1
    }))
    setSelectedObjects(objs)
  }

  const syncCanvasStackWithLayers = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const { layers } = useEditorStore.getState()
    // Logical Layer order: [Bottom (0), ..., Top (N)]
    // Fabric Stack order: [Bottom (0), ..., Top (M)]
    // No reverse needed now.
    
    const currentObjects = canvas.getObjects()
    const sortedObjects: fabric.FabricObject[] = []

    // Grouping must be thorough
    layers.forEach(layer => {
      const layerObjects = currentObjects.filter(obj => (obj as any).layerId === layer.id)
      sortedObjects.push(...layerObjects)
    })

    // Handle orphans (always at bottom)
    const orphans = currentObjects.filter(obj => !((obj as any).layerId))
    if (orphans.length > 0) {
      sortedObjects.unshift(...orphans)
    }

    // Direct mutation of private _objects is the most reliable way in Fabric to skip expensive re-adds
    if (sortedObjects.length === currentObjects.length) {
      ;(canvas as any)._objects = sortedObjects
      canvas.requestRenderAll()
    }
  }, [])

  function saveCanvasState(canvas: fabric.Canvas) {
    const data = JSON.stringify(canvas.toObject(['id', 'layerId', 'name', 'locked']))
    updatePageData(activePageId, data)
    pushState('Edit', data)
  }

  // Watch for logical layer changes (order/count/visibility/lock)
  useEffect(() => {
    syncCanvasStackWithLayers()
  }, [layers, syncCanvasStackWithLayers])

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    const container = containerRef.current
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: '#ffffff',
      selection: true,
      renderOnAddRemove: false,
      preserveObjectStacking: true
    })

    fabricRef.current = canvas

    // Selection events
    canvas.on('selection:created', () => updateSelection(canvas))
    canvas.on('selection:updated', () => updateSelection(canvas))
    canvas.on('selection:cleared', () => setSelectedObjects([]))

    // Object modified → save state
    canvas.on('object:modified', () => {
      saveCanvasState(canvas)
      updateSelection(canvas)
    })

    // Resize observer
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        canvas.setDimensions({ width, height })
        canvas.renderAll()
      }
    })
    observer.observe(container)

    // Zoom with mouse wheel
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY
      let newZoom = canvas.getZoom() * (0.999 ** delta)
      newZoom = Math.max(0.1, Math.min(5, newZoom))
      canvas.zoomToPoint(new fabric.Point(opt.e.offsetX, opt.e.offsetY), newZoom)
      setZoom(Math.round(newZoom * 100))
      opt.e.preventDefault()
      opt.e.stopPropagation()
    })

    // Initial state
    canvas.renderAll()
    pushState('Initial', canvas.toSVG())

    return () => {
      observer.disconnect()
      canvas.dispose()
      fabricRef.current = null
    }
  }, [])

  // Load page content when active page changes
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const page = pages.find((p) => p.id === activePageId)
    if (page && page.canvasData) {
      canvas.loadFromJSON(page.canvasData).then(() => {
        canvas.renderAll()
      })
    } else {
      canvas.clear()
      canvas.backgroundColor = '#ffffff'
      canvas.renderAll()
    }
  }, [activePageId])

  // Handle tool changes
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    if (activeTool === 'select') {
      canvas.isDrawingMode = false
      canvas.selection = true
      canvas.defaultCursor = 'default'
      canvas.forEachObject((obj) => {
        obj.selectable = true
        obj.evented = true
      })
    } else if (activeTool === 'freehand') {
      canvas.isDrawingMode = true
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = 2
        canvas.freeDrawingBrush.color = '#1e1e2e'
      }
    } else {
      canvas.isDrawingMode = false
      canvas.selection = false
      canvas.defaultCursor = 'crosshair'
      canvas.forEachObject((obj) => {
        obj.selectable = false
        obj.evented = false
      })
    }
    canvas.renderAll()
  }, [activeTool])

  // Shape drawing handlers
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const shapeTools = ['rect', 'circle', 'line', 'arrow', 'triangle', 'star', 'text']
    if (!shapeTools.includes(activeTool)) return

    const handleMouseDown = (opt: fabric.TPointerEventInfo) => {
      if (activeTool === 'select' || activeTool === 'freehand') return
      isDrawing.current = true
      const pointer = canvas.getScenePoint(opt.e)
      startPoint.current = { x: pointer.x, y: pointer.y }

      let shape: fabric.FabricObject | null = null

      if (activeTool === 'text') {
        const text = new fabric.IText('Text', {
          left: pointer.x,
          top: pointer.y,
          fontSize: 24,
          fontFamily: 'Inter, sans-serif',
          fill: '#1e1e2e'
        })
        canvas.add(text)
        canvas.setActiveObject(text)
        text.enterEditing()
        canvas.renderAll()
        saveCanvasState(canvas)
        setActiveTool('select')
        return
      }

      if (activeTool === 'rect') {
        shape = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          originX: 'left',
          originY: 'top',
          width: 0,
          height: 0,
          fill: '#89b4fa',
          stroke: '#1e1e2e',
          strokeWidth: 2,
          strokeUniform: true
        })
      } else if (activeTool === 'circle') {
        shape = new fabric.Ellipse({
          left: pointer.x,
          top: pointer.y,
          originX: 'left',
          originY: 'top',
          rx: 0,
          ry: 0,
          fill: '#a6e3a1',
          stroke: '#1e1e2e',
          strokeWidth: 2,
          strokeUniform: true
        })
      } else if (activeTool === 'line') {
        shape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          originX: 'left',
          originY: 'top',
          stroke: '#1e1e2e',
          strokeWidth: 2,
          strokeUniform: true
        })
      } else if (activeTool === 'arrow') {
        shape = new fabric.Path(getArrowPoints(0, 0) as any, {
          originX: 'left',
          originY: 'top',
          stroke: '#1e1e2e',
          strokeWidth: 2,
          fill: 'transparent',
          strokeUniform: true
        })
      } else if (activeTool === 'triangle') {
        shape = new fabric.Triangle({
          left: pointer.x,
          top: pointer.y,
          originX: 'left',
          originY: 'top',
          width: 0,
          height: 0,
          fill: '#f9e2af',
          stroke: '#1e1e2e',
          strokeWidth: 2,
          strokeUniform: true
        })
      } else if (activeTool === 'star') {
        shape = new fabric.Polygon(getStarPoints(0, 0), {
          left: pointer.x,
          top: pointer.y,
          originX: 'left',
          originY: 'top',
          fill: '#f38ba8',
          stroke: '#1e1e2e',
          strokeWidth: 2,
          strokeUniform: true,
          exactBoundingBox: true
        } as any)
      }

      if (shape) {
        canvas.add(shape)
        currentShape.current = shape
        canvas.renderAll()
      }
    }

    const handleMouseMove = (opt: fabric.TPointerEventInfo) => {
      if (!isDrawing.current || !currentShape.current) return
      const pointer = canvas.getScenePoint(opt.e)
      const sx = startPoint.current.x
      const sy = startPoint.current.y
      const shape = currentShape.current

      if (activeTool === 'rect' || activeTool === 'triangle') {
        const w = Math.abs(pointer.x - sx)
        const h = Math.abs(pointer.y - sy)
        shape.set({
          left: Math.min(sx, pointer.x),
          top: Math.min(sy, pointer.y),
          width: w,
          height: h
        })
      } else if (activeTool === 'star') {
        const w = (pointer.x - sx)
        const h = (pointer.y - sy)
        const absW = Math.abs(w)
        const absH = Math.abs(h)
        const poly = shape as fabric.Polygon
        
        // Use absolute dimensions for the star generation
        const points = getStarPoints(absW, absH)
        poly.set({ points })
        
        const dims = (poly as any)._calcDimensions()
        poly.set({
          width: dims.width,
          height: dims.height,
          pathOffset: dims.pathOffset,
          // Vertex compensation: Offset the object position by its internal bounding box offset
          left: Math.min(sx, pointer.x) - dims.left,
          top: Math.min(sy, pointer.y) - dims.top
        })
        poly.setCoords()
      } else if (activeTool === 'circle') {
        const rx = Math.abs(pointer.x - sx) / 2
        const ry = Math.abs(pointer.y - sy) / 2
        ;(shape as fabric.Ellipse).set({
          left: Math.min(sx, pointer.x),
          top: Math.min(sy, pointer.y),
          rx,
          ry
        })
      } else if (activeTool === 'line') {
        (shape as fabric.Line).set({ x2: pointer.x, y2: pointer.y })
      } else if (activeTool === 'arrow') {
        const path = shape as fabric.Path
        const dx = pointer.x - sx
        const dy = pointer.y - sy
        const newPath = getArrowPoints(dx, dy)
        path.set({ path: newPath as any })
        
        const dims = (path as any)._calcDimensions()
        path.set({
          width: dims.width,
          height: dims.height,
          pathOffset: dims.pathOffset,
          // For Arrow, we use start point as anchor, but adjust for bounding box
          left: sx - dims.left, 
          top: sy - dims.top
        })
        path.setCoords()
      }

      canvas.renderAll()
    }

    const handleMouseUp = () => {
      if (!isDrawing.current) return
      isDrawing.current = false

      if (currentShape.current) {
        const shape = currentShape.current
        shape.setCoords()

        // If shape is too small, remove it
        const bounds = shape.getBoundingRect()
        if (bounds.width < 3 && bounds.height < 3) {
          canvas.remove(shape)
        }

        currentShape.current = null
        saveCanvasState(canvas)
      }

      // Switch back to select after drawing
      canvas.forEachObject((obj) => {
        obj.selectable = true
        obj.evented = true
      })
      canvas.selection = true
      canvas.defaultCursor = 'default'
      setActiveTool('select')
      canvas.renderAll()
    }

    const handleContextMenu = (e: any) => {
      const nativeEvent = e.e as MouseEvent
      if (nativeEvent && nativeEvent.button === 2) { // 2 is right click
        const target = e.target as fabric.FabricObject
        if (target) {
          if (!canvas.getActiveObjects().includes(target)) {
            canvas.setActiveObject(target)
            canvas.renderAll()
            updateSelection(canvas)
          }
          const { clientX, clientY } = nativeEvent
          setContextMenu({ x: clientX, y: clientY, visible: true, target })
        } else {
          setContextMenu(null)
          canvas.discardActiveObject()
          canvas.renderAll()
          updateSelection(canvas)
        }
      } else if (nativeEvent && nativeEvent.button === 0) {
        setContextMenu(null) // Left click closes menu initially
      }
    }

    canvas.on('mouse:down', handleMouseDown)
    canvas.on('mouse:move', handleMouseMove)
    canvas.on('mouse:up', handleMouseUp)
    canvas.on('mouse:down', handleContextMenu)

    return () => {
      canvas.off('mouse:down', handleMouseDown)
      canvas.off('mouse:move', handleMouseMove)
      canvas.off('mouse:up', handleMouseUp)
      canvas.off('mouse:down', handleContextMenu)
    }
  }, [activeTool, setActiveTool])

  // Track Object Layer State and Broadcast
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const broadcastLayerUpdate = () => {
      const objects = canvas.getObjects()
      const payload = objects.map(obj => ({
        id: (obj as any).id || '',
        layerId: (obj as any).layerId || 'layer-1',
        type: obj.type,
        name: (obj as any).name || obj.type,
        locked: !obj.selectable,
        visible: obj.visible,
        isGroup: obj.type === 'group'
      }))
      const event = new CustomEvent('fabric:layer-sync', { detail: payload })
      window.dispatchEvent(event)
    }

    const handleObjectAdded = (e: any) => {
      if (!e.target) return
      if (!(e.target as any).id) {
        ;(e.target as any).id = `obj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
      if (!(e.target as any).layerId) {
        ;(e.target as any).layerId = useEditorStore.getState().activeLayerId
      }
      broadcastLayerUpdate()
      syncCanvasStackWithLayers()
    }

    canvas.on('object:added', handleObjectAdded)
    canvas.on('object:removed', () => {
      broadcastLayerUpdate()
      syncCanvasStackWithLayers()
    })
    canvas.on('object:modified', broadcastLayerUpdate)

    // Initial broadcast
    broadcastLayerUpdate()

    return () => {
      canvas.off('object:added', handleObjectAdded)
      canvas.off('object:removed', () => {
        broadcastLayerUpdate()
        syncCanvasStackWithLayers()
      })
      canvas.off('object:modified', broadcastLayerUpdate)
    }
  }, [syncCanvasStackWithLayers])



  // Expose canvas for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const canvas = fabricRef.current
      if (!canvas) return

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
        const active = canvas.getActiveObjects()
        active.forEach((obj) => canvas.remove(obj))
        canvas.discardActiveObject()
        canvas.renderAll()
        saveCanvasState(canvas)
      }

      // Tool shortcuts
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'v' || e.key === 'V') setActiveTool('select')
      if (e.key === 'r' || e.key === 'R') setActiveTool('rect')
      if (e.key === 'c' && !e.metaKey && !e.ctrlKey) setActiveTool('circle')
      if (e.key === 'l' || e.key === 'L') setActiveTool('line')
      if (e.key === 't' || e.key === 'T') setActiveTool('text')
      if (e.key === 'p' || e.key === 'P') setActiveTool('freehand')

      // Group
      if ((e.metaKey || e.ctrlKey) && e.key === 'g' && !e.shiftKey) {
        e.preventDefault()
        const active = canvas.getActiveObject()
        if (active && active.type === 'activeSelection') {
          const group = (active as any).group()
          canvas.setActiveObject(group)
          canvas.renderAll()
          saveCanvasState(canvas)
        }
      }

      // Ungroup
      if ((e.metaKey || e.ctrlKey) && e.key === 'g' && e.shiftKey) {
        e.preventDefault()
        const active = canvas.getActiveObject()
        if (active && active.type === 'group') {
          const items = (active as fabric.Group).getObjects()
          ;(active as any).dispose()
          canvas.remove(active)
          items.forEach((obj) => canvas.add(obj))
          canvas.renderAll()
          saveCanvasState(canvas)
        }
      }

      // Select All
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault()
        canvas.discardActiveObject()
        const sel = new fabric.ActiveSelection(canvas.getObjects(), { canvas })
        canvas.setActiveObject(sel)
        canvas.renderAll()
      }

      // Copy / Paste
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        const active = canvas.getActiveObject()
        if (active) {
          active.clone().then((cloned: fabric.FabricObject) => {
            (window as any).__svgClipboard = cloned
          })
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        const cloned = (window as any).__svgClipboard
        if (cloned) {
          cloned.clone().then((pastedObj: fabric.FabricObject) => {
            pastedObj.set({
              left: (pastedObj.left || 0) + 20,
              top: (pastedObj.top || 0) + 20,
              evented: true
            })
            canvas.add(pastedObj)
            canvas.setActiveObject(pastedObj)
            canvas.renderAll()
            saveCanvasState(canvas)
          })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTool, activePageId])

  // Asset Insertion Listener
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const handleInsertAsset = (e: any) => {
      const asset = e.detail
      const center = canvas.getCenterPoint()
      let obj: fabric.FabricObject | null = null

      if (asset.category === 'basic') {
        // Shapes are handled by drawing mode usually, but we can stamp them here too
        if (asset.type === 'rect') {
          obj = new fabric.Rect({ width: 100, height: 100, fill: '#89b4fa' })
        } else if (asset.type === 'circle') {
          obj = new fabric.Ellipse({ rx: 50, ry: 50, fill: '#a6e3a1' })
        } else if (asset.type === 'triangle') {
          obj = new fabric.Triangle({ width: 100, height: 100, fill: '#f9e2af' })
        } else if (asset.type === 'star') {
          obj = new fabric.Polygon(getStarPoints(100, 100), { fill: '#f38ba8' })
        }
      } else if (asset.type === 'path') {
        obj = new fabric.Path(asset.path, {
          fill: asset.category === 'icons' ? 'transparent' : '#89b4fa',
          stroke: '#1e1e2e',
          strokeWidth: 2
        })
      } else if (asset.type === 'group' && asset.data) {
        const objects = asset.data.objects.map((o: any) => {
          if (o.type === 'rect') return new fabric.Rect(o)
          if (o.type === 'text') return new fabric.IText(o.text, o)
          return null
        }).filter(Boolean) as fabric.FabricObject[]
        obj = new fabric.Group(objects)
      }

      if (obj) {
        obj.set({
          left: center.x - (obj.width || 0) / 2,
          top: center.y - (obj.height || 0) / 2,
          id: `obj-${Date.now()}`,
          layerId: useEditorStore.getState().activeLayerId
        })
        canvas.add(obj)
        canvas.setActiveObject(obj)
        canvas.renderAll()
        saveCanvasState(canvas)
      }
    }

    window.addEventListener('canvas:insert-asset', handleInsertAsset as EventListener)
    return () => window.removeEventListener('canvas:insert-asset', handleInsertAsset as EventListener)
  }, [])

  // Listen for IPC menu events
  useEffect(() => {
    const api = window.electronAPI
    if (!api) return

    const unsubs = [
      api.on('menu:new-file', () => useFileStore.getState().resetFile()),
      api.on('menu:save', () => {
        const canvas = fabricRef.current
        if (!canvas) return
        const svg = canvas.toSVG()
        const { filePath } = useFileStore.getState()
        api.file.save({ content: svg, filePath: filePath || undefined }).then((res: any) => {
          if (res.success && res.filePath) {
            const name = res.filePath.split('/').pop() || 'Untitled'
            useFileStore.getState().setFilePath(res.filePath)
            useFileStore.getState().setFileName(name)
            useFileStore.getState().setModified(false)
          }
        })
      }),
      api.on('menu:save-as', () => {
        const canvas = fabricRef.current
        if (!canvas) return
        const svg = canvas.toSVG()
        api.file.saveAs({ content: svg }).then((res: any) => {
          if (res.success && res.filePath) {
            const name = res.filePath.split('/').pop() || 'Untitled'
            useFileStore.getState().setFilePath(res.filePath)
            useFileStore.getState().setFileName(name)
            useFileStore.getState().setModified(false)
          }
        })
      }),
      api.on('file:opened', (data: any) => {
        const canvas = fabricRef.current
        if (!canvas) return
        const { filePath, content } = data
        const name = filePath.split('/').pop() || 'Untitled'
        useFileStore.getState().setFilePath(filePath)
        useFileStore.getState().setFileName(name)
        useFileStore.getState().setModified(false)

        fabric.loadSVGFromString(content).then((result) => {
          canvas.clear()
          canvas.backgroundColor = '#ffffff'
          const objects = result.objects.filter(Boolean) as fabric.FabricObject[]
          objects.forEach((obj) => canvas.add(obj))
          canvas.renderAll()
          saveCanvasState(canvas)
        })
      }),
      api.on('menu:undo', () => {
        const entry = useHistoryStore.getState().undo()
        if (entry && fabricRef.current) {
          fabricRef.current.loadFromJSON(entry.canvasSnapshot).then(() => {
            fabricRef.current!.renderAll()
          })
        }
      }),
      api.on('menu:redo', () => {
        const entry = useHistoryStore.getState().redo()
        if (entry && fabricRef.current) {
          fabricRef.current.loadFromJSON(entry.canvasSnapshot).then(() => {
            fabricRef.current!.renderAll()
          })
        }
      }),
      api.on('menu:delete', () => {
        const canvas = fabricRef.current
        if (!canvas) return
        const active = canvas.getActiveObjects()
        active.forEach((obj) => canvas.remove(obj))
        canvas.discardActiveObject()
        canvas.renderAll()
        saveCanvasState(canvas)
      }),
      api.on('menu:zoom-in', () => {
        const canvas = fabricRef.current
        if (!canvas) return
        const newZoom = Math.min(canvas.getZoom() * 1.2, 5)
        canvas.setZoom(newZoom)
        setZoom(Math.round(newZoom * 100))
        canvas.renderAll()
      }),
      api.on('menu:zoom-out', () => {
        const canvas = fabricRef.current
        if (!canvas) return
        const newZoom = Math.max(canvas.getZoom() / 1.2, 0.1)
        canvas.setZoom(newZoom)
        setZoom(Math.round(newZoom * 100))
        canvas.renderAll()
      }),
      api.on('menu:zoom-fit', () => {
        const canvas = fabricRef.current
        if (!canvas) return
        canvas.setZoom(1)
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
        setZoom(100)
        canvas.renderAll()
      }),
      api.on('menu:toggle-code', () => {
        useEditorStore.getState().toggleCodeEditor()
      }),
      api.on('menu:insert-shape', (shape: any) => {
        setActiveTool(shape)
      }),
      api.on('menu:group', () => {
        const canvas = fabricRef.current
        if (!canvas) return
        const active = canvas.getActiveObject()
        if (active && active.type === 'activeSelection') {
          const group = (active as any).group()
          canvas.setActiveObject(group)
          canvas.renderAll()
          saveCanvasState(canvas)
        }
      }),
      api.on('menu:ungroup', () => {
        const canvas = fabricRef.current
        if (!canvas) return
        const active = canvas.getActiveObject()
        if (active && active.type === 'group') {
          const items = (active as fabric.Group).getObjects()
          ;(active as any).dispose()
          canvas.remove(active)
          items.forEach((obj) => canvas.add(obj))
          canvas.renderAll()
          saveCanvasState(canvas)
        }
      }),
      api.on('menu:select-all', () => {
        const canvas = fabricRef.current
        if (!canvas) return
        canvas.discardActiveObject()
        const sel = new fabric.ActiveSelection(canvas.getObjects(), { canvas })
        canvas.setActiveObject(sel)
        canvas.renderAll()
      })
    ]

    return () => unsubs.forEach((fn) => fn?.())
  }, [])

  // Listen for Custom UI events from Property Panel
  useEffect(() => {
    const handleUpdateObject = (e: CustomEvent) => {
      const canvas = fabricRef.current
      if (!canvas) return
      const updates = e.detail
      const active = canvas.getActiveObjects()
      if (active.length > 0) {
        active.forEach((obj) => obj.set(updates))
        canvas.renderAll()
        updateSelection(canvas)
      }
    }

    const handleLayerOrder = (e: CustomEvent) => {
      const canvas = fabricRef.current
      if (!canvas) return
      const action = e.detail.action
      const active = canvas.getActiveObjects()
      if (active.length > 0) {
        active.forEach((obj) => {
          if (action === 'front') canvas.bringObjectToFront(obj)
          else if (action === 'forward') canvas.bringObjectForward(obj)
          else if (action === 'backward') canvas.sendObjectBackwards(obj)
          else if (action === 'back') canvas.sendObjectToBack(obj)
        })
        syncCanvasStackWithLayers()
        canvas.renderAll()
        updateSelection(canvas)
        saveCanvasState(canvas)
      }
    }

    const handleSaveHistory = () => {
      const canvas = fabricRef.current
      if (canvas) saveCanvasState(canvas)
    }

    const handleUpdateObjectById = (e: CustomEvent) => {
      const canvas = fabricRef.current
      if (!canvas) return
      const { id, updates } = e.detail
      const obj = canvas.getObjects().find((o: any) => o.id === id)
      if (obj) {
        obj.set(updates)
        canvas.renderAll()
        updateSelection(canvas)
        const event = new CustomEvent('fabric:layer-sync', { detail: canvas.getObjects().map((o: any) => ({
          id: o.id || '', layerId: o.layerId || 'layer-1', type: o.type, name: o.name || o.type, locked: !o.selectable, visible: o.visible, isGroup: o.type === 'group'
        }))})
        window.dispatchEvent(event)
      }
    }

    const handleSelectObject = (e: CustomEvent) => {
      const canvas = fabricRef.current
      if (!canvas) return
      const { id } = e.detail
      const obj = canvas.getObjects().find((o: any) => o.id === id)
      if (obj) {
        // Discard multi-select for panel clicking simplicity, or keep existing active and add
        canvas.discardActiveObject()
        canvas.setActiveObject(obj)
        canvas.renderAll()
        updateSelection(canvas)
      }
    }

    const handleDeleteObjects = (e: CustomEvent) => {
      const canvas = fabricRef.current
      if (!canvas) return
      const { ids } = e.detail
      const objects = canvas.getObjects().filter((o: any) => ids.includes(o.id))
      objects.forEach(obj => canvas.remove(obj))
      canvas.discardActiveObject()
      canvas.renderAll()
      updateSelection(canvas)
      saveCanvasState(canvas)
    }

    window.addEventListener('fabric:update-object', handleUpdateObject as EventListener)
    window.addEventListener('fabric:layer-order', handleLayerOrder as EventListener)
    window.addEventListener('fabric:save-history', handleSaveHistory)
    window.addEventListener('fabric:update-object-by-id', handleUpdateObjectById as EventListener)
    window.addEventListener('fabric:select-object', handleSelectObject as EventListener)
    window.addEventListener('fabric:delete-objects', handleDeleteObjects as EventListener)

    return () => {
      window.removeEventListener('fabric:update-object', handleUpdateObject as EventListener)
      window.removeEventListener('fabric:layer-order', handleLayerOrder as EventListener)
      window.removeEventListener('fabric:save-history', handleSaveHistory)
      window.removeEventListener('fabric:update-object-by-id', handleUpdateObjectById as EventListener)
      window.removeEventListener('fabric:select-object', handleSelectObject as EventListener)
      window.removeEventListener('fabric:delete-objects', handleDeleteObjects as EventListener)
    }
  }, [])

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu || !fabricRef.current) return
    const canvas = fabricRef.current
    const active = canvas.getActiveObject()
    
    if (action === 'delete') {
      const activeObjs = canvas.getActiveObjects()
      activeObjs.forEach((obj) => canvas.remove(obj))
      canvas.discardActiveObject()
    } else if (action === 'copy' && active) {
      active.clone().then((cloned: any) => { (window as any).__svgClipboard = cloned })
    } else if (action === 'paste') {
      const cloned = (window as any).__svgClipboard
      if (cloned) {
        cloned.clone().then((pastedObj: any) => {
          pastedObj.set({ left: (pastedObj.left || 0) + 20, top: (pastedObj.top || 0) + 20, evented: true })
          pastedObj.set('id', `obj-${Date.now()}`)
          canvas.add(pastedObj)
          canvas.setActiveObject(pastedObj)
          canvas.renderAll()
          saveCanvasState(canvas)
        })
      }
    } else if (action === 'group' && active && active.type === 'activeSelection') {
      const items = (active as fabric.ActiveSelection).removeAll()
      if (items) {
        const group = new fabric.Group(items)
        canvas.remove(active)
        canvas.add(group)
        canvas.setActiveObject(group)
      }
    } else if (action === 'ungroup' && active && active.type === 'group') {
      const items = (active as fabric.Group).getObjects()
      ;(active as any).dispose()
      canvas.remove(active)
      items.forEach((obj) => canvas.add(obj))
      const sel = new fabric.ActiveSelection(items, { canvas })
      canvas.setActiveObject(sel)
    } else if (['front', 'forward', 'backward', 'back'].includes(action)) {
      const activeObjs = canvas.getActiveObjects()
      activeObjs.forEach((obj) => {
        if (action === 'front') canvas.bringObjectToFront(obj)
        else if (action === 'forward') canvas.bringObjectForward(obj)
        else if (action === 'backward') canvas.sendObjectBackwards(obj)
        else if (action === 'back') canvas.sendObjectToBack(obj)
      })
      syncCanvasStackWithLayers()
    }
    
    canvas.renderAll()
    updateSelection(canvas)
    saveCanvasState(canvas)
    setContextMenu(null)
  }

  return (
    <div ref={containerRef} className="canvas-container" onContextMenu={(e) => e.preventDefault()}>
      <canvas ref={canvasRef} />
      {contextMenu?.visible && (
        <ContextMenu 
          x={contextMenu.x} 
          y={contextMenu.y} 
          onClose={() => setContextMenu({ ...contextMenu, visible: false })} 
          onAction={handleContextMenuAction}
          hasSelection={!!contextMenu.target}
          isGroup={contextMenu.target?.type === 'group'}
        />
      )}
    </div>
  )
}
