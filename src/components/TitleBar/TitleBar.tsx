import { Minus, Square, X } from 'lucide-react'
import { useFileStore } from '../../stores/file-store'

export default function TitleBar() {
  const { fileName, isModified } = useFileStore()

  const handleMinimize = () => window.electronAPI?.window.minimize()
  const handleMaximize = () => window.electronAPI?.window.maximize()
  const handleClose = () => window.electronAPI?.window.close()

  return (
    <div className="titlebar">
      <div className="titlebar-traffic-lights" />
      <div className="titlebar-title">
        {fileName}
        {isModified && <span className="modified"> ●</span>}
        <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 'var(--text-xs)' }}>
          — ThinkRender
        </span>
      </div>
      <div className="titlebar-controls">
        <button className="titlebar-btn" onClick={handleMinimize} aria-label="Minimize">
          <Minus size={14} />
        </button>
        <button className="titlebar-btn" onClick={handleMaximize} aria-label="Maximize">
          <Square size={11} />
        </button>
        <button className="titlebar-btn close" onClick={handleClose} aria-label="Close">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
