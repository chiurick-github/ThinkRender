import { useEditorStore } from '../../stores/editor-store'
import { BringToFront, SendToBack, ArrowUp, ArrowDown } from 'lucide-react'

export default function PropertyPanel() {
  const { selectedObjects } = useEditorStore()
  const obj = selectedObjects.length === 1 ? selectedObjects[0] : null

  if (selectedObjects.length === 0) {
    return (
      <div className="panel">
        <div className="panel-header">Properties</div>
        <div className="panel-section" style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: 40 }}>
          <p style={{ fontSize: 'var(--text-sm)' }}>No object selected</p>
          <p style={{ fontSize: 'var(--text-xs)', marginTop: 8 }}>
            Select an object on the canvas to view its properties
          </p>
        </div>
      </div>
    )
  }

  if (selectedObjects.length > 1) {
    return (
      <div className="panel">
        <div className="panel-header">Properties</div>
        <div className="panel-section" style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: 40 }}>
          <p style={{ fontSize: 'var(--text-sm)' }}>{selectedObjects.length} objects selected</p>
        </div>
      </div>
    )
  }

  const handleChange = (key: string, value: string | number) => {
    window.dispatchEvent(new CustomEvent('fabric:update-object', { detail: { [key]: value } }))
  }

  const handleCommit = () => {
    window.dispatchEvent(new CustomEvent('fabric:save-history'))
  }

  const handleLayer = (action: string) => {
    window.dispatchEvent(new CustomEvent('fabric:layer-order', { detail: { action } }))
  }

  return (
    <div className="panel">
      <div className="panel-header">Properties</div>

      {/* Object Type */}
      <div className="panel-section">
        <div className="panel-section-title">Object</div>
        <div className="prop-row">
          <span className="prop-label">Type</span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
            {obj?.type}
          </span>
        </div>
      </div>

      {/* Transform */}
      <div className="panel-section">
        <div className="panel-section-title">Transform</div>
        <div className="prop-row">
          <span className="prop-label" title="X Position">X</span>
          <input 
            aria-label="X Position"
            className="prop-input" type="number" 
            value={obj?.left ?? 0}
            onChange={(e) => handleChange('left', Number(e.target.value))}
            onBlur={handleCommit}
          />
          <span className="prop-label" title="Y Position">Y</span>
          <input 
            aria-label="Y Position"
            className="prop-input" type="number" 
            value={obj?.top ?? 0}
            onChange={(e) => handleChange('top', Number(e.target.value))}
            onBlur={handleCommit}
          />
        </div>
        <div className="prop-row">
          <span className="prop-label" title="Width">W</span>
          <input 
            className="prop-input" type="number" min="0"
            value={obj?.width ?? 0}
            onChange={(e) => handleChange('width', Math.max(0, Number(e.target.value)))}
            onBlur={handleCommit}
            disabled={obj?.type === 'circle' || obj?.type === 'path'}
          />
          <span className="prop-label" title="Height">H</span>
          <input 
            className="prop-input" type="number" min="0"
            value={obj?.height ?? 0}
            onChange={(e) => handleChange('height', Math.max(0, Number(e.target.value)))}
            onBlur={handleCommit}
            disabled={obj?.type === 'circle' || obj?.type === 'path'}
          />
        </div>
        <div className="prop-row">
          <span className="prop-label" title="Rotation">R</span>
          <input 
            className="prop-input" type="number" 
            value={obj?.angle ?? 0}
            onChange={(e) => handleChange('angle', Number(e.target.value))}
            onBlur={handleCommit}
          />
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>deg</span>
        </div>
      </div>

      {/* Appearance */}
      <div className="panel-section">
        <div className="panel-section-title">Appearance</div>
        <div className="prop-row" style={{ alignItems: 'center' }}>
          <span className="prop-label">Fill</span>
          <div className="color-swatch" style={{ padding: 0, overflow: 'hidden' }}>
            <input 
              type="color" 
              value={obj?.fill && obj.fill !== 'transparent' && obj.fill !== 'none' ? obj.fill : '#000000'}
              onChange={(e) => handleChange('fill', e.target.value)}
              onBlur={handleCommit}
              style={{ width: '150%', height: '150%', cursor: 'pointer', border: 'none', background: 'none' }}
            />
          </div>
          <input
            className="prop-input"
            type="text"
            value={obj?.fill ?? 'none'}
            onChange={(e) => handleChange('fill', e.target.value)}
            onBlur={handleCommit}
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>
        
        <div className="prop-row" style={{ alignItems: 'center' }}>
          <span className="prop-label">Strk</span>
          <div className="color-swatch" style={{ padding: 0, overflow: 'hidden' }}>
            <input 
              type="color" 
              value={obj?.stroke && obj.stroke !== 'transparent' && obj.stroke !== 'none' ? obj.stroke : '#000000'}
              onChange={(e) => handleChange('stroke', e.target.value)}
              onBlur={handleCommit}
              style={{ width: '150%', height: '150%', cursor: 'pointer', border: 'none', background: 'none' }}
            />
          </div>
          <input
            className="prop-input"
            type="text"
            value={obj?.stroke ?? 'none'}
            onChange={(e) => handleChange('stroke', e.target.value)}
            onBlur={handleCommit}
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>
        
        <div className="prop-row">
          <span className="prop-label" title="Stroke Width">SW</span>
          <input 
            className="prop-input" type="number" min="0" max="100"
            value={obj?.strokeWidth ?? 0}
            onChange={(e) => handleChange('strokeWidth', Math.max(0, Number(e.target.value)))}
            onBlur={handleCommit}
          />
        </div>
        
        <div className="prop-row">
          <span className="prop-label" title="Opacity">Op</span>
          <input 
            aria-label="Opacity Slider"
            type="range" 
            min="0" max="100" 
            value={Math.round((obj?.opacity ?? 1) * 100)}
            onChange={(e) => handleChange('opacity', Number(e.target.value) / 100)}
            onBlur={handleCommit}
            style={{ flex: 1, marginRight: 8 }}
          />
          <input
            aria-label="Opacity"
            className="prop-input"
            type="number"
            min="0" max="100"
            value={Math.round((obj?.opacity ?? 1) * 100)}
            onChange={(e) => handleChange('opacity', Number(e.target.value) / 100)}
            onBlur={handleCommit}
            style={{ width: 40 }}
          />
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>%</span>
        </div>
      </div>

      {/* Layer Ordering */}
      <div className="panel-section">
        <div className="panel-section-title">Layer</div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button 
            className="tool-btn" 
            onClick={() => handleLayer('front')} 
            title="Bring to Front"
            aria-label="Bring to Front"
          >
            <BringToFront size={16} />
          </button>
          <button 
            className="tool-btn" 
            onClick={() => handleLayer('forward')} 
            title="Bring Forward"
            aria-label="Bring Forward"
          >
            <ArrowUp size={16} />
          </button>
          <button 
            className="tool-btn" 
            onClick={() => handleLayer('backward')} 
            title="Send Backward"
            aria-label="Send Backward"
          >
            <ArrowDown size={16} />
          </button>
          <button 
            className="tool-btn" 
            onClick={() => handleLayer('back')} 
            title="Send to Back"
            aria-label="Send to Back"
          >
            <SendToBack size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
