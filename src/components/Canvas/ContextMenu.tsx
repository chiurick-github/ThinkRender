import { useEffect, useRef } from 'react'
import './ContextMenu.css'

interface ContextMenuProps {
  x: number
  y: number
  onClose: () => void
  onAction: (action: string) => void
  hasSelection: boolean
  isGroup: boolean
}

export default function ContextMenu({ x, y, onClose, onAction, hasSelection, isGroup }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Prevent immediate close on right click
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('contextmenu', handleClickOutside)
    }, 10)

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('contextmenu', handleClickOutside)
    }
  }, [onClose])

  if (!hasSelection) return null

  return (
    <div 
      ref={menuRef} 
      className="context-menu" 
      style={{ left: x, top: y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="menu-item" onClick={() => onAction('copy')}>Copy</div>
      <div className="menu-item" onClick={() => onAction('paste')}>Paste</div>
      <div className="menu-item" onClick={() => onAction('delete')}>Delete</div>
      
      <div className="menu-separator"></div>
      
      {isGroup ? (
        <div className="menu-item" onClick={() => onAction('ungroup')}>Ungroup</div>
      ) : (
        <div className="menu-item" onClick={() => onAction('group')}>Group</div>
      )}
      
      <div className="menu-separator"></div>
      
      <div className="menu-item" onClick={() => onAction('front')}>Bring to Front</div>
      <div className="menu-item" onClick={() => onAction('forward')}>Bring Forward</div>
      <div className="menu-item" onClick={() => onAction('backward')}>Send Backward</div>
      <div className="menu-item" onClick={() => onAction('back')}>Send to Back</div>
    </div>
  )
}
