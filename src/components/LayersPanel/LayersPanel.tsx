import { useEffect, useState } from 'react'
import { useEditorStore } from '../../stores/editor-store'
import { Eye, EyeOff, Lock, Unlock, Folder, Square, MousePointer2, Plus, Trash2 } from 'lucide-react'
import './LayersPanel.css'

interface CanvasObject {
  id: string
  layerId: string
  type: string
  name: string
  locked: boolean
  visible: boolean
  isGroup: boolean
}

export default function LayersPanel() {
  const { layers, activeLayerId, setActiveLayer, addLayer, removeLayer, toggleLayerVisibility, toggleLayerLock, selectedObjects } = useEditorStore()
  const [canvasObjects, setCanvasObjects] = useState<CanvasObject[]>([])

  useEffect(() => {
    const handleSync = (e: any) => {
      // Receive list of objects from CanvasEditor
      const objects = e.detail as CanvasObject[]
      // Reverse array to show highest z-index at top!
      setCanvasObjects([...objects].reverse())
    }

    window.addEventListener('fabric:layer-sync', handleSync)
    return () => window.removeEventListener('fabric:layer-sync', handleSync)
  }, [])

  const handleSelectObject = (id: string) => {
    const e = new CustomEvent('fabric:select-object', { detail: { id } })
    window.dispatchEvent(e)
  }

  const handleObjectLockToggle = (id: string, locked: boolean) => {
    const e = new CustomEvent('fabric:update-object-by-id', { detail: { id, updates: { selectable: !locked, evented: !locked } } })
    window.dispatchEvent(e)
  }

  const handleObjectVisibilityToggle = (id: string, visible: boolean) => {
    const e = new CustomEvent('fabric:update-object-by-id', { detail: { id, updates: { visible: !visible } } })
    window.dispatchEvent(e)
  }

  const handleDeleteLayer = (id: string) => {
    const hasObjects = canvasObjects.some(obj => obj.layerId === id)
    if (hasObjects) {
      if (!window.confirm('This layer contains objects. Deleting it will remove all associated objects. Are you sure?')) {
        return
      }
      // Issue delete command for these objects
      const ids = canvasObjects.filter(obj => obj.layerId === id).map(o => o.id)
      const e = new CustomEvent('fabric:delete-objects', { detail: { ids } })
      window.dispatchEvent(e)
    }
    removeLayer(id)
  }

  // Group objects by logical layer
  const objectsByLayerId: Record<string, CanvasObject[]> = {}
  layers.forEach(l => { objectsByLayerId[l.id] = [] })
  canvasObjects.forEach(obj => {
    if (!objectsByLayerId[obj.layerId]) objectsByLayerId[obj.layerId] = []
    objectsByLayerId[obj.layerId].push(obj)
  })

  return (
    <div className="layers-panel">
      <div className="layers-panel-header">
        <h3>Layers</h3>
        <button onClick={() => addLayer()} className="layer-action-btn" title="New Layer"><Plus size={16} /></button>
      </div>
      
      <div className="layers-list">
        {/* Render Layers (Reversed to match UI stack metaphor) */}
        {[...layers].reverse().map((layer) => (
          <div key={layer.id} className="layer-grouping">
            {/* Logical Layer Header */}
            <div 
              className={`layer-item logical-layer ${activeLayerId === layer.id ? 'active' : ''}`}
              onClick={() => setActiveLayer(layer.id)}
            >
              <Folder size={16} className="layer-icon" style={{ color: '#89b4fa' }}/>
              <span className="layer-name">{layer.name}</span>
              
              <div className="layer-actions">
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}
                  className="layer-action-btn"
                >
                  {layer.visible ? <Eye size={14} /> : <EyeOff size={14} className="muted" />}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleLayerLock(layer.id); }}
                  className="layer-action-btn"
                >
                  {layer.locked ? <Lock size={14} /> : <Unlock size={14} className="muted" />}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteLayer(layer.id); }}
                  className="layer-action-btn delete-btn"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Objects inside Logical Layer */}
            <div className="layer-objects">
              {objectsByLayerId[layer.id]?.length === 0 ? (
                <div className="empty-layer">No objects</div>
              ) : (
                objectsByLayerId[layer.id]?.map(obj => {
                  const isSelected = selectedObjects.some(selected => selected.id === obj.id)
                  return (
                    <div 
                      key={obj.id} 
                      className={`layer-item fabric-object ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectObject(obj.id)}
                    >
                      {obj.isGroup ? <Square size={14} className="group-border"/> : <MousePointer2 size={14}/>}
                      <span className="object-name">{obj.name}</span>
                      
                      <div className="layer-actions">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleObjectVisibilityToggle(obj.id, obj.visible); }}
                          className="layer-action-btn"
                        >
                          {obj.visible ? <Eye size={12} /> : <EyeOff size={12} className="muted" />}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleObjectLockToggle(obj.id, obj.locked); }}
                          className="layer-action-btn"
                        >
                          {obj.locked ? <Lock size={12} /> : <Unlock size={12} className="muted" />}
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
