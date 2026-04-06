import {
  MousePointer2,
  Shapes,
  Minus,
  MoveRight,
  Type,
  Pencil
} from 'lucide-react'
import { useEditorStore, Tool } from '../../stores/editor-store'

interface ToolDef {
  id: Tool
  icon: React.ReactNode
  label: string
  group: number
}

const tools: ToolDef[] = [
  { id: 'select', icon: <MousePointer2 size={18} />, label: 'Select (V)', group: 0 },
  { id: 'rect' as any, icon: <Shapes size={18} />, label: 'Shapes / Assets', group: 1 }, // We'll use this to toggle panel
  { id: 'line', icon: <Minus size={18} />, label: 'Line (L)', group: 2 },
  { id: 'arrow', icon: <MoveRight size={18} />, label: 'Arrow', group: 2 },
  { id: 'text', icon: <Type size={18} />, label: 'Text (T)', group: 3 },
  { id: 'freehand', icon: <Pencil size={18} />, label: 'Freehand (P)', group: 3 }
]

export default function Toolbar() {
  const { activeTool, setActiveTool, showAssetPanel, toggleAssetPanel } = useEditorStore()

  const handleToolClick = (toolId: Tool) => {
    if ((toolId as string) === 'rect') { // This is our Asset Panel toggle
      toggleAssetPanel()
    } else {
      setActiveTool(toolId)
    }
  }

  return (
    <div className="toolbar">
      {tools.map((tool, index) => {
        const prevTool = index > 0 ? tools[index - 1] : null
        const showSep = prevTool !== null && tool.group !== prevTool.group
        
        let isActive = activeTool === tool.id
        if ((tool.id as string) === 'rect' && showAssetPanel) {
          isActive = true
        }

        return (
          <div key={tool.id}>
            {showSep && <div className="toolbar-separator" />}
            <button
              className={`tool-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleToolClick(tool.id)}
              aria-label={tool.label}
            >
              {tool.icon}
              <span className="tooltip">{tool.label}</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
